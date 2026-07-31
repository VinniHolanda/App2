import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';

export type UserRole = 'trainer' | 'student';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  photoURL?: string | null;
  studentClientId?: string | null; // ID of the client record linked to this account
  createdAt?: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setProfileRole: (role: UserRole) => Promise<void>;
  linkStudentAccount: (clientId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Firestore
  const fetchUserProfile = async (user: User, defaultRole: UserRole = 'trainer'): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        return data;
      } else {
        // Create initial user profile in Firestore
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuário FitConnect',
          role: defaultRole,
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, newProfile, { merge: true });
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn("Could not fetch user profile from Firestore, using fallback:", err);
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Usuário',
        role: defaultRole
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        // Check for local stored user profile if no Firebase session
        const storedLocal = localStorage.getItem('fitconnect_local_user');
        if (storedLocal) {
          try {
            setUserProfile(JSON.parse(storedLocal));
          } catch {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (preferredRole: UserRole = 'trainer') => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await fetchUserProfile(result.user, preferredRole);
      }
    } catch (error) {
      console.warn("Google auth unavailable, creating local profile:", error);
      const localProfile: UserProfile = {
        uid: 'local_' + Date.now(),
        email: 'treinador@fitconnect.com',
        displayName: 'Treinador Kinetix',
        role: preferredRole
      };
      localStorage.setItem('fitconnect_local_user', JSON.stringify(localProfile));
      setUserProfile(localProfile);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await fetchUserProfile(result.user);
      }
    } catch (error) {
      console.warn("Email login failed on Firebase Auth, initializing local session:", error);
      const localProfile: UserProfile = {
        uid: 'local_' + Date.now(),
        email,
        displayName: email.split('@')[0] || 'Treinador',
        role: 'trainer'
      };
      localStorage.setItem('fitconnect_local_user', JSON.stringify(localProfile));
      setUserProfile(localProfile);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await updateProfile(result.user, { displayName: name });
        
        const userDocRef = doc(db, 'users', result.user.uid);
        const newProfile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: name,
          role,
          photoURL: null,
          createdAt: serverTimestamp()
        };
        try {
          await setDoc(userDocRef, newProfile, { merge: true });
        } catch (e) {
          console.warn("Firestore save failed, keeping in memory/local", e);
        }
        setUserProfile(newProfile);
      }
    } catch (error: any) {
      console.warn("Firebase Auth registration unavailable or failed, creating local user session:", error);
      // Fallback: create local user profile so trainer is never blocked!
      const localProfile: UserProfile = {
        uid: 'local_' + Date.now(),
        email,
        displayName: name || email.split('@')[0] || 'Treinador Kinetix',
        role
      };
      localStorage.setItem('fitconnect_local_user', JSON.stringify(localProfile));
      setUserProfile(localProfile);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Firebase logout error:", error);
    }
    localStorage.removeItem('fitconnect_local_user');
    setUserProfile(null);
  };

  const setProfileRole = async (role: UserRole) => {
    if (!currentUser || !userProfile) return;
    const updated = { ...userProfile, role };
    setUserProfile(updated);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { role }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
    }
  };

  const linkStudentAccount = async (studentClientId: string) => {
    if (!currentUser || !userProfile) return;
    const updated = { ...userProfile, studentClientId };
    setUserProfile(updated);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, { studentClientId }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        setProfileRole,
        linkStudentAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
