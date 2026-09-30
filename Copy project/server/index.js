import {existsSync} from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
const {db,encrypt,decrypt,hashToken}=await import('./store.js');
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import {randomUUID,randomBytes} from 'node:crypto';
import {z} from 'zod';
import {resolve} from 'node:path';
import {organFor,rangeStatus,insight} from '../src/medical.js';
import {extractMedical} from './gemini.js';
import {GoogleGenAI} from '@google/genai';

const app=express(),production=process.env.NODE_ENV==='production';
if(process.env.TRUST_PROXY==='1')app.set('trust proxy',1);
app.disable('x-powered-by');
app.use(helmet({contentSecurityPolicy:production?{directives:{defaultSrc:["'self'"],scriptSrc:["'self'","'wasm-unsafe-eval'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'","data:","blob:"],workerSrc:["'self'","blob:"],connectSrc:["'self'"],fontSrc:["'self'","data:"],objectSrc:["'none'"],upgradeInsecureRequests:[]}}:false}));
app.use(express.json({limit:'2mb'}),cookieParser());
app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');if(!['GET','HEAD','OPTIONS'].includes(req.method)){const origin=req.get('origin');const allowed=process.env.APP_ORIGIN||'http://127.0.0.1:5173';if(origin&&origin!==allowed&&(!production&&['http://localhost:5173','http://127.0.0.1:3001','http://localhost:3001'].includes(origin))===false)return res.status(403).json({error:'Origin not allowed'});}next();});
app.use('/api',rateLimit({windowMs:60000,limit:240,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many requests. Please wait a minute.'}}));
const authLimit=rateLimit({windowMs:15*60000,limit:60,message:{error:'Too many sign-in attempts. Try again in 15 minutes.'}});

const credentials=z.object({email:z.email().max(200).transform(s=>s.toLowerCase()),password:z.string().min(12).max(128),name:z.string().trim().min(1).max(80).optional()});
const profileSchema=z.object({name:z.string().trim().min(1).max(80),relationship:z.enum(['Self','Spouse','Parent','Child','Other']),dob:z.string().refine(s=>!s||(/^\d{4}-\d{2}-\d{2}$/.test(s)&&s<=new Date().toISOString().slice(0,10)),'Enter a valid past birth date'),bloodGroup:z.string().max(10).default(''),notes:z.string().max(2000).default(''),authorized:z.literal(true)});
const rowSchema=z.object({name:z.string().trim().min(1).max(100),value:z.string().trim().min(1).max(60),unit:z.string().max(30),range:z.string().max(80)});
const reportSchema=z.object({title:z.string().trim().min(1).max(120),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),lab:z.string().max(120).default(''),type:z.enum(['lab','prescription','medicine']),rows:z.array(rowSchema).max(100),text:z.string().max(60000),medicines:z.string().max(5000).default(''),fileId:z.string().nullable().optional(),verified:z.literal(true)});

const kycSchema=z.object({fullName:z.string().trim().min(1).max(100),nationality:z.string().trim().min(1).max(80),country:z.string().trim().min(1).max(80),stateCity:z.string().max(100).default(''),idType:z.string().max(80),idNumber:z.string().max(80).default(''),dob:z.string().max(20),gender:z.string().max(20),phone:z.string().max(30).default(''),consent:z.literal(true)});
const diabetesSchema=z.object({profileId:z.string(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),time:z.string().max(10),timing:z.enum(['before_food','after_food','bedtime','random']),value:z.number().min(20).max(600),unit:z.literal('mg/dL'),notes:z.string().max(500).default(''),status:z.enum(['low','normal','elevated','high'])});

function session(req,res,id){const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hashToken(token),id,Date.now()+7*86400000);res.cookie('vs_session',token,{httpOnly:true,sameSite:'strict',secure:production,maxAge:7*86400000,path:'/'});}

app.get('/api/status',(_,res)=>res.json({storage:'encrypted-sqlite',ocr:'local',ai:!!process.env.GEMINI_API_KEY,medicine:'openFDA (US labels); DrugBank not connected'}));

// Register
app.post('/api/auth/register',authLimit,async(req,res)=>{
  const d=credentials.parse(req.body);
  if(!d.name)return res.status(400).json({error:'Your name is required'});
  if(db.prepare('SELECT id FROM users WHERE email=?').get(d.email))return res.status(409).json({error:'An account with this email already exists'});
  const id=randomUUID();
  db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(id,d.email,await bcrypt.hash(d.password,12),encrypt(d.name));
  const p=randomUUID();
  db.prepare('INSERT INTO profiles VALUES(?,?,?)').run(p,id,encrypt({name:d.name,relationship:'Self',dob:'',bloodGroup:'',notes:''}));
  session(req,res,id);
  res.json({id,name:d.name,email:d.email,kycVerified:false});
});

// Login
app.post('/api/auth/login',authLimit,async(req,res)=>{
  const d=credentials.parse(req.body),u=db.prepare('SELECT * FROM users WHERE email=?').get(d.email);
  if(!u||!await bcrypt.compare(d.password,u.password))return res.status(401).json({error:'Email or password is incorrect'});
  const kycRow=db.prepare('SELECT payload FROM kyc WHERE user_id=?').get(u.id);
  session(req,res,u.id);
  res.json({id:u.id,name:decrypt(u.name),email:u.email,kycVerified:!!kycRow,kyc:kycRow?decrypt(kycRow.payload):undefined});
});

// Guest Mode
app.post('/api/auth/guest',authLimit,async(req,res)=>{
  const guestEmail='guest@vedashield.local';
  let u=db.prepare('SELECT * FROM users WHERE email=?').get(guestEmail);
  let id;
  if(!u){
    id=randomUUID();
    db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(id,guestEmail,await bcrypt.hash('GuestPass123456!',12),encrypt('Guest User (अतिथि)'));
    const p=randomUUID();
    db.prepare('INSERT INTO profiles VALUES(?,?,?)').run(p,id,encrypt({name:'Guest User',relationship:'Self',dob:'1990-05-15',bloodGroup:'B+',notes:'Guest test profile'}));
    // Add default KYC for guest
    db.prepare('INSERT INTO kyc VALUES(?,?)').run(id,encrypt({fullName:'Guest User (अतिथि)',nationality:'Indian',country:'India',stateCity:'New Delhi',idType:'National ID',idNumber:'GUEST-001',dob:'1990-05-15',gender:'Male',phone:'+91 98765 00000',consent:true}));
    // Add sample report
    const repId=randomUUID();
    const rows=[
      {name:'Fasting blood glucose',value:'138',unit:'mg/dL',range:'70-99',status:'high',organ:'pancreas'},
      {name:'Post-prandial glucose',value:'185',unit:'mg/dL',range:'<140',status:'high',organ:'pancreas'},
      {name:'HbA1c',value:'7.6',unit:'%',range:'4.0-5.6',status:'high',organ:'pancreas'},
      {name:'Total cholesterol',value:'228',unit:'mg/dL',range:'<200',status:'high',organ:'heart'},
      {name:'SGPT (ALT)',value:'62',unit:'U/L',range:'7-56',status:'high',organ:'liver'},
      {name:'Serum Creatinine',value:'1.05',unit:'mg/dL',range:'0.7-1.3',status:'within',organ:'kidneys'}
    ];
    db.prepare('INSERT INTO reports VALUES(?,?,?)').run(repId,p,encrypt({title:'Comprehensive Metabolic & Diabetes Profile',date:new Date().toISOString().slice(0,10),lab:'Dr Lal PathLabs',type:'lab',rows,text:'Fasting blood glucose 138 mg/dL 70-99\nPost-prandial glucose 185 mg/dL <140\nHbA1c 7.6 % 4.0-5.6\nTotal cholesterol 228 mg/dL <200\nSGPT (ALT) 62 U/L 7-56\nSerum Creatinine 1.05 mg/dL 0.7-1.3',medicines:'',verified:true,createdAt:new Date().toISOString()}));
    // Add sample diabetes readings
    const d1=randomUUID(),d2=randomUUID();
    db.prepare('INSERT INTO diabetes VALUES(?,?,?)').run(d1,p,encrypt({profileId:p,date:new Date().toISOString().slice(0,10),time:'08:15',timing:'before_food',value:138,unit:'mg/dL',notes:'Morning fasting',status:'high',createdAt:new Date().toISOString()}));
    db.prepare('INSERT INTO diabetes VALUES(?,?,?)').run(d2,p,encrypt({profileId:p,date:new Date().toISOString().slice(0,10),time:'13:45',timing:'after_food',value:185,unit:'mg/dL',notes:'2 hours after lunch',status:'high',createdAt:new Date().toISOString()}));
  }else id=u.id;
  session(req,res,id);
  res.json({id,name:'Guest User (अतिथि)',email:guestEmail,isGuest:true,kycVerified:true});
});

// Authentication middleware
app.use('/api',(req,res,next)=>{
  const s=req.cookies.vs_session&&db.prepare('SELECT user_id FROM sessions WHERE token=? AND expires>?').get(hashToken(req.cookies.vs_session),Date.now());
  if(!s)return res.status(401).json({error:'Sign in to access your private records'});
  req.user=s.user_id;
  next();
});

// Current user
app.get('/api/me',(req,res)=>{
  const u=db.prepare('SELECT id,name,email FROM users WHERE id=?').get(req.user);
  if(!u)return res.sendStatus(404);
  const kycRow=db.prepare('SELECT payload FROM kyc WHERE user_id=?').get(req.user);
  res.json({
    ...u,
    name:decrypt(u.name),
    isGuest:u.email==='guest@vedashield.local',
    kycVerified:!!kycRow,
    kyc:kycRow?decrypt(kycRow.payload):undefined
  });
});

// KYC endpoints
app.get('/api/kyc',(req,res)=>{
  const k=db.prepare('SELECT payload FROM kyc WHERE user_id=?').get(req.user);
  res.json(k?decrypt(k.payload):null);
});
app.post('/api/kyc',(req,res)=>{
  const data=kycSchema.parse(req.body);
  const existing=db.prepare('SELECT user_id FROM kyc WHERE user_id=?').get(req.user);
  if(existing)db.prepare('UPDATE kyc SET payload=? WHERE user_id=?').run(encrypt(data),req.user);
  else db.prepare('INSERT INTO kyc VALUES(?,?)').run(req.user,encrypt(data));
  res.json({ok:true,...data});
});

app.post('/api/auth/logout',(req,res)=>{
  db.prepare('DELETE FROM sessions WHERE token=?').run(hashToken(req.cookies.vs_session));
  res.clearCookie('vs_session',{path:'/'});
  res.json({ok:true});
});

function owned(req,id){return db.prepare('SELECT * FROM profiles WHERE id=? AND user_id=?').get(id,req.user);}

app.get('/api/profiles',(req,res)=>res.json(db.prepare('SELECT * FROM profiles WHERE user_id=?').all(req.user).map(p=>({id:p.id,...decrypt(p.payload)}))));
app.post('/api/profiles',(req,res)=>{const p=profileSchema.parse(req.body),id=randomUUID();db.prepare('INSERT INTO profiles VALUES(?,?,?)').run(id,req.user,encrypt(p));res.json({id,...p});});
app.put('/api/profiles/:id',(req,res)=>{if(!owned(req,req.params.id))return res.sendStatus(404);const p=profileSchema.parse(req.body);db.prepare('UPDATE profiles SET payload=? WHERE id=?').run(encrypt(p),req.params.id);res.json({id:req.params.id,...p});});
app.delete('/api/profiles/:id',(req,res)=>{if(!owned(req,req.params.id))return res.sendStatus(404);if(db.prepare('SELECT count(*) AS n FROM profiles WHERE user_id=?').get(req.user).n<=1)return res.status(400).json({error:'Keep at least one profile'});db.prepare('DELETE FROM profiles WHERE id=?').run(req.params.id);res.json({ok:true});});

app.get('/api/profiles/:id/reports',(req,res)=>{if(!owned(req,req.params.id))return res.sendStatus(404);res.json(db.prepare('SELECT * FROM reports WHERE profile_id=?').all(req.params.id).map(r=>({id:r.id,...decrypt(r.payload)})).sort((a,b)=>b.date.localeCompare(a.date)));});
app.post('/api/profiles/:id/reports',(req,res)=>{
  if(!owned(req,req.params.id))return res.sendStatus(404);
  const d=reportSchema.parse(req.body);
  if(d.type==='lab'&&!d.rows.length)return res.status(400).json({error:'Add at least one reviewed test result'});
  if(d.fileId&&!db.prepare('SELECT id FROM files WHERE id=? AND profile_id=?').get(d.fileId,req.params.id))return res.status(400).json({error:'File does not belong to this profile'});
  const id=randomUUID(),r={...d,createdAt:new Date().toISOString(),rows:d.rows.map(row=>({...row,status:rangeStatus(row),organ:organFor(row.name)}))};
  db.prepare('INSERT INTO reports VALUES(?,?,?)').run(id,req.params.id,encrypt(r));
  res.json({id,...r});
});
app.delete('/api/reports/:id',(req,res)=>{const r=db.prepare('SELECT * FROM reports WHERE id=?').get(req.params.id);if(!r||!owned(req,r.profile_id))return res.sendStatus(404);const d=decrypt(r.payload);db.prepare('DELETE FROM reports WHERE id=?').run(r.id);if(d.fileId)db.prepare('DELETE FROM files WHERE id=? AND profile_id=?').run(d.fileId,r.profile_id);res.json({ok:true});});

// Diabetes Records
app.get('/api/profiles/:id/diabetes',(req,res)=>{
  if(!owned(req,req.params.id))return res.sendStatus(404);
  res.json(db.prepare('SELECT * FROM diabetes WHERE profile_id=?').all(req.params.id).map(d=>({id:d.id,...decrypt(d.payload)})).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)));
});
app.post('/api/profiles/:id/diabetes',(req,res)=>{
  if(!owned(req,req.params.id))return res.sendStatus(404);
  const d=diabetesSchema.parse(req.body);
  const id=randomUUID();
  const rec={...d,createdAt:new Date().toISOString()};
  db.prepare('INSERT INTO diabetes VALUES(?,?,?)').run(id,req.params.id,encrypt(rec));
  res.json({id,...rec});
});
app.delete('/api/diabetes/:id',(req,res)=>{
  const d=db.prepare('SELECT * FROM diabetes WHERE id=?').get(req.params.id);
  if(!d||!owned(req,d.profile_id))return res.sendStatus(404);
  db.prepare('DELETE FROM diabetes WHERE id=?').run(d.id);
  res.json({ok:true});
});

// Chat AI endpoint
app.post('/api/chat',async(req,res)=>{
  const {message,language='en',report}=req.body;
  if(typeof message!=='string'||!message.trim())return res.status(400).json({error:'Message required'});
  if(process.env.GEMINI_API_KEY){
    try{
      const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY,httpOptions:{timeout:30000}});
      const systemInstruction=`You are VedaShield AI, a compassionate, accurate bilingual clinical health assistant for Indian patients.
Respond in ${language==='hi'?'clean, polite, easily understandable Hindi (देवनागरी)' : 'clear, concise, empathetic English'}.
Reference clinical targets (e.g. Fasting glucose 70-99 mg/dL, post-meal <140 mg/dL, HbA1c <5.7%).
Give practical dietary guidelines (like Bitter gourd/Karela, Methi, whole millets vs foods to avoid).
Never invent false medical emergencies, never claim to be an emergency service, and always encourage user to consult their treating physician.`;
      const context=report?`Patient's recent lab report (${report.title}, Lab: ${report.lab}): ${JSON.stringify(report.rows)}`:'';
      const response=await ai.models.generateContent({
        model:process.env.GEMINI_MODEL||'gemini-2.5-flash',
        contents:[{role:'user',parts:[{text:`${systemInstruction}\n\n${context}\n\nUser Question: ${message}`}]}],
        config:{temperature:0.2}
      });
      return res.json({reply:response.text||''});
    }catch(e){
      console.warn('Gemini chat fallback:',e.message);
    }
  }
  res.json({reply:''});
});

// File upload
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:15*1024*1024,files:1}});
app.post('/api/profiles/:id/files',upload.single('file'),(req,res)=>{
  if(!owned(req,req.params.id))return res.sendStatus(404);
  const f=req.file;
  if(!f)return res.status(400).json({error:'Choose a file'});
  const b=f.buffer;
  const mime=b.subarray(0,5).toString()==='%PDF-'?'application/pdf':b[0]===0xff&&b[1]===0xd8?'image/jpeg':b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'?'image/webp':null;
  if(!mime)return res.status(400).json({error:'Use a genuine PDF, JPEG, PNG, or WebP file'});
  const id=randomUUID();
  db.prepare('INSERT INTO files VALUES(?,?,?)').run(id,req.params.id,encrypt({name:f.originalname.slice(0,120),mime,data:b.toString('base64')}));
  res.json({id});
});
app.get('/api/files/:id',(req,res)=>{const f=db.prepare('SELECT * FROM files WHERE id=?').get(req.params.id);if(!f||!owned(req,f.profile_id))return res.sendStatus(404);const d=decrypt(f.payload);res.set({'Content-Type':d.mime,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(d.name)}`});res.send(Buffer.from(d.data,'base64'));});

app.get('/api/medicines',async(req,res)=>{
  const query=z.string().trim().min(2).max(80).parse(req.query.q).replace(/[^\p{L}\p{N} -]/gu,'');
  const url=new URL('https://api.fda.gov/drug/label.json');
  url.searchParams.set('search',`openfda.generic_name:"${query}"+openfda.brand_name:"${query}"`);
  url.searchParams.set('limit','5');
  try{
    const upstream=await fetch(url,{signal:AbortSignal.timeout(15000)});
    if(upstream.status===404)return res.json({results:[],source:'openFDA'});
    if(!upstream.ok)throw Error('unavailable');
    const result=await upstream.json();
    res.json({source:'openFDA',results:result.results.map(r=>({id:r.id,setId:r.set_id,name:r.openfda?.brand_name?.[0]||r.openfda?.generic_name?.[0]||query,generic:r.openfda?.generic_name?.join(', ')||'',manufacturer:r.openfda?.manufacturer_name?.[0]||'',ingredients:(r.active_ingredient||[]).join('\n'),uses:(r.indications_and_usage||[]).join('\n'),warnings:[...(r.boxed_warning||[]),...(r.warnings||[]),...(r.warnings_and_cautions||[])].join('\n'),precautions:(r.precautions||[]).join('\n'),date:r.effective_time,source:`https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${r.set_id}`}))});
  }catch{return res.status(503).json({error:'Medicine source is currently unavailable. Try again later.'});}
});

app.post('/api/profiles/:id/extract',async(req,res)=>{
  if(!owned(req,req.params.id))return res.status(404).json({error:'Profile not found'});
  if(req.body.consent!==true)return res.status(400).json({error:'Permission to send this document to Gemini is required'});
  const f=db.prepare('SELECT * FROM files WHERE id=? AND profile_id=?').get(String(req.body.fileId),req.params.id);
  if(!f)return res.status(404).json({error:'File not found'});
  const d=decrypt(f.payload);
  try{res.json(await extractMedical(process.env,d.mime,d.data));}catch(e){res.status(e.status||502).json({error:e.status===503?e.message:'Gemini could not extract this document. Use on-device OCR or enter values manually.'});}
});

app.get('/api/export',(req,res)=>{
  const profiles=db.prepare('SELECT * FROM profiles WHERE user_id=?').all(req.user).map(p=>({
    id:p.id,
    ...decrypt(p.payload),
    reports:db.prepare('SELECT * FROM reports WHERE profile_id=?').all(p.id).map(r=>({id:r.id,...decrypt(r.payload)})),
    diabetes:db.prepare('SELECT * FROM diabetes WHERE profile_id=?').all(p.id).map(d=>({id:d.id,...decrypt(d.payload)}))
  }));
  res.set('Content-Disposition','attachment; filename="vedashield-records.json"').json({exportedAt:new Date().toISOString(),profiles});
});

app.delete('/api/account',async(req,res)=>{
  const u=db.prepare('SELECT password FROM users WHERE id=?').get(req.user);
  if(typeof req.body.password!=='string'||!await bcrypt.compare(req.body.password,u.password))return res.status(403).json({error:'Confirm your password to delete your account'});
  db.prepare('DELETE FROM users WHERE id=?').run(req.user);
  res.clearCookie('vs_session',{path:'/'}).json({ok:true});
});

app.use('/api',(_,res)=>res.status(404).json({error:'Not found'}));
if(existsSync('dist')){app.use(express.static(resolve('dist')));app.get('/{*path}',(_,res)=>res.sendFile(resolve('dist/index.html')));}
app.use((err,req,res,next)=>{
  if(err instanceof z.ZodError)return res.status(400).json({error:err.issues.map(x=>x.message).join('; ')});
  if(err.code==='LIMIT_FILE_SIZE')return res.status(413).json({error:'Maximum file size is 15 MB'});
  if(err.status===413)return res.status(413).json({error:'Request is too large'});
  console.error('Request failed:',err.name);
  res.status(500).json({error:'The request could not be completed. Please try again.'});
});

app.listen(process.env.PORT||3001,process.env.HOST||'127.0.0.1',()=>console.log(`VedaShield API listening on ${process.env.PORT||3001}`));
