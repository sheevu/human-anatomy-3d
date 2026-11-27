import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import { DoubleSide, Mesh, MeshStandardMaterial, PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { fitDistance, systems, type AtlasManifest, type AtlasPart } from './atlas';
import './detailed-atlas.css';

type AtlasSystem = Exclude<keyof typeof systems, 'organs'>;
type Bounds = { center: [number, number, number]; size: [number, number, number] };
const SYSTEM_KEYS = Object.keys(systems).filter((key) => key !== 'organs') as AtlasSystem[];
const FULL_BODY: Bounds = { center: [0, 0, 0], size: [2.4, 4.8, 1.35] };
const normalize = (value: string) => value.toLowerCase().replace(/\.\d{3}$/g, '').replace(/[^a-z0-9]/g, '');
const finite = (value: number) => Number.isFinite(value) && value > 0 ? value : 0.1;

function AtlasCamera({ target, controls }: {
  target: Bounds;
  controls: RefObject<OrbitControlsType | null>;
}) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || !(camera instanceof PerspectiveCamera) || size.height <= 0) return;
    const center = new Vector3(...target.center);
    const distance = fitDistance(target.size.map(finite), size.width / size.height, camera.fov);
    camera.position.copy(center).add(new Vector3(0, 0.06, Math.max(0.28, distance)));
    orbit.target.copy(center);
    camera.near = Math.max(0.001, distance / 1000);
    camera.far = Math.max(30, distance * 20);
    camera.updateProjectionMatrix();
    orbit.update();
    invalidate();
  }, [camera, controls, invalidate, size.height, size.width, target]);
  return null;
}

function AtlasSystemModel({
  system, parts, chosen, opacity, isolate, selectPart,
}: {
  system: AtlasSystem;
  parts: AtlasPart[];
  chosen: string | null;
  opacity: number;
  isolate: boolean;
  selectPart: (part: AtlasPart) => void;
}) {
  const { scene } = useGLTF('/models/atlas/' + system + '.glb');
  const byIdentifier = useMemo(() => {
    const map = new Map<string, AtlasPart>();
    for (const part of parts) {
      for (const name of [part.id, part.sourceName, part.name]) {
        const key = normalize(name);
        if (key && !map.has(key)) map.set(key, part);
      }
    }
    return map;
  }, [parts]);

  const resolve = useCallback((mesh: Mesh): AtlasPart | undefined => {
    const candidates = [
      mesh.userData?.atlasId,
      mesh.userData?.sourceName,
      mesh.userData?.name,
      mesh.name,
      mesh.parent?.name,
    ];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const part = byIdentifier.get(normalize(candidate));
      if (part) return part;
    }
    return undefined;
  }, [byIdentifier]);

  const copy = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const source = object.material instanceof MeshStandardMaterial ? object.material : null;
      const material = source ? source.clone() : new MeshStandardMaterial({ side: DoubleSide });
      material.side = DoubleSide;
      material.metalness = 0.04;
      material.roughness = 0.48;
      if (!source) material.color.set(systems[system].color);
      object.material = material;
    });
    return cloned;
  }, [scene, system]);

  useEffect(() => {
    copy.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const material = object.material as MeshStandardMaterial;
      const part = resolve(object);
      const selected = !!chosen && part?.id === chosen;
      object.visible = !(isolate && chosen && !selected);
      material.opacity = selected ? 1 : opacity;
      material.transparent = !selected && opacity < 1;
      material.depthWrite = selected || opacity >= 0.99;
      material.emissive.set(selected ? '#f9a64e' : '#0d2534');
      material.emissiveIntensity = selected ? 0.66 : 0.10;
      material.needsUpdate = true;
    });
  }, [copy, resolve, chosen, opacity, isolate]);

  useEffect(() => () => {
    copy.traverse((object) => {
      if (object instanceof Mesh && object.material instanceof MeshStandardMaterial) {
        object.material.dispose();
      }
    });
  }, [copy]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!(event.object instanceof Mesh)) return;
    const part = resolve(event.object);
    if (part) selectPart(part);
  };
  return <primitive object={copy} dispose={null} onClick={handleClick} />;
}

export default function DetailedAtlasExplorer({ hi = false }: { hi?: boolean }) {
  const [manifest, setManifest] = useState<AtlasManifest | null>(null);
  const [loadError, setLoadError] = useState('');
  const [system, setSystem] = useState<AtlasSystem>('viscera');
  const [selected, setSelected] = useState<AtlasPart | null>(null);
  const [query, setQuery] = useState('');
  const [opacity, setOpacity] = useState(1);
  const [isolate, setIsolate] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const orbit = useRef<OrbitControlsType | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/models/atlas/manifest.json', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Anatomy manifest could not be loaded.');
        return res.json() as Promise<AtlasManifest>;
      })
      .then((data) => setManifest(data))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Unable to load the anatomy atlas.');
      });
    return () => controller.abort();
  }, []);

  const parts = useMemo(() => (manifest?.parts ?? []).filter((p) => p.system === system), [manifest, system]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parts.slice(0, 16);
    return parts.filter((p) => (p.name + ' ' + p.sourceName + ' ' + p.id).toLowerCase().includes(q)).slice(0, 36);
  }, [parts, query]);
  const target = useMemo(() => selected
    ? { center: selected.center, size: selected.size.map((v) => Math.max(v * 2, 0.16)) as [number, number, number] }
    : FULL_BODY, [selected]);

  const changeSystem = (next: AtlasSystem) => {
    setSystem(next);
    setSelected(null);
    setQuery('');
    setIsolate(false);
  };
  const choosePart = (part: AtlasPart) => {
    setSelected(part);
    setIsolate(false);
  };

  return (
    <section className={'detailed-atlas' + (expanded ? ' detailed-atlas-expanded' : '')} aria-label="Detailed anatomy explorer">
      <div className="detailed-atlas-header">
        <div><strong>{hi ? 'विस्तृत शरीर रचना' : 'DETAILED ANATOMY ATLAS'}</strong>
          <small>{hi ? 'सत्यापित स्रोत मॉडल • शैक्षिक उपयोग' : 'Source anatomy meshes · educational visualization'}</small></div>
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? 'Exit full screen' : 'Enlarge atlas'}>
          {expanded ? (hi ? 'बंद करें' : 'Close fullscreen') : (hi ? 'बड़ा देखें' : 'Fullscreen')}
        </button>
      </div>
      <nav className="detailed-atlas-systems" aria-label="Anatomical systems">
        {SYSTEM_KEYS.map((key) => <button type="button" key={key} aria-pressed={system === key}
          onClick={() => changeSystem(key)}>
          {hi ? systems[key].hi : systems[key].name}
          <small>{manifest?.systems[key]?.parts ?? ''}</small>
        </button>)}
      </nav>
      <div className="detailed-atlas-main">
        <div className="detailed-atlas-viewport">
          {loadError ? <div className="detailed-atlas-loading" role="alert">{loadError}</div> :
            <Canvas dpr={[1, 1.4]} frameloop="demand"
              camera={{ position: [0, 0.8, 6], fov: 37, near: 0.005, far: 100 }}
              gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}>
              <color attach="background" args={['#071625']} />
              <ambientLight intensity={0.9} />
              <hemisphereLight args={['#8bd4ed', '#1e1724', 0.8]} />
              <directionalLight position={[3, 5, 7]} intensity={2.1} color="#ffe7cf" />
              <directionalLight position={[-4, 1, -5]} intensity={1.2} color="#5bd3f5" />
              <Suspense fallback={<Html center><div className="detailed-atlas-loading">
                {hi ? 'मॉडल लोड हो रहा है…' : 'Loading detailed anatomy…'}
              </div></Html>}>
                <AtlasSystemModel system={system} parts={parts} chosen={selected?.id ?? null}
                  opacity={opacity} isolate={isolate} selectPart={choosePart} />
              </Suspense>
              <OrbitControls ref={orbit} makeDefault enableDamping dampingFactor={0.08}
                enablePan minDistance={0.06} maxDistance={40} />
              <AtlasCamera target={target} controls={orbit} />
            </Canvas>}
          <div className="detailed-atlas-viewport-caption">
            {hi ? 'घुमाएँ • ज़ूम करें • अंग चुनें' : 'Drag to rotate · Pinch to zoom · Tap a structure'}
          </div>
        </div>
        <aside className="detailed-atlas-panel">
          <label htmlFor="detailed-structure-search">{hi ? 'संरचना खोजें' : 'Find an anatomical structure'}</label>
          <input id="detailed-structure-search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={hi ? 'नाम खोजें…' : 'Search by name…'} />
          {selected ? <div className="detailed-atlas-selected" aria-live="polite">
            <span>{hi ? 'चयनित संरचना' : 'SELECTED STRUCTURE'}</span>
            <strong>{selected.name}</strong>
            <small>{systems[system].name} · {selected.sourceName}</small>
            <div className="detailed-atlas-actions">
              <button type="button" aria-pressed={isolate} onClick={() => setIsolate((v) => !v)}>
                {isolate ? (hi ? 'सब दिखाएँ' : 'Show all') : (hi ? 'अलग देखें' : 'Isolate')}
              </button>
              <button type="button" onClick={() => { setSelected(null); setIsolate(false); }}>
                {hi ? 'रीसेट' : 'Reset'}
              </button>
            </div>
          </div> : <p className="detailed-atlas-helper">
            {hi ? 'किसी भाग को टैप करें या सूची में नाम चुनें।' : 'Tap a structure or choose it from the list.'}
          </p>}
          <div className="detailed-atlas-opacity">
            <label htmlFor="detailed-opacity">{hi ? 'पारदर्शिता' : 'Layer opacity'} · {Math.round(opacity * 100)}%</label>
            <input id="detailed-opacity" type="range" min="0.15" max="1" step="0.05"
              value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
          </div>
          <div className="detailed-atlas-results" role="list" aria-label="Anatomical structures">
            {results.map((part) => <button role="listitem" type="button" key={part.id}
              aria-pressed={selected?.id === part.id} onClick={() => choosePart(part)}>
              {part.name}
            </button>)}
            {manifest && results.length === 0 && <span>{hi ? 'कोई परिणाम नहीं' : 'No matching structures'}</span>}
          </div>
          <p className="detailed-atlas-notice">
            {hi ? 'सिर्फ शैक्षिक 3D संदर्भ। किसी बीमारी या अंग क्षति का निदान नहीं।'
              : 'Educational 3D reference only. Highlights do not indicate a medical diagnosis or injury.'}
          </p>
        </aside>
      </div>
    </section>
  );
}
