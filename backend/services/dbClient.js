// dbClient.js
import pkg from 'pg';
const { Pool } = pkg;

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'myapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',

    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,

    // SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,

    // Additional options
    application_name: process.env.APP_NAME || 'MyApp',
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
};

// Create a new connection pool
const pool = new Pool(config);

// Optional: helper function for querying
export const query = async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
};

// Optional: get raw pool instance for transactions
export const getClient = async () => {
    const client = await pool.connect();
    const release = client.release;
    // Monkey patch release to log errors
    client.release = () => {
        console.log('Releasing DB client');
        release.call(client);
    };
    return client;
};

export default pool;
