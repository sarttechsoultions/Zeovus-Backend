import {Schema,model} from 'mongoose';
export const EnquiryModel=model('Enquiry',new Schema({name:{type:String,required:true},email:{type:String,required:true,lowercase:true},phone:String,countryCode:String,country:String,interest:String,organisation:String,message:{type:String,required:true},status:{type:String,enum:['new','in-progress','closed'],default:'new'}},{timestamps:true}));
