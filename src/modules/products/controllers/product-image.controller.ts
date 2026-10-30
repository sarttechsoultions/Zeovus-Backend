import multer from 'multer';
import { createHash, randomUUID } from 'node:crypto';
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
 const cloud=process.env.CLOUDINARY_CLOUD_NAME;
 const key=process.env.CLOUDINARY_API_KEY;
 const secret=process.env.CLOUDINARY_API_SECRET;
 if(!cloud||!key||!secret){res.status(503).json({message:'Cloudinary is not configured. Set the Cloudinary environment variables on the backend.'});return;}
 const images=[];
 try {
 for(let i=0;i<files.length;i++){
 const timestamp=String(Math.floor(Date.now()/1000));
 const folder='zeovus-herbs/products';
 const publicId=randomUUID();
 const signature=createHash('sha1').update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${secret}`).digest('hex');
 const form=new FormData();
 const mime={png:'image/png',jpg:'image/jpeg',gif:'image/gif',webp:'image/webp'}[formats[i]!]!;
 form.append('file',new Blob([new Uint8Array(files[i].buffer)],{type:mime}),`${publicId}.${formats[i]}`);
 form.append('api_key',key);form.append('timestamp',timestamp);form.append('folder',folder);form.append('public_id',publicId);form.append('signature',signature);
 const response=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`,{method:'POST',body:form,signal:AbortSignal.timeout(25000)});
 const result=await response.json() as {secure_url?:string};
 if(!response.ok||!result.secure_url?.startsWith('https://res.cloudinary.com/'))throw new Error('Cloud upload failed');
 images.push({url:result.secure_url,alt:files[i].originalname.replace(/\.[^.]+$/,'').slice(0,500)});
 }
 } catch {res.status(502).json({message:'Cloudinary upload failed. Check configuration and retry.'});return;}
 res.status(201).json({success:true,images});
};
