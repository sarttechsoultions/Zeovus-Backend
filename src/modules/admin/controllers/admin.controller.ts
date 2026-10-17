import type { RequestHandler } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { AdminModel } from '../models/admin.model.js';
import { AdminSession } from '../models/admin-session.model.js';
import { verifyPassword } from '../services/password.service.js';
import { env } from '../../../config/env.js';
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const cookie = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' };
export const getAdminStatus: RequestHandler = (_req,res) => { res.json({success:true,message:'Admin module is ready'}); };
export const login: RequestHandler = async (req,res) => {
 const body = z.object({ email: z.email().max(254), password: z.string().min(1).max(256) }).safeParse(req.body);
 if (!body.success) { res.status(400).json({success:false,message:'Enter a valid email and password.'}); return; }
 const admin = await AdminModel.findOne({email:body.data.email.trim().toLowerCase(),isActive:true}).select('+passwordHash');
 const valid = await verifyPassword(body.data.password,admin?.passwordHash ?? '00000000000000000000000000000000:'+ '0'.repeat(128));
 if (!admin || !valid) { res.status(401).json({success:false,message:'Invalid email or password.'}); return; }
 const token = randomBytes(32).toString('hex');
 await AdminSession.create({tokenHash:digest(token),admin:admin._id,expiresAt:new Date(Date.now()+8*60*60*1000)});
 res.cookie('admin_session',token,{...cookie,maxAge:8*60*60*1000});
 res.json({success:true,admin:{name:admin.name,email:admin.email,role:admin.role}});
};
export const me: RequestHandler = async (req,res) => {
 const token = req.cookies?.admin_session;
 const session = typeof token === 'string' ? await AdminSession.findOne({tokenHash:digest(token),expiresAt:{$gt:new Date()}}) : null;
 const admin = session ? await AdminModel.findOne({_id:session.admin,isActive:true}) : null;
 if (!admin) { res.status(401).json({success:false,message:'Please sign in.'}); return; }
 res.json({success:true,admin:{name:admin.name,email:admin.email,role:admin.role}});
};
export const logout: RequestHandler = async (req,res) => {
 if(typeof req.cookies?.admin_session === 'string') await AdminSession.deleteOne({tokenHash:digest(req.cookies.admin_session)});
 res.clearCookie('admin_session',cookie);res.json({success:true});
};
