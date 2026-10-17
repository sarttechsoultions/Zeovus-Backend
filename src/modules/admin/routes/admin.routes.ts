import { getDashboard } from '../controllers/dashboard.controller.js';
import { requireAdmin } from '../../../middlewares/auth.middleware.js';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getAdminStatus, login, me, logout } from '../controllers/admin.controller.js';
import { env } from '../../../config/env.js';
export const adminRoutes = Router();
adminRoutes.get('/status', getAdminStatus);
const limiter = rateLimit({windowMs:15*60*1000,limit:10,skipSuccessfulRequests:true,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many failed sign-in attempts. Please wait 15 minutes before trying again."}});
adminRoutes.use((req,res,next)=>{
 if (req.method === 'POST' && req.get('origin') && req.get('origin') !== env.CLIENT_ORIGIN) { res.status(403).json({success:false,message:'Origin not allowed'}); return; }
 next();
});
adminRoutes.post('/login', limiter, login);
adminRoutes.get('/me', me);
adminRoutes.post('/logout', logout);

adminRoutes.get('/dashboard', requireAdmin, getDashboard);


