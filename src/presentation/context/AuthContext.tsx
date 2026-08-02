import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
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
  studentClientId?: string | null;
  createdAt?: any;
}

interface PendingProfile {
  displayName: string;
  role: UserRole;
}

const pendingKey = (uid: string) => `fitconnect_pending_profile_${uid}`;

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsEmailVerification: boolean;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  setProfileRole: (role: UserRole) => Promise<void>;
  linkStudentAccount: (clientId: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  const fetchUserProfile = async (user: User, fallback?: PendingProfile): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        return data;
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: fallback?.displayName || user.displayName || user.email?.split('@')[0] || 'Usuário FitConnect',
          role: fallback?.role || 'trainer',
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, newProfile, { merge: true });
        setUserProfile(newProfile);
        localStorage.removeItem(pendingKey(user.uid));
        return newProfile;
      }
    } catch (err) {
      console.warn("Could not fetch user profile from Firestore:", err);
      throw err;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          await user.reload();
        } catch (e) {
          console.warn('Falha ao recarregar usuário:', e);
        }

        if (!user.emailVerified) {
          setUserProfile(null);
          setNeedsEmailVerification(true);
          setLoading(false);
          return;
        }

        setNeedsEmailVerification(false);
        try {
          const raw = localStorage.getItem(pendingKey(user.uid));
          const pending: PendingProfile | undefined = raw ? JSON.parse(raw) : undefined;
          await fetchUserProfile(user, pending);
        } catch (e) {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        setNeedsEmailVerification(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (preferredRole: UserRole = 'trainer') => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result.user && result.user.emailVerified) {
      await fetchUserProfile(result.user, { displayName: result.user.displayName || '', role: preferredRole });
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string, role: UserRole) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await updateProfile(result.user, { displayName: name });
      localStorage.setItem(pendingKey(result.user.uid), JSON.stringify({ displayName: name, role } as PendingProfile));
      await sendEmailVerification(result.user);
      setNeedsEmailVerification(true);
      setUserProfile(null);
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  const checkEmailVerified = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    if (verified) {
      setNeedsEmailVerification(false);
      const raw = localStorage.getItem(pendingKey(auth.currentUser.uid));
      const pending: PendingProfile | undefined = raw ? JSON.parse(raw) : undefined;
      try {
        await fetchUserProfile(auth.currentUser, pending);
      } catch (e) {
        setUserProfile(null);
      }
    }
    return verified;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Firebase logout error:", error);
    }
    setUserProfile(null);
    setNeedsEmailVerification(false);
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
        needsEmailVerification,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        setProfileRole,
        linkStudentAccount,
        resendVerificationEmail,
        checkEmailVerified
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
