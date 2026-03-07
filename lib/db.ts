import postgres from 'postgres';

const dbUrl = new URL(process.env.DATABASE_URL!);

const sql = postgres({
    host: dbUrl.hostname,
    port: Number(dbUrl.port) || 5432,
    database: dbUrl.pathname.replace(/^\//, ''),
    username: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    ssl: { rejectUnauthorized: false },
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

export default sql;
