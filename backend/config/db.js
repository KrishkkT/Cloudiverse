const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 20000
});

pool.on('error', (err, client) => {
  console.error('Unexpected PG Pool Error (Idle Client)', err);
});

// Resilient Query Helper
pool.resilientQuery = async (text, params) => {
  let retries = 3;
  while (retries > 0) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      retries--;
      const isTransient = err.message.includes('terminated unexpectedly') || 
                          err.message.includes('ECONNRESET') ||
                          err.message.includes('connection error');
      
      if (isTransient && retries > 0) {
        console.warn(`[DB] Transient error, retrying (${3 - retries}/3)...`, err.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw err;
    }
  }
};

module.exports = pool;