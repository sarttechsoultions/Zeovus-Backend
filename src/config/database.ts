import { setServers } from "node:dns/promises";
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(): Promise<void> {
  if (!env.MONGODB_URI) {
    if (env.NODE_ENV === 'production') throw new Error('MONGODB_URI is required in production');
    console.info('MongoDB is not configured. Starting without database access.');
    return;
  }
  if (env.DNS_SERVERS) {
    const servers = env.DNS_SERVERS.split(",").map(server => server.trim()).filter(Boolean);
    if (servers.length) setServers(servers);
  }
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.info('MongoDB connected');
}

