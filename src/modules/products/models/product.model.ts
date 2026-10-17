import { Schema, model } from 'mongoose';
const productSchema = new Schema({
 sourceData:{type:Schema.Types.Mixed},importBatch:{type:Schema.Types.ObjectId,ref:"ProductImport"},
 name:{type:String,required:true},slug:{type:String,required:true,unique:true},category:{type:String,required:true},summary:{type:String,required:true},status:{type:String,enum:['draft','published'],default:'draft'},
 images:[{_id:false,url:String,alt:String}],description:[String],applications:[{_id:false,title:String,icon:String}],
 technicalSpecifications:{columns:[String],rows:[{_id:false,parameter:String,values:[String]}]},
 sourceAndOrigin:[{_id:false,title:String,label:String,icon:String}],processingAndQualityParameters:[String],
 qualityDocumentation:[{_id:false,title:String,url:String}],clinicalEvidence:[{_id:false,title:String,pmid:String,summary:String,url:String}],technicalSourceIds:[String],seo:{title:String,description:String},
},{timestamps:true});
productSchema.index({category:1,status:1,createdAt:-1});
export const ProductModel = model('Product',productSchema);


