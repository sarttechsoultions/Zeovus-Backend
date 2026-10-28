import {catalogueCategories,ensureCategory} from "../services/category.service.js";
import type { RequestHandler } from 'express';
import { ProductModel } from '../models/product.model.js';
import { productSchema, productUpdateSchema, validTable } from '../validators/product.validator.js';
import { z } from 'zod';
export const validateId:RequestHandler=(req,res,next)=>{if(!/^[a-f\d]{24}$/i.test(String(req.params.id))){res.status(400).json({success:false,message:'Invalid product ID'});return;}next();};
const querySchema=z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(10),category:productSchema.shape.category.optional(),status:productSchema.shape.status.removeDefault().optional(),search:z.string().max(200).optional()});
export const listProducts:RequestHandler=async(req,res)=>{
 const parsed=querySchema.safeParse(req.query);if(!parsed.success){res.status(400).json({success:false,errors:parsed.error.flatten()});return;}
 const {page,limit,category,status,search}=parsed.data;const filter:Record<string,unknown>={};
 if(category)filter.category=category;if(status)filter.status=status;
 if(search)filter.name={$regex:search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
 const [data,total,allProducts,published,drafts,categoryNames]=await Promise.all([ProductModel.find(filter).sort({createdAt:-1,_id:-1}).skip((page-1)*limit).limit(limit).lean(),ProductModel.countDocuments(filter),ProductModel.countDocuments({}),ProductModel.countDocuments({status:'published'}),ProductModel.countDocuments({status:'draft'}),ProductModel.distinct('category')]);
 res.json({success:true,data,categoryOptions:await catalogueCategories(false),statistics:{total:allProducts,published,drafts,categories:categoryNames.length},pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
};
export const getProduct:RequestHandler=async(req,res)=>{const data=await ProductModel.findById(req.params.id).lean();if(!data){res.status(404).json({success:false,message:'Product not found'});return;}res.json({success:true,data});};
export const createProduct:RequestHandler=async(req,res)=>{
 const parsed=productSchema.safeParse(req.body);if(!parsed.success){res.status(400).json({success:false,errors:parsed.error.flatten()});return;}
 if(!validTable(parsed.data)){res.status(400).json({success:false,message:'Each specification row must have one value per grade column.'});return;}
 try{await ensureCategory(parsed.data.category);const data=await ProductModel.create(parsed.data);res.status(201).json({success:true,data});}catch(error){if((error as {code?:number}).code===11000){res.status(409).json({success:false,message:'Product slug already exists'});return;}throw error;}
};
export const updateProduct:RequestHandler=async(req,res)=>{
 const patch=productUpdateSchema.safeParse(req.body);if(!patch.success || !Object.keys(patch.data ?? {}).length){res.status(400).json({success:false,message:'Provide valid product fields',errors:patch.error?.flatten()});return;}
 const existing=await ProductModel.findById(req.params.id);if(!existing){res.status(404).json({success:false,message:'Product not found'});return;}
 // Validate table against its resulting columns, including partial edits.
 const table=patch.data.technicalSpecifications ?? existing.technicalSpecifications;
 if(table && table.rows.some(row=>row.values.length!==table.columns.length)){res.status(400).json({success:false,message:'Each specification row must have one value per grade column.'});return;}
 try{if(patch.data.category)await ensureCategory(patch.data.category);existing.set(patch.data);await existing.save();res.json({success:true,data:existing});}catch(error){if((error as {code?:number}).code===11000){res.status(409).json({success:false,message:'Product slug already exists'});return;}throw error;}
};
export const deleteProduct:RequestHandler=async(req,res)=>{const data=await ProductModel.findByIdAndDelete(req.params.id);if(!data){res.status(404).json({success:false,message:'Product not found'});return;}res.json({success:true,message:'Product deleted'});};



export const bulkDeleteProducts:RequestHandler=async(req,res)=>{
 const parsed=z.object({ids:z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(100)}).strict().safeParse(req.body);
 if(!parsed.success){res.status(400).json({success:false,message:'Provide 1–100 valid product IDs.'});return;}
 const result=await ProductModel.deleteMany({_id:{$in:[...new Set(parsed.data.ids)]}});
 res.json({success:true,deleted:result.deletedCount});
};
export const bulkPublishProducts:RequestHandler=async(req,res)=>{
 const parsed=z.object({ids:z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(100)}).strict().safeParse(req.body);
 if(!parsed.success){res.status(400).json({success:false,message:'Provide 1–100 valid product IDs.'});return;}
 const result=await ProductModel.updateMany({_id:{$in:[...new Set(parsed.data.ids)]},status:'draft'},{$set:{status:'published'}},{runValidators:true});
 res.json({success:true,published:result.modifiedCount});
};
