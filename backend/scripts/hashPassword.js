// Usage:
//   npm run hash -- <password>
// Copy the printed hash into ADMIN_PASSWORD_HASH in .env.
const bcrypt = require('bcryptjs');

const plain = process.argv[2];

if (!plain) {
  console.error('Usage: node scripts/hashPassword.js <plainPassword>');
  process.exit(1);
}

const hash = bcrypt.hashSync(plain, 10);
console.log('\nBcrypt hash:', hash);
console.log('\nPaste the hash into ADMIN_PASSWORD_HASH in backend/.env\n');