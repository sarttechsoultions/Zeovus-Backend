import test from 'node:test';
import assert from 'node:assert/strict';
import { productSchema, productUpdateSchema, validTable } from '../dist/modules/products/validators/product.validator.js';
import { ProductModel } from '../dist/modules/products/models/product.model.js';
const product={name:'Native Bovine Collagen',slug:'native-bovine-collagen',category:'collagen-gelatin',summary:'Collagen ingredient',images:[{url:'/product.png',alt:'Jar'}],description:['Description'],technicalSpecifications:{columns:['Type I'],rows:[{parameter:'pH',values:['By grade']}]}};
test('complete detail payload validates and model retains every section',()=>{const data=productSchema.parse({...product,applications:[{title:'Research',icon:'/icon.svg'}],sourceAndOrigin:[{title:'Cattle hide',label:'Primary source'}],processingAndQualityParameters:['Purification'],qualityDocumentation:[{title:'CoA',url:'/coa.pdf'}],clinicalEvidence:[{title:'Study 1',pmid:'25945821',summary:'Evidence summary',url:'https://pubmed.ncbi.nlm.nih.gov/25945821/'}],technicalSourceIds:['R01'],seo:{title:'Collagen'}});assert.ok(validTable(data));const model=new ProductModel(data).toObject();for(const key of Object.keys(data))assert.ok(key in model,key);});
test('reject unknown fields, unsafe URLs, missing images and invalid slugs',()=>{for(const patch of [{unexpected:true},{images:[]},{slug:'bad slug'},{images:[{url:'javascript:alert(1)',alt:'x'}]}])assert.equal(productSchema.safeParse({...product,...patch}).success,false);});
test('specification row sizes match grade columns',()=>assert.equal(validTable(productSchema.parse({...product,technicalSpecifications:{columns:['A','B'],rows:[{parameter:'pH',values:['One']}]}})),false));
test('partial edits do not inject defaults into untouched fields',()=>assert.deepEqual(productUpdateSchema.parse({name:'Updated'}),{name:'Updated'}));


test('original Excel headers containing dots are preserved',async()=>{
 const data=productSchema.parse({...product,sourceData:{'No.':'1','Original notes':'Keep these notes'}});
 const model=new ProductModel(data);
 await model.validate();
 assert.equal(model.toObject().sourceData['No.'],'1');
});
