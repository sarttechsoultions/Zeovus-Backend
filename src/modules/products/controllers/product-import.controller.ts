import type { RequestHandler } from 'express';
import { createHash } from 'node:crypto';
import { parseProductWorkbook } from '../services/product-import.service.js';
import { ProductModel } from '../models/product.model.js';
import { ProductImport } from '../models/product-import.model.js';
export const importProducts:RequestHandler=async(req,res)=>{
 if(!req.file){res.status(400).json({message:'Select an .xlsx file.'});return;}
 let parsed;try{parsed=await parseProductWorkbook(req.file.buffer);}catch{res.status(400).json({message:'Unable to read a supported Excel workbook. Check the file format and limits.'});return;}
 const existing=await ProductModel.find({slug:{$in:parsed.products.map(p=>String(p.product.slug))}}).select('slug').lean();const slugs=new Set(existing.map(p=>p.slug));
 const duplicates:string[]=[];const valid=parsed.products.filter(p=>{const s=String(String(p.product.slug));if(slugs.has(s)){duplicates.push(String(p.product.name));return false;}slugs.add(s);return true;});
 if(req.query.commit!=='true'){res.json({success:true,preview:true,total:parsed.products.length,ready:valid.length,duplicates,errors:parsed.errors,products:valid.map(p=>({name:p.product.name,category:p.product.category,sheet:p.sheet,row:p.row})),warnings:['Products are imported as drafts. Add product images before publishing if the workbook has no image URLs.','Original workbook columns and reference sheets are preserved.']});return;}
 if(parsed.errors.length){res.status(400).json({message:'Fix invalid rows before importing.',errors:parsed.errors});return;}
 if(!valid.length){res.json({success:true,created:0,skipped:duplicates.length,duplicates,errors:[]});return;}
 const batch=await ProductImport.create({filename:req.file.originalname,hash:createHash('sha256').update(req.file.buffer).digest('hex'),sheets:parsed.sheets});
 let created=0;const errors:{row:number;message:string}[]=[];
 for(const entry of valid){try{await ProductModel.create({...entry.product,importBatch:batch._id});created++;}catch(error){if((error as {code?:number}).code===11000)duplicates.push(String(entry.product.name));else {
 const failure=error as {name?:string;errors?:Record<string,{kind?:string}>};
 const fields=failure.name==='ValidationError'?Object.keys(failure.errors||{}):[];
 errors.push({row:entry.row,message:fields.length?'Product validation failed for: '+fields.join(', ')+'.':'Could not save this product. Please check the database connection and retry.'});
 }}}
 res.status(errors.length?207:201).json({success:errors.length===0,created,skipped:duplicates.length,duplicates,errors});
};



