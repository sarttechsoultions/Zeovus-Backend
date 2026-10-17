import { Schema,model } from 'mongoose';
export const ProductImport=model('ProductImport',new Schema({filename:String,hash:String,sheets:Schema.Types.Mixed},{timestamps:true}));
