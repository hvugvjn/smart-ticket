import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:Vishal%40123@localhost:5432/postgres',
});

async function createDb() {
    try {
        await client.connect();
        // Check if db exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'smart_ticket'");
        if (res.rowCount === 0) {
            await client.query('CREATE DATABASE smart_ticket');
            console.log('Database smart_ticket created successfully');
        } else {
            console.log('Database smart_ticket already exists');
        }
    } catch (err) {
        console.error('Error creating database:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

createDb();
