import 'dotenv/config';
import mongoose from 'mongoose';
import {connectDatabase} from '../config/database.js';
import {ProductModel} from '../modules/products/models/product.model.js';
import {CategoryModel} from '../modules/products/models/category.model.js';
import {categoryTitle} from '../modules/products/services/category.service.js';

// One-time migration of the previous display labels into database records.
// Runtime navigation reads the collection; it never imports this migration.
const previousLabels:Record<string,string>={'botanical-extracts':'Botanical Extracts','plant-proteins':'Proteins','prebiotics':'Prebiotics','probiotics':'Probiotics','postbiotics':'Postbiotics','collagen-gelatin':'Collagen Peptides','other':'Other Ingredients'};
async function run(){
 await connectDatabase();
 const slugs=await ProductModel.distinct('category');
 for(const slug of slugs){await CategoryModel.updateOne({slug},{$setOnInsert:{slug,title:previousLabels[slug]||categoryTitle(slug),order:Object.keys(previousLabels).indexOf(slug)<0?100:Object.keys(previousLabels).indexOf(slug)}},{upsert:true});}
 console.log(JSON.stringify({categories:await CategoryModel.find().select('slug title -_id').sort({order:1,title:1}).lean()}));
}
run().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>mongoose.disconnect());
