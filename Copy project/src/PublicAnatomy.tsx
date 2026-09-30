import {lazy,Suspense,useState} from 'react';
import {ShieldCheck} from 'lucide-react';
import {organs} from './medical.js';
const Anatomy=lazy(()=>import('./Anatomy'));
export default function PublicAnatomy(){
 const [selected,setSelected]=useState<string|null>(null),[hi,setHi]=useState(false);
 const organ=selected?organs[selected as keyof typeof organs]:null;
 return <main className="public-atlas"><header><a className="brand" href="/"><ShieldCheck size={28}/>VedaShield AI</a><div className="row wrap"><button className="secondary" onClick={()=>{setHi(!hi);document.documentElement.lang=hi?'en':'hi'}}>{hi?'English':'हिंदी'}</button><a className="secondary" href="/">{hi?'स्वास्थ्य कार्यक्षेत्र':'Health workspace'}</a></div></header><div className="welcome"><div><span className="eyebrow">{hi?'मानव शरीर को करीब से देखें':'EXPLORE THE HUMAN BODY'}</span><h1>{hi?'हर संरचना, एक नई समझ।':'Anatomy, a little closer.'}</h1><p>{hi?'अंग और शरीर के भाग चुनें, घुमाएं और अलग करके देखें।':'Explore organs, bones, muscles, and body regions. Select any available structure, rotate it, and take a closer look.'}</p></div></div><section className="card"><Suspense fallback={<p className="empty">Loading anatomy explorer…</p>}><Anatomy large selected={selected} onSelect={setSelected} hi={hi}/></Suspense>{organ&&<div className="public-organ-description" aria-live="polite"><h2>{organ[hi?'hi':'en']}</h2><p>{organ.description[hi?1:0]}</p></div>}</section></main>
}
