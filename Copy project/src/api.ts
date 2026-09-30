import {createClient} from '@supabase/supabase-js';
import type {User,Profile,Report,ServiceStatus,KYCData,DiabetesRecord} from './types';
const url=import.meta.env.VITE_SUPABASE_URL, key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const cloud=Boolean(url&&key);
export const supabase=cloud?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:true}}):null;

async function request<T>(path:string,method='GET',body?:unknown):Promise<T>{
  const session=supabase?(await supabase.auth.getSession()).data.session:null;
  const response=await fetch('/api'+path,{
    method,
    credentials:'same-origin',
    headers:{
      ...(body instanceof FormData?{}:{'Content-Type':'application/json'}),
      ...(session?{Authorization:'Bearer '+session.access_token}:{})
    },
    body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body)
  });
  if(!response.ok){
    const data=await response.json().catch(()=>({}));
    throw Error(data.error||`Request failed (${response.status})`);
  }
  return response.json();
}

function checked<T extends {error:unknown;data?:unknown}>(r:T):T & {data:NonNullable<T['data']>}{
  if(r.error)throw r.error;
  return r as T & {data:NonNullable<T['data']>};
}

export const api={
  status:()=>request<ServiceStatus>('/status'),

  async me():Promise<User>{
    // Check localStorage guest session first
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      try{ return JSON.parse(guestStored); }catch{}
    }
    if(!supabase)return request('/me');
    const {data}=checked(await supabase.auth.getUser());
    if(!data.user)throw Error('Sign in');
    return {id:data.user.id,email:data.user.email||'',name:data.user.user_metadata.name||'You'};
  },

  async auth(register:boolean,email:string,password:string,name:string):Promise<User>{
    localStorage.removeItem('vs_guest_user');
    if(!supabase)return request<User>('/auth/'+(register?'register':'login'),'POST',{email,password,name});
    if(register){
      const {data}=checked(await supabase.auth.signUp({email,password,options:{data:{name}}}));
      if(!data.session)throw Error('Check your email to confirm your account, then sign in.');
    }else{
      checked(await supabase.auth.signInWithPassword({email,password}));
    }
    const user=await this.me();
    const profiles=await this.profiles();
    if(!profiles.length)await this.saveProfile({name:user.name,relationship:'Self',dob:'',bloodGroup:'',notes:'',authorized:true});
    return user;
  },

  async guest():Promise<User>{
    try{
      const u=await request<User>('/auth/guest','POST');
      localStorage.setItem('vs_guest_user',JSON.stringify(u));
      return u;
    }catch{
      // Local client-side fallback if server offline
      const guestUser:User={
        id:'guest-'+Date.now(),
        name:'Guest User (अतिथि)',
        email:'guest@vedashield.local',
        isGuest:true,
        kycVerified:true,
        kyc:{
          fullName:'Guest User (अतिथि)',
          nationality:'Indian',
          country:'India',
          stateCity:'New Delhi',
          idType:'National ID',
          idNumber:'GUEST-001',
          dob:'1990-05-15',
          gender:'Male',
          phone:'+91 98765 00000',
          consent:true
        }
      };
      localStorage.setItem('vs_guest_user',JSON.stringify(guestUser));
      return guestUser;
    }
  },

  async logout(){
    localStorage.removeItem('vs_guest_user');
    if(supabase)checked(await supabase.auth.signOut());
    else await request('/auth/logout','POST').catch(()=>{});
  },

  async getKYC():Promise<KYCData|null>{
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      try{ return JSON.parse(guestStored).kyc || null; }catch{}
    }
    return request<KYCData|null>('/kyc');
  },

  async saveKYC(data:KYCData):Promise<{ok:boolean}>{
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      try{
        const u=JSON.parse(guestStored);
        u.kyc=data;
        u.kycVerified=true;
        localStorage.setItem('vs_guest_user',JSON.stringify(u));
        return {ok:true};
      }catch{}
    }
    return request('/kyc','POST',data);
  },

  async profiles():Promise<Profile[]>{
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      const saved=localStorage.getItem('vs_guest_profiles');
      if(saved)try{return JSON.parse(saved);}catch{}
      const init:Profile[]=[{id:'guest-p1',name:'Guest User (Self)',relationship:'Self',dob:'1990-05-15',bloodGroup:'B+',notes:'Guest profile'}];
      localStorage.setItem('vs_guest_profiles',JSON.stringify(init));
      return init;
    }
    if(!supabase)return request('/profiles');
    return checked(await supabase.from('profiles').select('*').order('created_at')).data.map(x=>({id:x.id,...x.payload}));
  },

  async saveProfile(p:Omit<Profile,'id'>,id?:string):Promise<Profile>{
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      const cur=await this.profiles();
      const newId=id||'guest-p-'+Date.now();
      const updated=id?cur.map(x=>x.id===id?{id, ...p}:x):[...cur,{id:newId, ...p}];
      localStorage.setItem('vs_guest_profiles',JSON.stringify(updated));
      return {id:newId,...p};
    }
    if(!supabase)return request('/profiles'+(id?'/'+id:''),id?'PUT':'POST',p);
    const user=await this.me();
    const q=id?supabase.from('profiles').update({payload:p}).eq('id',id):supabase.from('profiles').insert({owner_id:user.id,payload:p});
    const {data}=checked(await q.select().single());
    return {id:data.id,...data.payload};
  },

  async deleteProfile(id:string){
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      const cur=await this.profiles();
      if(cur.length<2)throw Error('Keep at least one profile');
      localStorage.setItem('vs_guest_profiles',JSON.stringify(cur.filter(x=>x.id!==id)));
      return;
    }
    if(!supabase)return request('/profiles/'+id,'DELETE');
    const profiles=await this.profiles();
    if(profiles.length<2)throw Error('Keep at least one profile');
    const files=checked(await supabase.from('report_files').select('path').eq('profile_id',id)).data;
    if(files.length)checked(await supabase.storage.from('health-records').remove(files.map(x=>x.path)));
    checked(await supabase.from('profiles').delete().eq('id',id));
  },

  async reports(id:string):Promise<Report[]>{
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      const saved=localStorage.getItem('vs_guest_reports_'+id);
      if(saved)try{return JSON.parse(saved);}catch{}
      const sample:Report[]=[{
        id:'guest-r1',
        title:'Comprehensive Metabolic & Diabetes Profile',
        date:new Date().toISOString().slice(0,10),
        lab:'Dr Lal PathLabs',
        type:'lab',
        rows:[
          {name:'Fasting blood glucose',value:'138',unit:'mg/dL',range:'70-99',status:'high',organ:'pancreas'},
          {name:'Post-prandial glucose',value:'185',unit:'mg/dL',range:'<140',status:'high',organ:'pancreas'},
          {name:'HbA1c',value:'7.6',unit:'%',range:'4.0-5.6',status:'high',organ:'pancreas'},
          {name:'Total cholesterol',value:'228',unit:'mg/dL',range:'<200',status:'high',organ:'heart'},
          {name:'SGPT (ALT)',value:'62',unit:'U/L',range:'7-56',status:'high',organ:'liver'},
          {name:'Serum Creatinine',value:'1.05',unit:'mg/dL',range:'0.7-1.3',status:'within',organ:'kidneys'}
        ],
        text:'Fasting blood glucose 138 mg/dL 70-99\nPost-prandial glucose 185 mg/dL <140\nHbA1c 7.6 % 4.0-5.6\nTotal cholesterol 228 mg/dL <200\nSGPT (ALT) 62 U/L 7-56\nSerum Creatinine 1.05 mg/dL 0.7-1.3',
        medicines:'',
        verified:true,
        createdAt:new Date().toISOString()
      }];
      localStorage.setItem('vs_guest_reports_'+id,JSON.stringify(sample));
      return sample;
    }
    if(!supabase)return request(`/profiles/${id}/reports`);
    return checked(await supabase.from('reports').select('*').eq('profile_id',id).order('created_at',{ascending:false})).data.map(x=>({id:x.id,...x.payload}));
  },

  async saveReport(profileId:string,r:Omit<Report,'id'>):Promise<Report>{
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      const cur=await this.reports(profileId);
      const newReport:Report={id:'guest-r-'+Date.now(), ...r};
      localStorage.setItem('vs_guest_reports_'+profileId,JSON.stringify([newReport,...cur]));
      return newReport;
    }
    if(!supabase)return request(`/profiles/${profileId}/reports`,'POST',r);
    return request(`/profiles/${profileId}/reports`,'POST',r);
  },

  async deleteReport(id:string){
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      // remove from guest storage keys
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(k&&k.startsWith('vs_guest_reports_')){
          try{
            const list=JSON.parse(localStorage.getItem(k)||'[]');
            localStorage.setItem(k,JSON.stringify(list.filter((x:Report)=>x.id!==id)));
          }catch{}
        }
      }
      return;
    }
    return request('/reports/'+id,'DELETE');
  },

  // Diabetes records API
  async diabetes(profileId:string):Promise<DiabetesRecord[]>{
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      const saved=localStorage.getItem('vs_guest_diabetes_'+profileId);
      if(saved)try{return JSON.parse(saved);}catch{}
      const sampleD:DiabetesRecord[]=[
        {id:'gd-1',profileId,date:new Date().toISOString().slice(0,10),time:'08:00',timing:'before_food',value:138,unit:'mg/dL',notes:'Morning fasting',status:'high',createdAt:new Date().toISOString()},
        {id:'gd-2',profileId,date:new Date().toISOString().slice(0,10),time:'13:30',timing:'after_food',value:185,unit:'mg/dL',notes:'After lunch',status:'high',createdAt:new Date().toISOString()}
      ];
      localStorage.setItem('vs_guest_diabetes_'+profileId,JSON.stringify(sampleD));
      return sampleD;
    }
    return request<DiabetesRecord[]>(`/profiles/${profileId}/diabetes`);
  },

  async saveDiabetes(profileId:string,record:Omit<DiabetesRecord,'id'|'createdAt'>):Promise<DiabetesRecord>{
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      const cur=await this.diabetes(profileId);
      const newD:DiabetesRecord={id:'gd-'+Date.now(), ...record, createdAt:new Date().toISOString()};
      localStorage.setItem('vs_guest_diabetes_'+profileId,JSON.stringify([newD,...cur]));
      return newD;
    }
    return request<DiabetesRecord>(`/profiles/${profileId}/diabetes`,'POST',record);
  },

  async deleteDiabetes(id:string){
    const guestStored=localStorage.getItem('vs_guest_user');
    if(guestStored){
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(k&&k.startsWith('vs_guest_diabetes_')){
          try{
            const list=JSON.parse(localStorage.getItem(k)||'[]');
            localStorage.setItem(k,JSON.stringify(list.filter((x:DiabetesRecord)=>x.id!==id)));
          }catch{}
        }
      }
      return;
    }
    return request('/diabetes/'+id,'DELETE');
  },

  async upload(profileId:string,file:File):Promise<{id:string}>{
    const form=new FormData();
    form.append('file',file);
    return request(`/profiles/${profileId}/files`,'POST',form);
  },

  extract:(profileId:string,fileId:string)=>request<{text:string;rows:Report['rows'];medicines:string}>(`/profiles/${profileId}/extract`,'POST',{fileId,consent:true}),

  medicines:(q:string)=>request<{source:string;results:Array<{id:string;name:string;generic:string;uses:string;warnings:string;source:string}>}>('/medicines?q='+encodeURIComponent(q)),

  async download(fileId:string){
    if(!supabase){
      window.open('/api/files/'+fileId,'_blank','noopener');
      return;
    }
    const {data}=checked(await supabase.from('report_files').select('path').eq('id',fileId).single());
    const r=checked(await supabase.storage.from('health-records').download(data.path));
    downloadBlob(r.data,data.path.split('/').pop()||'report');
  },

  async export(){
    const profiles=await this.profiles();
    return {
      exportedAt:new Date().toISOString(),
      profiles:await Promise.all(profiles.map(async p=>({
        ...p,
        reports:await this.reports(p.id),
        diabetes:await this.diabetes(p.id)
      })))
    };
  }
};

export function downloadBlob(blob:Blob,name:string){
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;
  a.download=name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(u),1000);
}
