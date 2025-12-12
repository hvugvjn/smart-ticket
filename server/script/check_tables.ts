import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:Vishal%40123@localhost:5432/smart_ticket',
});

async function checkTables() {
    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('Tables in database:', res.rows.map(r => r.table_name));
    } catch (err) {
        console.error('Error querying tables:', err);
    } finally {
        await client.end();
    }
}

checkTables();
