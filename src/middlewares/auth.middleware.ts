import type { RequestHandler } from 'express';
import { createHash } from 'node:crypto';
import { AdminSession } from '../modules/admin/models/admin-session.model.js';
import { AdminModel } from '../modules/admin/models/admin.model.js';
import { env } from '../config/env.js';
export const requireAdmin:RequestHandler=async(req,res,next)=>{
 if(!['GET','HEAD'].includes(req.method) && req.get('origin') && req.get('origin')!==env.CLIENT_ORIGIN){res.status(403).json({success:false,message:'Origin not allowed'});return;}
 const token=req.cookies?.admin_session;
 if(typeof token!=='string'){res.status(401).json({success:false,message:'Please sign in.'});return;}
 const session=await AdminSession.findOne({tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:{$gt:new Date()}});
 const admin=session ? await AdminModel.exists({_id:session.admin,isActive:true}):null;
 if(!admin){res.status(401).json({success:false,message:'Please sign in.'});return;}next();
};
