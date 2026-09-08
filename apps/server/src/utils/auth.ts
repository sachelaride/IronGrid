import { env } from './env';

export function getJwtSecret(): string {
    return env.JWT_SECRET;
}
