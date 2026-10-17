import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_ORIGIN: z.url().default('http://localhost:3000'),
  MONGODB_URI: z.string().optional(),
  DNS_SERVERS: z.string().optional(),
});
const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(`Invalid environment configuration: ${result.error.issues.map(issue => issue.path.join('.') + ': ' + issue.message).join('; ')}`);
}
export const env = result.data;

