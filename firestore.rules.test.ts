import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { beforeAll, afterAll, afterEach, describe, it } from 'vitest';

let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-test',
    firestore: {
      rules: readFileSync('DRAFT_firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Rules - Dirty Dozen', () => {
  it('1. Unauthenticated Read: Should fail reading a client without auth', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthDb.collection('clients').doc('c1').get());
  });

  it('2. Cross-Tenant Read: Trainer A trying to read Trainer B client', async () => {
    const trainerA = testEnv.authenticatedContext('trainer-a', { email: 'a@a.com', email_verified: true }).firestore();
    
    // Seed DB with Trainer B client
    await testEnv.withSecurityRulesDisabled(async (context: any) => {
      await context.firestore().collection('clients').doc('client-b').set({
        id: 'client-b',
        trainerId: 'trainer-b',
        name: 'Client B'
      });
    });

    await assertFails(trainerA.collection('clients').doc('client-b').get());
  });

  it('3. Cross-Tenant Write: Trainer A modifying Trainer B client', async () => {
    const trainerA = testEnv.authenticatedContext('trainer-a', { email: 'a@a.com', email_verified: true }).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context: any) => {
      await context.firestore().collection('clients').doc('client-b').set({
        id: 'client-b',
        trainerId: 'trainer-b',
        name: 'Client B'
      });
    });

    await assertFails(trainerA.collection('clients').doc('client-b').update({
      name: 'Hacked'
    }));
  });

  it('4. Student Spoofing: Student trying to read another student client', async () => {
    const student1 = testEnv.authenticatedContext('student-1', { email: 's1@s.com', email_verified: true }).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context: any) => {
      await context.firestore().collection('clients').doc('client-2').set({
        id: 'client-2',
        trainerId: 'trainer-x',
        name: 'Student 2',
        email: 's2@s.com'
      });
    });

    await assertFails(student1.collection('clients').doc('client-2').get());
  });

  it('5. Trainer Privilege Escalation: Student trying to modify trainerId', async () => {
    const student1 = testEnv.authenticatedContext('student-1', { email: 's1@s.com', email_verified: true }).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (context: any) => {
      await context.firestore().collection('clients').doc('client-1').set({
        id: 'client-1',
        trainerId: 'trainer-x',
        name: 'Student 1',
        email: 's1@s.com'
      });
    });

    await assertFails(student1.collection('clients').doc('client-1').update({
      trainerId: 'trainer-hacked'
    }));
  });
});
