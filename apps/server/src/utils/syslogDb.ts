
import { Pool } from 'pg';
import { env } from './env';

const SYSLOG_DB_URL: string = env.SYSLOG_DATABASE_URL || env.DATABASE_URL || (() => {
    throw new Error('SYSLOG_DATABASE_URL ou DATABASE_URL precisa ser configurada');
})();

export const syslogPool = new Pool({
    connectionString: SYSLOG_DB_URL,
});

/**
 * Helper: aguarda N ms
 */
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Inicializa a tabela de syslog no banco de dados dedicado.
 * Inclui retry com backoff para lidar com atrasos de inicialização do PostgreSQL em Docker.
 */
export async function initSyslogDb() {
    const MAX_RETRIES = 5;
    const BASE_DELAY = 2000; // 2 seconds

    // 1. Ensure Database Exists (connect to main DB instead of 'postgres' which may not exist)
    console.log('[SyslogDB] Ensuring database exists...');
    try {
        const dbUrl = new URL(SYSLOG_DB_URL);
        const dbName = dbUrl.pathname.slice(1); // remove leading '/'
        // Connect to the default maintenance database available in official Postgres images.
        dbUrl.pathname = '/postgres';

        let rootPool: Pool | null = null;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                rootPool = new Pool({ connectionString: dbUrl.toString() });
                console.log(`[SyslogDB] Connecting to maintenance DB to check '${dbName}' (attempt ${attempt}/${MAX_RETRIES})...`);
                const rootClient = await rootPool.connect();

                try {
                    const checkRes = await rootClient.query(
                        "SELECT 1 FROM pg_database WHERE datname = $1",
                        [dbName]
                    );

                    if (checkRes.rowCount === 0) {
                        console.log(`[SyslogDB] Database '${dbName}' not found. Creating...`);
                        await rootClient.query(`CREATE DATABASE "${dbName}"`);
                        console.log(`[SyslogDB] Database '${dbName}' created successfully.`);
                    } else {
                        console.log(`[SyslogDB] Database '${dbName}' already exists.`);
                    }
                } finally {
                    rootClient.release();
                    await rootPool.end();
                }
                break; // success — exit retry loop
            } catch (e: any) {
                if (rootPool) {
                    try { await rootPool.end(); } catch (_) {}
                }
                if (attempt < MAX_RETRIES) {
                    const delay = BASE_DELAY * attempt;
                    console.warn(`[SyslogDB] Attempt ${attempt}/${MAX_RETRIES} failed (${e.code || e.message}). Retrying in ${delay}ms...`);
                    await sleep(delay);
                } else {
                    console.warn(`[SyslogDB] All ${MAX_RETRIES} attempts failed. Assuming database exists.`, e.message || e);
                }
            }
        }
    } catch (e) {
        console.warn('[SyslogDB] Warning: Could not check/create database. Assuming it exists or permissions are restricted.');
    }

    // 2. Initialize Schema (also with retry)
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[SyslogDB] Connecting to syslog pool to initialize schema (attempt ${attempt}/${MAX_RETRIES})...`);
            const client = await syslogPool.connect();
            try {
                console.log('[SyslogDB] Initializing schema (CREATE TABLE IF NOT EXISTS)...');
                await client.query(`
                    CREATE TABLE IF NOT EXISTS syslog_entries (
                        id SERIAL PRIMARY KEY,
                        timestamp TIMESTAMP NOT NULL,
                        hostname TEXT NOT NULL,
                        facility INTEGER,
                        severity INTEGER,
                        tag TEXT,
                        message TEXT,
                        raw_message TEXT,
                        device_id TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS idx_syslog_timestamp ON syslog_entries(timestamp);
                    CREATE INDEX IF NOT EXISTS idx_syslog_hostname ON syslog_entries(hostname);
                    CREATE INDEX IF NOT EXISTS idx_syslog_device_id ON syslog_entries(device_id);
                    CREATE INDEX IF NOT EXISTS idx_syslog_severity ON syslog_entries(severity);
                `);
                console.log('[SyslogDB] Database initialized successfully');
            } finally {
                client.release();
            }
            break; // success
        } catch (error: any) {
            if (attempt < MAX_RETRIES) {
                const delay = BASE_DELAY * attempt;
                console.warn(`[SyslogDB] Schema init attempt ${attempt}/${MAX_RETRIES} failed (${error.code || error.message}). Retrying in ${delay}ms...`);
                await sleep(delay);
            } else {
                console.error('[SyslogDB] Failed to initialize database after all retries:', error.message || error);
            }
        }
    }
}

