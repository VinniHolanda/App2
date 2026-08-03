import { WorkoutTemplate } from '../../domain/types';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'templates';

export class FirebaseTemplateRepository {
  async listTemplates(trainerId: string): Promise<WorkoutTemplate[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('trainerId', '==', trainerId));
      const snapshot = await getDocs(q);
      
      const templates: WorkoutTemplate[] = [];
      snapshot.forEach(docSnap => {
        templates.push(docSnap.data() as WorkoutTemplate);
      });
      return templates;
    } catch (e) {
      console.warn("Firestore listTemplates error:", e);
      return [];
    }
  }

  async saveTemplate(template: WorkoutTemplate): Promise<WorkoutTemplate> {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Usuário não autenticado");
    if (!template.trainerId) {
      template.trainerId = uid;
    }

    try {
      // Ensure we don't save undefined values to Firestore
      const cleaned: any = {};
      Object.keys(template).forEach(key => {
        const val = (template as any)[key];
        if (val !== undefined) {
          cleaned[key] = val;
        }
      });
      if (!cleaned.createdAt) {
        cleaned.createdAt = serverTimestamp();
      }
      
      const docRef = doc(db, COLLECTION_NAME, template.id);
      await setDoc(docRef, cleaned, { merge: true });
      return template;
    } catch (e) {
      console.error("Firestore saveTemplate error:", e);
      throw e;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Firestore deleteTemplate error:", e);
      throw e;
    }
  }
}

export const templateRepository = new FirebaseTemplateRepository();
