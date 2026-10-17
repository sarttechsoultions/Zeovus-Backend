import { Schema, model } from 'mongoose';
const schema = new Schema({
 tokenHash: { type: String, required: true, unique: true },
 admin: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
 expiresAt: { type: Date, required: true, expires: 0 },
});
export const AdminSession = model('AdminSession', schema);
