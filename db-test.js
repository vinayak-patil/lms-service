const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function testDbConnection() {
  console.log('Testing database connection...');
  console.log('Connection details:');
  console.log(`Host: ${process.env.PGHOST}`);
  console.log(`Port: ${process.env.PGPORT}`);
  console.log(`Database: ${process.env.PGDATABASE}`);
  console.log(`User: ${process.env.PGUSER}`);
  console.log(`SSL Mode: ${process.env.PGSSLMODE}`);
  
  const connectionString = process.env.DATABASE_URL;
  console.log(`Connection string: ${connectionString}`);

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connection successful!');
    const res = await client.query('SELECT NOW()');
    console.log('Current time from DB:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testDbConnection();