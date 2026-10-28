import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {connectDatabase} from '../config/database.js';
import {ProductModel} from '../modules/products/models/product.model.js';
import {parseProductWorkbook} from '../modules/products/services/product-import.service.js';
async function run(){
 const parsed=await Promise.all(process.argv.slice(2).map(async path=>parseProductWorkbook(await readFile(path))));
 const entries=parsed.flatMap(file=>file.products.map(entry=>entry.product));
 await connectDatabase();
 const rows=await ProductModel.find({slug:{$in:entries.map(p=>String(p.slug))}}).lean();
 assert.equal(rows.length,entries.length);
 for(const entry of entries){
  const row=rows.find(p=>p.slug===entry.slug)!;
  assert.equal(row.status,'published');
  for(const field of ['name','category','commonName','standardization','plantPartUsed','description','benefits','applicationTags','applicationSubcategories','applications','technicalSpecifications','clinicalEvidence','sourceData'] as const){
   assert.deepEqual(JSON.parse(JSON.stringify(row[field])),entry[field],String(entry.slug)+': '+field);
  }
 }
 const categories=Object.fromEntries([...new Set(rows.map(p=>p.category))].map(category=>[category,rows.filter(p=>p.category===category).length]));
 console.log(JSON.stringify({verified:rows.length,categories}));
}
run().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
