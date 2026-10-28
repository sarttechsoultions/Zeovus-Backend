import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {parseProductWorkbook} from '../dist/modules/products/services/product-import.service.js';
import {publicProducts} from '../dist/modules/products/controllers/public-product.controller.js';
import {ProductModel} from '../dist/modules/products/models/product.model.js';

test('imports all three biotic groups with exact parent/subcategory associations',async()=>{
 const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Ingredients');
 sheet.addRow(['Ingredient Group','Ingredient','Product Overview','Technical Specifications','Applications','Functional Characteristics','Application Tags','Application Subcategory Tags','Clinical Study 1']);
 for(const group of ['Prebiotic','Probiotic','Postbiotic'])sheet.addRow([group,group+' sample','Supplied overview','Appearance: powder','Powders','Supplied functionality','Food & Beverage; Personal Care','Food & Beverage: Functional Beverages; Others\nPersonal Care: Skin Care; Others','Study summary https://pubmed.ncbi.nlm.nih.gov/30940833/']);
 const result=await parseProductWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()));
 assert.deepEqual(result.errors,[]);assert.equal(result.products.length,3);
 assert.deepEqual(result.products.map(p=>p.product.category),['prebiotics','probiotics','postbiotics']);
 const product=result.products[0].product;
 assert.deepEqual(product.applicationTags,['Food & Beverage','Personal Care']);
 assert.deepEqual(product.applicationSubcategories,[{application:'Food & Beverage',title:'Functional Beverages'},{application:'Food & Beverage',title:'Others'},{application:'Personal Care',title:'Skin Care'},{application:'Personal Care',title:'Others'}]);
 assert.deepEqual(product.benefits,['Supplied functionality']);assert.equal(product.clinicalEvidence.length,1);
});
test('keeps botanical detail fields and ignores reference-only sheets',async()=>{
 const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Extracts');
 sheet.addRow(['Botanical Name','Common Name','Description','Standardization (common grades)','Plant Part Used','Benefits','Applications','Application Tags','Application Subcategory Tags','Study 1','Clinical Studies']);
 sheet.addRow(['Botanical sample','Common sample','Supplied description','10% marker','Root','Benefit one\nBenefit two','Topical preparations','Personal Care','Personal Care: Skin Care','https://pubmed.ncbi.nlm.nih.gov/29386800/','Exact study finding\nhttps://pubmed.ncbi.nlm.nih.gov/29386800/']);
 workbook.addWorksheet('Benefit groups').addRow(['Botanical Name','Benefit Group']);
 const result=await parseProductWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()));
 assert.deepEqual(result.errors,[]);assert.equal(result.products.length,1);
 const p=result.products[0].product;assert.equal(p.commonName,'Common sample');assert.equal(p.standardization,'10% marker');assert.equal(p.plantPartUsed,'Root');assert.deepEqual(p.benefits,['Benefit one','Benefit two']);assert.match(p.clinicalEvidence[0].summary,/Exact study finding/);
});
test('public filters bind subcategory to its selected application and retain published restriction',async()=>{
 const originalFind=ProductModel.find,originalCount=ProductModel.countDocuments;let filter;
 ProductModel.find=(value)=>{filter=value;return {sort(){return this;},skip(){return this;},limit(){return this;},select(){return this;},lean:async()=>[]};};ProductModel.countDocuments=async()=>0;
 try{let payload;await publicProducts({query:{category:'probiotics',application:'Personal Care',subcategory:'Others'}},{json:data=>{payload=data;},status(){return this;}},()=>{});assert.deepEqual(filter,{status:'published',category:'probiotics',applicationTags:'Personal Care',applicationSubcategories:{$elemMatch:{title:'Others',application:'Personal Care'}}});assert.equal(payload.pagination.total,0);}finally{ProductModel.find=originalFind;ProductModel.countDocuments=originalCount;}
});
