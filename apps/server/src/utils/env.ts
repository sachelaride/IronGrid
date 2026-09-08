import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';
const DEFAULT_INFLUX_TOKEN = 'irongrid-influx-token-104042019';
const defaultIfBlank = (defaultValue: string) => (value: unknown) =>
    typeof value === 'string' && value.trim() === '' ? defaultValue : value;

const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DEV_PORT: z.coerce.number().int().positive().default(3001),
    DEBUG: z.enum(['true', 'false']).default('false'),
    ALLOWED_ORIGIN: z.string().min(1).default('http://localhost:3001'),
    DATABASE_URL: z.string().url().optional(),
    SYSLOG_DATABASE_URL: z.string().url().optional(),
    JWT_SECRET: isProduction ? z.string().min(32) : z.string().min(8).default('irongrid-dev-secret-change-me'),
    AGENT_INGEST_TOKEN: isProduction ? z.string().min(16) : z.string().min(8).optional(),
    INFLUX_URL: z.string().url().default('http://localhost:8086'),
    INFLUX_TOKEN: z.preprocess(
        defaultIfBlank(DEFAULT_INFLUX_TOKEN),
        z.string().min(16).default(DEFAULT_INFLUX_TOKEN)
    ),
    INFLUX_ORG: z.string().min(1).default('irongrid'),
    INFLUX_BUCKET: z.string().min(1).default('metrics'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('[ENV] Invalid environment configuration', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export const isDebug = env.DEBUG === 'true';
