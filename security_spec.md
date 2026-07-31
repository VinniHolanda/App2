# Security Specification - FitConnect

## 1. Data Invariants
- `users`: User profiles can only be read/written by the authenticated user themselves. Role assignment is self-determined during creation in this prototype, but ideally should be controlled.
- `clients`:
  - `trainerId` is mandatory and must match the `request.auth.uid` of the trainer.
  - A trainer can read, create, update, and delete clients where `trainerId == request.auth.uid`.
  - A student can read and update a client document where `portal.email == request.auth.token.email`.
  - No anonymous access.
- `custom_exercises`:
  - Only accessible by trainers. Assuming trainers can share exercises globally or per trainer. If it's per trainer, there must be an `ownerId`. Let's check how `custom_exercises` are implemented.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Read**: Attempting to read a client without being signed in.
2. **Cross-Tenant Read**: Trainer A trying to read Trainer B's client.
3. **Cross-Tenant Write**: Trainer A trying to modify Trainer B's client.
4. **Student Spoofing**: Student trying to read another student's client by bypassing email check.
5. **Trainer Privilege Escalation**: Student trying to modify `trainerId`.
6. **Shadow Field Injection**: Injecting an unmapped field into `users`.
7. **Invalid Type**: Setting `trainerId` to an integer instead of a string.
8. **Oversized String**: Setting `notes` to a 2MB string.
9. **Missing Required Fields**: Creating a client without `trainerId`.
10. **Unverified Email**: Student with unverified email trying to read (if enforced, though maybe we shouldn't strictly enforce email verification in prototype unless it blocks testing).
11. **List scraping**: Querying `clients` without a `where` clause matching `trainerId` or `portal.email`.
12. **User Profile Tampering**: Modifying another user's profile in `users`.
