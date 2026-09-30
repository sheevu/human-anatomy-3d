export type AtlasPart = {id:string;name:string;sourceName:string;system:string;center:[number,number,number];size:[number,number,number]};
export type AtlasManifest = {parts:AtlasPart[];systems:Record<string,{parts:number;triangles:number;bytes:number;sha256:string}>};
export const systems:Record<string,{name:string;hi:string;color:string}> = {
 organs:{name:'Organs',hi:'अंग',color:'#bd7772'},
 skeleton:{name:'Skeleton',hi:'कंकाल',color:'#c9bda0'},
 muscles:{name:'Muscles',hi:'मांसपेशियां',color:'#b96965'},
 joints:{name:'Joints',hi:'जोड़',color:'#a5c1c5'},
 vessels:{name:'Vessels',hi:'रक्त वाहिकाएं',color:'#b65159'},
 lymphatic:{name:'Lymphatic',hi:'लसीका तंत्र',color:'#879b61'},
 nervous:{name:'Nerves & senses',hi:'तंत्रिकाएं',color:'#c5a14d'},
 viscera:{name:'Internal structures',hi:'आंतरिक संरचनाएं',color:'#b28284'},
 surface:{name:'Body regions',hi:'शरीर के भाग',color:'#c7aaa0'},
};
/** Fit a front-facing bounding box in both camera axes, including its depth. */
export function fitDistance(size:readonly number[], aspect:number, fov=37) {
 const tangent=Math.tan(fov*Math.PI/360);
 return Math.max(.15,(Math.max(size[1]/(2*tangent),size[0]/(2*tangent*aspect))+size[2]/2)*1.15);
}
