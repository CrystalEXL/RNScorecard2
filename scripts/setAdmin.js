// One-off script to grant the admin custom claim to a user.
// Usage:
//   1. Firebase console -> Project settings -> Service accounts -> Generate new private key.
//      Save the downloaded file as serviceAccountKey.json in the project root (it's gitignored).
//   2. Find the target user's UID: Firebase console -> Authentication -> Users.
//   3. Run: node scripts/setAdmin.js <uid>
//
// The user must sign out and back in (or refresh their ID token) for the claim to take effect.

const admin = require('firebase-admin');
const path = require('path');

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node scripts/setAdmin.js <uid>');
  process.exit(1);
}

const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

admin
  .auth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Granted admin claim to ${uid}.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed to set admin claim:', err);
    process.exit(1);
  });
