import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from 'express';
export const productImageDirectory=path.resolve(process.cwd(),'uploads/products');
export const imageUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:20,fields:0}}).array('images',20);
function extension(buffer:Buffer):string|null{
 if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'png';
 if(buffer[0]===255&&buffer[1]===216&&buffer[2]===255)return 'jpg';
 if(['GIF87a','GIF89a'].includes(buffer.subarray(0,6).toString()))return 'gif';
 if(buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP')return 'webp';
 return null;
}
export const uploadProductImages:RequestHandler=async(req,res)=>{
 const files=req.files as Express.Multer.File[]|undefined;
 if(!files?.length){res.status(400).json({message:'Choose at least one image.'});return;}
 const formats=files.map(file=>extension(file.buffer));
 if(formats.some(format=>!format)){res.status(400).json({message:'Only valid JPG, PNG, WebP and GIF images are accepted.'});return;}
 await mkdir(productImageDirectory,{recursive:true});
 const images=[];
 for(let i=0;i<files.length;i++){const filename=randomUUID()+'.'+formats[i];await writeFile(path.join(productImageDirectory,filename),files[i].buffer,{flag:'wx'});images.push({url:'/api/product-images/'+filename,alt:files[i].originalname.replace(/\.[^.]+$/,'').slice(0,500)});}
 res.status(201).json({success:true,images});
};
