import fs from 'fs';
let rules = fs.readFileSync('firestore.rules', 'utf8');

const newRule = `    function isValidTemplate(data) {
      return data.keys().hasAll(['id', 'trainerId', 'name'])
        && data.id is string && data.id.size() <= 128
        && data.trainerId is string && data.trainerId.size() <= 128
        && data.name is string && data.name.size() <= 100;
    }

    match /templates/{templateId} {
      allow get: if isSignedIn() && isValidId(templateId) && existing().trainerId == request.auth.uid;
      allow list: if isSignedIn() && existing().trainerId == request.auth.uid;
      allow create: if isSignedIn()
        && isValidId(templateId)
        && isValidTemplate(incoming())
        && incoming().trainerId == request.auth.uid;
      allow update: if isSignedIn()
        && isValidId(templateId)
        && isValidTemplate(incoming())
        && existing().trainerId == request.auth.uid
        && incoming().trainerId == existing().trainerId;
      allow delete: if isSignedIn()
        && isValidId(templateId)
        && existing().trainerId == request.auth.uid;
    }

  }
}`;

rules = rules.replace(/  }\n}/, newRule);
fs.writeFileSync('firestore.rules', rules);
