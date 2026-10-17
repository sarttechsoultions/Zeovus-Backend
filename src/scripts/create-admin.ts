import { connectDatabase } from '../config/database.js';
import { AdminModel } from '../modules/admin/models/admin.model.js';
import { hashPassword } from '../modules/admin/services/password.service.js';
import mongoose from 'mongoose';
async function create() {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters) before creating an admin.');
    await connectDatabase();
    if (await AdminModel.exists({ email: ADMIN_EMAIL.toLowerCase() })) throw new Error('Admin already exists.');
    await AdminModel.create({ name: ADMIN_NAME || 'Administrator', email: ADMIN_EMAIL, passwordHash: await hashPassword(ADMIN_PASSWORD), role: 'super_admin' });
    console.info('Admin created.');
}
void create().catch(e => { console.error(e.message); process.exitCode = 1 }).finally(() => mongoose.disconnect());
