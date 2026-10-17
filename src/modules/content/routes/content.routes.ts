import {Router} from 'express';
import {z} from 'zod';
import {imageSlots} from '../../../config/site-image-slots.js';
import {requireAdmin} from '../../../middlewares/auth.middleware.js';
import {SiteImage} from '../models/site-image.model.js';
export const contentRoutes=Router();
contentRoutes.get('/images',async(_req,res)=>{const data=await SiteImage.find().select('key url alt -_id').lean();res.set('Cache-Control','no-store').json({success:true,data});});
contentRoutes.get('/slots',requireAdmin,async(_req,res)=>{res.json({success:true,data:imageSlots});});
contentRoutes.put('/images/:key',requireAdmin,async(req,res)=>{
 if(!imageSlots.some(slot=>slot.key===req.params.key)){res.status(404).json({message:'Unknown website image'});return;}
 const parsed=z.object({url:z.string().max(2048).refine(u=>/^https?:\/\//.test(u)||/^\/(?!\/)/.test(u)),alt:z.string().max(500).default('')}).strict().safeParse(req.body);
 if(!parsed.success){res.status(400).json({message:'Enter a valid image URL and alternative text.'});return;}
 const data=await SiteImage.findOneAndUpdate({key:req.params.key},{$set:parsed.data},{upsert:true,new:true,runValidators:true});res.json({success:true,data});
});
contentRoutes.delete('/images/:key',requireAdmin,async(req,res)=>{if(!imageSlots.some(s=>s.key===req.params.key)){res.status(404).json({message:'Unknown website image'});return;}await SiteImage.deleteOne({key:req.params.key});res.json({success:true});});
