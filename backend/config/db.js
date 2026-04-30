const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  min: 2,
  idleTimeoutMillis: 10000, // Reduced to 10s for better compatibility with serverless/Neon idle kills
  connectionTimeoutMillis: 20000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

pool.on('error', (err, client) => {
  // Check if it's an expected idle termination from the server (common in serverless PG)
  const msg = err.message || '';
  if (msg.includes('terminated') || msg.includes('ECONNRESET') || msg.includes('connection error')) {
    console.warn('[DB] Client connection issue (often idle termination in serverless):', msg);
  } else {
    console.error('Unexpected PG Pool Error:', msg);
  }
});


// Resilient Query Helper
pool.resilientQuery = async (text, params) => {
  let retries = 3;
  while (retries > 0) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      retries--;
      const msg = err.message || '';
      const isTransient = msg.includes('terminated') || 
                          msg.includes('ECONNRESET') ||
                          msg.includes('connection error');
      
      if (isTransient && retries > 0) {
        console.warn(`[DB] Transient error, retrying (${3 - retries}/3)...`, msg);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw err;
    }
  }
};

module.exports = pool;