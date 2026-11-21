require('dotenv').config();
const db = require('../src/config/db');

async function provisionAdmin() {
  const username = String(process.env.ADMIN_USERNAME || '').trim();
  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '');

  if (!username || !passwordHash) {
    throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD_HASH in backend/.env first.');
  }
  if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash)) {
    throw new Error('ADMIN_PASSWORD_HASH must be a valid bcrypt hash, not the example placeholder.');
  }

  const connection = await db.getConnection();
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;
    await connection.execute(
      `INSERT IGNORE INTO roles (role_name, description)
       VALUES ('Administrator', 'Full access to the Batloung Farm management system')`
    );
    const [roles] = await connection.execute(
      'SELECT role_id FROM roles WHERE role_name = ? LIMIT 1',
      ['Administrator']
    );
    const [existingUsers] = await connection.execute(
      'SELECT user_id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [username]
    );

    if (existingUsers.length) {
      throw new Error(`An account named "${username}" already exists; no changes were made.`);
    }

    await connection.execute(
      'INSERT INTO users (username, password_hash, role_id) VALUES (?, ?, ?)',
      [username, passwordHash, roles[0].role_id]
    );
    await connection.commit();
    transactionStarted = false;
    console.log(`Administrator account "${username}" created.`);
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

provisionAdmin()
  .catch((error) => {
    console.error('[provision-admin] Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
