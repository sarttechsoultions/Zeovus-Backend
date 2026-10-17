import {Schema,model} from 'mongoose';
export const SiteImage=model('SiteImage',new Schema({key:{type:String,required:true,unique:true},url:{type:String,required:true},alt:String},{timestamps:true}));
