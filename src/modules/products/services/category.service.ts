import {CategoryModel} from '../models/category.model.js';
import {ProductModel} from '../models/product.model.js';
export const categoryTitle=(slug:string)=>slug.split('-').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ');
export async function ensureCategory(slug:string,title?:string){
 return CategoryModel.updateOne({slug},{$setOnInsert:{slug,title:title||categoryTitle(slug)}},{upsert:true});
}
export async function catalogueCategories(publishedOnly=true){
 const slugs=await ProductModel.distinct('category',publishedOnly?{status:'published'}:{});
 const records=await CategoryModel.find({slug:{$in:slugs}}).sort({order:1,title:1}).lean();
 const known=new Set(records.map(row=>row.slug));
 return [...records.map(({slug,title})=>({id:slug,title})),...slugs.filter(slug=>!known.has(slug)).sort().map(slug=>({id:slug,title:categoryTitle(slug)}))];
}
