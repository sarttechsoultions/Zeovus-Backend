import {Schema,model} from 'mongoose';
const schema=new Schema({slug:{type:String,required:true,unique:true},title:{type:String,required:true},order:{type:Number,default:100}},{timestamps:true});
export const CategoryModel=model('IngredientCategory',schema);
