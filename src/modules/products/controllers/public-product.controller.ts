import type {RequestHandler} from 'express';
import {ProductModel} from '../models/product.model.js';
import {z} from 'zod';
export const publicProducts:RequestHandler=async(req,res)=>{
 const parsed=z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(30).default(6),category:z.enum(['botanical-extracts','collagen-gelatin','prebiotics','plant-proteins','other']).optional()}).safeParse(req.query);if(!parsed.success){res.status(400).json({message:'Invalid filters'});return;}
 const {page,limit,category}=parsed.data;const filter={status:'published' as const,...(category?{category}:{})};
 const [data,total]=await Promise.all([ProductModel.find(filter).sort({createdAt:-1,_id:-1}).skip((page-1)*limit).limit(limit).select('name slug category summary images').lean(),ProductModel.countDocuments(filter)]);
 res.json({success:true,data,pagination:{page,total,pages:Math.ceil(total/limit)}});
};
export const publicProduct:RequestHandler=async(req,res)=>{if(typeof req.params.slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(req.params.slug)){res.status(400).json({message:'Invalid product slug'});return;}const data=await ProductModel.findOne({slug:req.params.slug,status:'published'}).select('-sourceData -importBatch -__v').lean();if(!data){res.status(404).json({message:'Product not found'});return;}res.json({success:true,data});};

