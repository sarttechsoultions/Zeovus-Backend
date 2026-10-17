import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z
    .string()
    .optional()
    .transform((val) => {
      const lower = (val || '').trim().toLowerCase();
      if (lower === 'production' || lower === 'prod') return 'production';
      if (lower === 'test') return 'test';
      return 'development';
    })
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_ORIGIN: z.string().optional().default('http://localhost:3000'),
  MONGODB_URI: z.string().optional(),
  DNS_SERVERS: z.string().optional(),
});

const result = schema.safeParse(process.env);
if (!result.success) {
  throw new Error(`Invalid environment configuration: ${result.error.issues.map(issue => issue.path.join('.') + ': ' + issue.message).join('; ')}`);
}
export const env = result.data;
