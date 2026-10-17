import { Schema, model, type InferSchemaType } from 'mongoose';

const adminSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export type Admin = InferSchemaType<typeof adminSchema>;
export const AdminModel = model('Admin', adminSchema);
