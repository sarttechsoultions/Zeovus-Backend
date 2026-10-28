import test from 'node:test';
import assert from 'node:assert/strict';
import {ProductModel} from '../dist/modules/products/models/product.model.js';
import {CategoryModel} from '../dist/modules/products/models/category.model.js';
import {catalogueCategories} from '../dist/modules/products/services/category.service.js';
import {productSchema} from '../dist/modules/products/validators/product.validator.js';
test('categories and display names come from stored data, including a new category',async()=>{
 const distinct=ProductModel.distinct,find=CategoryModel.find;let filter;
 ProductModel.distinct=async(_key,value)=>{filter=value;return ['specialty-ingredients'];};
 CategoryModel.find=()=>({sort(){return this;},lean:async()=>[{slug:'specialty-ingredients',title:'Specialty Nutrition'}]});
 try{assert.deepEqual(await catalogueCategories(),[{id:'specialty-ingredients',title:'Specialty Nutrition'}]);assert.deepEqual(filter,{status:'published'});await catalogueCategories(false);assert.deepEqual(filter,{});}finally{ProductModel.distinct=distinct;CategoryModel.find=find;}
});
test('category validation supports new category IDs without an enum change',()=>{
 assert.equal(productSchema.shape.category.safeParse('specialty-ingredients').success,true);
 assert.equal(productSchema.shape.category.safeParse('Invalid category!').success,false);
});
