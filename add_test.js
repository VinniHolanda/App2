import fs from 'fs';
let tests = fs.readFileSync('firestore.rules.test.ts', 'utf8');

const newTest = `  it('6. Templates: Trainer A cannot read Trainer B template', async () => {
    const trainerA = testEnv.authenticatedContext('trainer-a', { email: 'a@a.com', email_verified: true }).firestore();
    
    // Seed DB with Trainer B template
    await testEnv.withSecurityRulesDisabled(async (context: any) => {
      await context.firestore().collection('templates').doc('template-b').set({
        id: 'template-b',
        trainerId: 'trainer-b',
        name: 'Template B'
      });
    });

    await assertFails(trainerA.collection('templates').doc('template-b').get());
  });
});`;

tests = tests.replace(/\}\);\s*$/, newTest);
fs.writeFileSync('firestore.rules.test.ts', tests);
