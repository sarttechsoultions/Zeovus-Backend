export function workbookImages(source:Record<string,string>,name:string){
 const normalized=Object.fromEntries(Object.entries(source).map(([key,value])=>[key.toLowerCase().trim(),value]));
 const images:{url:string;alt:string}[]=[];
 const add=(urls:string,alt:string)=>{for(const url of urls.split(/[|\r\n]+/).map(s=>s.trim()).filter(Boolean)){if(!/^https?:\/\//i.test(url))throw new Error('Image URLs must be direct http(s) links.');if(!images.some(image=>image.url===url))images.push({url,alt:alt||name});}};
 add(normalized['image urls']||normalized['image url']||'',normalized['image alt']||name);
 for(let i=1;i<=20;i++)add(normalized[`image ${i} url`]||'',normalized[`image ${i} alt`]||name);
 if(images.length>20)throw new Error('Maximum 20 images per product.');
 return images.length?images:[{url:'/file.svg',alt:'Product image pending: '+name}];
}
