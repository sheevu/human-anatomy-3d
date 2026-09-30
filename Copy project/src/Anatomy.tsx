import {Component,Suspense,useCallback,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {Canvas,useThree,type ThreeEvent} from '@react-three/fiber';
import {Html,OrbitControls,useGLTF} from '@react-three/drei';
import {Mesh,MeshStandardMaterial,Box3,Vector3,DoubleSide,PerspectiveCamera} from 'three';
import type {OrbitControls as OrbitControlsType} from 'three-stdlib';
import {RotateCcw,ZoomIn,ZoomOut,Eye,EyeOff,Focus,Search,Maximize,Minimize,RotateCw} from 'lucide-react';
import {organs} from './medical.js';
import {systems,fitDistance,type AtlasPart,type AtlasManifest} from './atlas';

type Organ=keyof typeof organs;
type Bounds={center:[number,number,number];size:[number,number,number]};
type View={bounds:Bounds;direction:'front'|'back'|'side';revision:number};
const whole:Bounds={center:[0,0,0],size:[2.5,4.8,.8]};
const organKeys=Object.keys(organs) as Organ[];
class ViewerBoundary extends Component<{children:ReactNode;retry:()=>void},{error:boolean}>{
 state={error:false};
 static getDerivedStateFromError(){return {error:true}}
 render(){return this.state.error?<div className="empty" role="alert"><p>The 3D view could not load. You can still browse structure names below.</p><button className="secondary" onClick={this.props.retry}>Retry 3D view</button></div>:this.props.children}
}
function Geometry({url,color,selected,onSelect,opacity=1,hidden,isolate,organId,onBounds,highlighted=false}:{url:string;color:string;selected:string|null;onSelect:(id:string)=>void;opacity?:number;hidden:Set<string>;isolate:boolean;organId?:string;onBounds?:(id:string,bounds:Bounds)=>void;highlighted?:boolean}){
 const {scene}=useGLTF(url);
 const copy=useMemo(()=>{const clone=scene.clone(true);clone.traverse(o=>{if(o instanceof Mesh){o.material=new MeshStandardMaterial({color,roughness:.66,metalness:.02,side:DoubleSide});if(organId)o.userData.atlasId=organId;}});return clone},[scene,color,organId]);
 useEffect(()=>{copy.traverse(o=>{if(o instanceof Mesh){const id=o.userData.atlasId||o.name;const active=id===selected;const material=o.material as MeshStandardMaterial;o.visible=!hidden.has(id)&&(!isolate||active);material.color.set(active?'#2caa91':highlighted?'#e05050':color);material.emissive.set(active?'#106958':highlighted?'#aa2222':'#000000');material.emissiveIntensity=active?.45:highlighted?.55:.12;material.opacity=opacity;material.transparent=opacity<1;material.depthWrite=opacity>=.95;material.needsUpdate=true;}})},[copy,selected,color,opacity,hidden,isolate,highlighted]);
 useEffect(()=>{if(organId&&onBounds){const box=new Box3().setFromObject(copy);onBounds(organId,{center:box.getCenter(new Vector3()).toArray(),size:box.getSize(new Vector3()).toArray()})}return()=>{copy.traverse(o=>{if(o instanceof Mesh)(o.material as MeshStandardMaterial).dispose()})}},[copy,organId,onBounds]);
 const select=(e:ThreeEvent<MouseEvent>)=>{if(organId==='body')return;e.stopPropagation();onSelect(e.object.userData.atlasId||e.object.name)};
 return <primitive object={copy} onClick={organId==='body'?undefined:select} dispose={null}/>;
}
function CameraRig({view,controls}:{view:View;controls:React.RefObject<OrbitControlsType|null>}){
 const {camera,size,invalidate}=useThree();
 useEffect(()=>{const c=controls.current;if(!c||!(camera instanceof PerspectiveCamera))return;
  const center=new Vector3(...view.bounds.center),distance=fitDistance(view.bounds.size,size.width/size.height,camera.fov);
  const direction=view.direction==='back'?new Vector3(0,0,-1):view.direction==='side'?new Vector3(1,0,0):new Vector3(0,0,1);
  c.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);camera.near=.005;camera.far=100;camera.updateProjectionMatrix();c.update();invalidate();
 },[camera,controls,invalidate,size.width,size.height,view]);
 return null;
}
export default function Anatomy({selected,onSelect,highlighted=[],hi=false,large=false}:{selected:string|null;onSelect:(s:string|null)=>void;highlighted?:string[];hi?:boolean;large?:boolean}){
 const [layer,setLayer]=useState('organs'),[opacity,setOpacity]=useState(.12),[isolate,setIsolate]=useState(false),[labels,setLabels]=useState(false),[reset,setReset]=useState(0);
 const [atlas,setAtlas]=useState<AtlasManifest|null>(null),[atlasError,setAtlasError]=useState(false),[partId,setPartId]=useState<string|null>(null),[search,setSearch]=useState(''),[hidden,setHidden]=useState<Set<string>>(new Set()),[expanded,setExpanded]=useState(false),[rotating,setRotating]=useState(false);
 const [view,setView]=useState<View>({bounds:whole,direction:'front',revision:0});
 const [organBounds,setOrganBounds]=useState<Record<string,Bounds>>({});
 const controls=useRef<OrbitControlsType|null>(null),root=useRef<HTMLDivElement>(null);
 const rememberBounds=useCallback((id:string,bounds:Bounds)=>setOrganBounds(prev=>({...prev,[id]:bounds})),[]);
 const loadAtlas=useCallback(()=>{setAtlasError(false);fetch('/models/atlas/manifest.json').then(r=>{if(!r.ok)throw Error('Atlas unavailable');return r.json()}).then(setAtlas).catch(()=>setAtlasError(true))},[]);
 useEffect(loadAtlas,[loadAtlas]);
 useEffect(()=>{if(selected&&organKeys.includes(selected as Organ)){setLayer('organs');setPartId(null);setHidden(prev=>{const next=new Set(prev);next.delete(selected);return next})}},[selected]);
 useEffect(()=>{if(!expanded)return;const before=document.body.style.overflow;document.body.style.overflow='hidden';const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setExpanded(false);root.current?.querySelector<HTMLButtonElement>('[data-expand]')?.focus()}};document.addEventListener('keydown',onKey);return()=>{document.body.style.overflow=before;document.removeEventListener('keydown',onKey)}},[expanded]);
 const active=layer==='organs'?selected:partId;
 const part=atlas?.parts.find(p=>p.id===partId);
 const activeName=layer==='organs'?(selected?organs[selected as Organ]?.[hi?'hi':'en']:null):part?.name;
 const activeBounds=layer==='organs'?(selected?organBounds[selected]:undefined):part;
 const parts=useMemo(()=>atlas?.parts.filter(p=>p.system===layer)||[],[atlas,layer]);
 const results=useMemo(()=>{const q=search.trim().toLowerCase();return (q?atlas?.parts.filter(p=>p.name.toLowerCase().includes(q)):parts)||[]},[atlas,parts,search]);
 const organResults=organKeys.filter(k=>!search.trim()||`${organs[k].en} ${organs[k].hi}`.toLowerCase().includes(search.trim().toLowerCase()));
 function changeLayer(next:string){setLayer(next);setIsolate(false);setPartId(null);setSearch('');setHidden(new Set());setView(v=>({bounds:whole,direction:'front',revision:v.revision+1}))}
 function choosePart(p:AtlasPart){if(layer!==p.system){setLayer(p.system);setIsolate(false)}setPartId(p.id);onSelect(null);setHidden(prev=>{const next=new Set(prev);next.delete(p.id);return next});setView(v=>({bounds:whole,direction:'front',revision:v.revision+1}))}
 function chooseOrgan(id:string){setLayer('organs');setPartId(null);onSelect(id);setHidden(prev=>{const next=new Set(prev);next.delete(id);return next});if(organBounds[id])fit(organBounds[id]);}
 function fit(bounds:Bounds=whole,direction:View['direction']='front'){setView(v=>({bounds,direction,revision:v.revision+1}))}
 function restore(){setHidden(new Set());setIsolate(false);setOpacity(.12);setRotating(false);fit()}
 function zoom(factor:number){const c=controls.current;if(!c)return;const offset=c.object.position.clone().sub(c.target);c.object.position.copy(c.target).add(offset.multiplyScalar(factor));c.update()}
 const displayLayers=['organs',...Object.keys(atlas?.systems||{})];
 const selectMesh=(id:string)=>{const p=atlas?.parts.find(p=>p.id===id);if(p){setPartId(id);onSelect(null)}};
 return <div ref={root} className={'anatomy '+(large?'anatomy-large ':'')+(expanded?'anatomy-expanded':'')}>
  <div className="anatomy-top"><span className="eyebrow"><span className="live-dot"/>{hi?'इंटरैक्टिव 3D एटलस':'HUMAN ANATOMY · 3D ATLAS'}</span><button data-expand className="icon-button" aria-label={expanded?'Exit expanded anatomy':'Expand anatomy'} aria-pressed={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?<Minimize size={18}/>:<Maximize size={18}/>}</button></div>
  <div className="layer-tabs" role="group" aria-label={hi?'शरीर तंत्र':'Body systems'}>{displayLayers.map(l=><button key={l} aria-pressed={layer===l} className={layer===l?'active':''} onClick={()=>changeLayer(l)}>{systems[l]?.[hi?'hi':'name']||l}</button>)}</div>
  {atlasError&&<p className="atlas-notice" role="status">Extended atlas unavailable. Major organs remain available. <button onClick={loadAtlas}>Retry atlas</button></p>}
  <div className="atlas-stage"><div className="body-canvas" aria-label="Interactive human anatomy. Drag to rotate, pinch to zoom, or use the named structure buttons below.">
   <ViewerBoundary key={reset} retry={()=>{useGLTF.clear(layer==='organs'?'/models/body.glb':'/models/atlas/'+layer+'.glb');setReset(v=>v+1)}}><Canvas camera={{position:[0,0,9],fov:37,near:.005,far:100}} dpr={[1,1.5]} frameloop="demand" gl={{alpha:true,antialias:true,powerPreference:'low-power'}} onPointerMissed={()=>{setPartId(null);onSelect(null);setIsolate(false)}}>
    <ambientLight intensity={1.5}/><directionalLight position={[4,6,5]} intensity={2.6}/><directionalLight position={[-3,1,-4]} intensity={1.1}/>
    <Suspense fallback={<Html center><span className="loading" role="status">{hi?'मॉडल लोड हो रहा है…':'Loading structures…'}</span></Html>}>
     {layer==='organs'?<><Geometry url="/models/body.glb" organId="body" color="#b2c8bf" selected={null} opacity={isolate?0:opacity} hidden={hidden} isolate={false} onSelect={()=>{}}/>{organKeys.map(k=><Geometry key={k} url={'/models/'+k+'.glb'} organId={k} color={organs[k].color} selected={selected} hidden={hidden} isolate={isolate} onSelect={chooseOrgan} onBounds={rememberBounds} highlighted={highlighted.includes(k)}/>)}</>:<Geometry key={layer} url={'/models/atlas/'+layer+'.glb'} color={systems[layer]?.color||'#c7aaa0'} selected={partId} hidden={hidden} isolate={isolate} onSelect={selectMesh}/>}
     {labels&&activeBounds&&activeName&&!hidden.has(active||'')&&<Html position={activeBounds.center} center><span className="anatomy-label">{activeName}</span></Html>}
    </Suspense>
    <OrbitControls ref={controls} makeDefault enablePan minDistance={.08} maxDistance={30} enableDamping autoRotate={rotating} autoRotateSpeed={.65}/><CameraRig view={view} controls={controls}/>
   </Canvas></ViewerBoundary>
   <div className="view-presets" role="group" aria-label="Anatomy camera views">{(['front','back','side'] as const).map(d=><button key={d} aria-pressed={view.direction===d} onClick={()=>fit(isolate&&activeBounds?activeBounds:whole,d)}>{hi?({front:'सामने',back:'पीछे',side:'बगल'})[d]:d[0].toUpperCase()+d.slice(1)}</button>)}</div>
  </div>
  <div className="viewer-tools"><button aria-label="Zoom in" onClick={()=>zoom(.8)}><ZoomIn size={18}/></button><button aria-label="Zoom out" onClick={()=>zoom(1.25)}><ZoomOut size={18}/></button><button aria-label="Reset anatomy view" onClick={restore}><RotateCcw size={18}/></button><button aria-label="Toggle selected structure label" aria-pressed={labels} onClick={()=>setLabels(!labels)}><Eye size={18}/></button><button aria-label="Focus selected structure" disabled={!activeBounds} onClick={()=>activeBounds&&fit(activeBounds)}><Focus size={18}/></button><button aria-label="Auto rotate anatomy" aria-pressed={rotating} onClick={()=>setRotating(!rotating)}><RotateCw size={18}/></button></div></div>
  <div className="atlas-selection" aria-live="polite"><div><small>{hi?'चयनित संरचना':'SELECTED STRUCTURE'}</small><strong>{activeName||(hi?'खोजने के लिए किसी भाग को चुनें':'Select a part to explore')}</strong></div><div className="row wrap"><button className="secondary" disabled={!active} aria-pressed={isolate} onClick={()=>{setIsolate(!isolate);if(activeBounds)fit(isolate?whole:activeBounds)}}><Focus size={15}/>{hi?'अलग देखें':'Isolate'}</button><button className="secondary" disabled={!active} onClick={()=>{if(active){setHidden(prev=>new Set([...prev,active]));setIsolate(false);fit()}}}><EyeOff size={15}/>{hi?'छिपाएं':'Hide'}</button></div></div>
  {hidden.size>0&&<button className="text-button" onClick={restore}>{hi?'सभी दिखाएं':'Show all structures'} ({hidden.size} {hi?'छिपे हैं':'hidden'})</button>}
  {layer==='organs'&&<label className="opacity">{hi?'शरीर की अपारदर्शिता':'Body opacity'}<input aria-label="Body opacity" type="range" min="0" max="0.8" step="0.01" value={opacity} onChange={e=>setOpacity(+e.target.value)}/><output>{Math.round(opacity*100)}%</output></label>}
  <div className="atlas-browser"><div className="search-field"><Search size={17}/><input type="search" aria-label="Search all anatomy structures" placeholder={hi?'सभी संरचनाएं खोजें (अंग्रेज़ी नाम)…':'Search every structure, e.g. femur…'} value={search} onChange={e=>setSearch(e.target.value)}/></div>
   <div className="atlas-browser-heading"><span>{search?`${results.length+organResults.length} ${hi?'परिणाम':'matches'}`:systems[layer]?.[hi?'hi':'name']}</span><span>{layer==='organs'?'8 organ groups':`${parts.length} structures`}</span></div>
   {(layer==='organs'||search)&&<div className="organ-pills">{organResults.map(k=><button key={k} aria-pressed={selected===k&&layer==='organs'} className={selected===k&&layer==='organs'?'active':''} onClick={()=>chooseOrgan(k)}><i style={{background:organs[k].color}}/>{organs[k][hi?'hi':'en']}{highlighted.includes(k)&&<span className="organ-mark"/>}</button>)}</div>}
   {(layer!=='organs'||search)&&<div className="structure-list" role="group" aria-label="Anatomy structures">{results.slice(0,100).map(p=><button key={p.id} aria-pressed={partId===p.id} className={partId===p.id?'active':''} onClick={()=>choosePart(p)}><span>{p.name}</span>{search&&<small>{systems[p.system]?.[hi?'hi':'name']}</small>}{hidden.has(p.id)&&<EyeOff size={14}/>}</button>)}{results.length>100&&<p className="fine-print">{hi?'पहली 100 संरचनाएं। खोज से सूची छोटी करें।':'Showing the first 100. Search to narrow the list; every structure is searchable and selectable on the model.'}</p>}{!results.length&&!organResults.length&&<p className="fine-print">{hi?'कोई परिणाम नहीं। दूसरा नाम खोजें।':'No structures found. Try another anatomical name.'}</p>}</div>}
  </div>
  {part&&layer!=='organs'&&<p className="atlas-description">{part.name} · {hi?'इस संरचना को घुमाकर और ज़ूम करके देखें।':'Rotate, focus, or isolate this structure to inspect its shape and location.'}</p>}
  <div className="anatomy-caption"><span>{hi?'घुमाएं: खींचें · ज़ूम: पिंच · पैन: दो उंगलियां':'Drag to rotate · Pinch to zoom · Two fingers to pan'}</span><a href="/models/ATTRIBUTION.md" target="_blank" rel="noreferrer">{hi?'स्रोत और लाइसेंस':'Sources & licenses'}</a></div>
  <p className="atlas-scope">{hi?'सरल शैक्षिक संदर्भ। हर सूक्ष्म संरचना शामिल नहीं है।':'Simplified educational reference; not every microscopic structure is included.'}</p>
 </div>
}
