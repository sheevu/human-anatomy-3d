export async function recognize(file:File,onProgress:(s:string)=>void):Promise<string>{
 if(file.type==='text/plain'||file.name.endsWith('.txt'))return file.text();
 const {createWorker}=await import('tesseract.js');let worker:Awaited<ReturnType<typeof createWorker>>|undefined;
 const getWorker=async()=>worker??=await createWorker('eng+hin',1,{logger:m=>{if(m.status)onProgress(m.status+' '+Math.round((m.progress||0)*100)+'%')}});
 try{
  if(file.type==='application/pdf'){
   const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).toString();
   const doc=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
   try{if(doc.numPages>10)throw Error('Use a report of 10 pages or fewer.');const texts=[];
    for(let i=1;i<=doc.numPages;i++){onProgress(`Reading page ${i} of ${doc.numPages}`);const page=await doc.getPage(i);const content=await page.getTextContent();let s='';for(const item of content.items){if('str'in item)s+=item.str+(item.hasEOL?'\n':' ')}
     if(s.trim().length<30){const viewport=page.getViewport({scale:1.7});const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvas,viewport}).promise;s=(await(await getWorker()).recognize(canvas)).data.text;}texts.push(s);
    }return texts.join('\n');
   }finally{await doc.destroy()}
  }
  return (await(await getWorker()).recognize(file)).data.text;
 }finally{await worker?.terminate()}
}
