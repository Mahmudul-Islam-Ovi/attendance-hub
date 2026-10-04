// Creates the "attendance" database if it doesn't exist
import pg from 'pg';
const { Client } = pg;
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'SMTL1234',
  database: 'postgres',
});
try {
  await client.connect();
  const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'attendance'`);
  if (res.rowCount === 0) {
    await client.query('CREATE DATABASE attendance');
    console.log('Database "attendance" created successfully.');
  } else {
    console.log('Database "attendance" already exists.');
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
