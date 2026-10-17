import {Router} from 'express';
import {rateLimit} from 'express-rate-limit';
import {requireAdmin} from '../../../middlewares/auth.middleware.js';
import {env} from '../../../config/env.js';
import {createEnquiry,listEnquiries,updateEnquiry} from '../controllers/enquiry.controller.js';
export const enquiryRoutes=Router();
enquiryRoutes.post('/',rateLimit({windowMs:15*60*1000,limit:20,message:{message:'Too many enquiries. Please try again later.'}}),(req,res,next)=>{if(req.get('origin')&&req.get('origin')!==env.CLIENT_ORIGIN){res.status(403).json({message:'Origin not allowed'});return;}next();},createEnquiry);
enquiryRoutes.get('/',requireAdmin,listEnquiries);
enquiryRoutes.patch('/:id',requireAdmin,updateEnquiry);
