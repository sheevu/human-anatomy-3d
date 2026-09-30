import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Box3, Mesh, MeshStandardMaterial, PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { fitDistance, structures, type Bounds, type StructureId } from './explorerData';

export class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onError?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Model({ id, visible, selected, opacity, onSelect, onReady }: {
  id: string; visible: boolean; selected: boolean; opacity: number;
  onSelect: (id: StructureId) => void; onReady: (id: string, bounds: Bounds) => void;
}) {
  const { scene } = useGLTF(`/models/${id}.glb`);
  const color = structures.find(s => s.id === id)?.color || '#94aaa5';
  const clone = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse(object => {
      if (object instanceof Mesh) {
        if (!object.geometry.getAttribute('normal')) object.geometry.computeVertexNormals();
        object.material = new MeshStandardMaterial({ color, roughness: .62, metalness: .02 });
        if (id === 'body') object.raycast = () => {};
      }
    });
    return copy;
  }, [scene, id, color]);
  const { invalidate } = useThree();
  useEffect(() => {
    const box = new Box3().setFromObject(clone);
    onReady(id, { center: box.getCenter(new Vector3()).toArray(), size: box.getSize(new Vector3()).toArray() });
    return () => clone.traverse(o => { if (o instanceof Mesh) (o.material as MeshStandardMaterial).dispose(); });
  }, [clone, id, onReady]);
  useEffect(() => {
    clone.visible = visible;
    clone.traverse(object => {
      if (object instanceof Mesh) {
        const material = object.material as MeshStandardMaterial;
        material.color.set(selected ? '#168a79' : color);
        material.emissive.set(selected ? '#126f61' : '#000000');
        material.emissiveIntensity = selected ? .28 : 0;
        material.opacity = selected ? 1 : opacity;
        material.transparent = material.opacity < 1;
        material.depthWrite = !material.transparent;
        material.needsUpdate = true;
      }
    });
    invalidate();
  }, [clone, color, selected, opacity, visible, invalidate]);
  return <primitive object={clone} dispose={null} onClick={id === 'body' ? undefined : (event: { stopPropagation: () => void; delta: number }) => {
    if (event.delta > 5) return;
    event.stopPropagation(); onSelect(id as StructureId);
  }} />;
}

export type CameraCommand = { revision: number; bounds: Bounds; direction: 'front' | 'back' | 'side'; zoom?: number; orbit?: number; pan?: number };
function Camera({ command, rotating }: { command: CameraCommand; rotating: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size, invalidate } = useThree();
  const destination = useRef<Vector3 | null>(null), target = useRef(new Vector3());
  useEffect(() => {
    if (!controls.current || !(camera instanceof PerspectiveCamera)) return;
    const control = controls.current;
    if (command.zoom || command.orbit || command.pan) {
      const offset = camera.position.clone().sub(control.target);
      if (command.zoom) offset.multiplyScalar(command.zoom).clampLength(.08, 30);
      if (command.orbit) offset.applyAxisAngle(new Vector3(0, 1, 0), command.orbit);
      target.current.copy(control.target);
      if (command.pan) target.current.y += command.pan;
      destination.current = target.current.clone().add(offset);
    } else {
      target.current.set(...command.bounds.center);
      const bounds = command.direction === 'side' ? { ...command.bounds, size: [command.bounds.size[2], command.bounds.size[1], command.bounds.size[0]] as [number, number, number] } : command.bounds;
      const distance = fitDistance(bounds, size.width / size.height, camera.fov);
      const direction = command.direction === 'back' ? new Vector3(0, 0, -1) : command.direction === 'side' ? new Vector3(1, 0, 0) : new Vector3(0, 0, 1);
      destination.current = target.current.clone().addScaledVector(direction, distance);
    }
    invalidate();
  }, [command, camera, size.width, size.height, invalidate]);
  useFrame((_, dt) => {
    if (!destination.current || !controls.current) return;
    const amount = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 1 - Math.exp(-dt * 10);
    camera.position.lerp(destination.current, amount);
    controls.current.target.lerp(target.current, amount);
    controls.current.update();
    if (camera.position.distanceTo(destination.current) < .001 && controls.current.target.distanceTo(target.current) < .001) destination.current = null;
    else invalidate();
  });
  return <OrbitControls ref={controls} makeDefault enableDamping minDistance={.08} maxDistance={30} autoRotate={rotating} autoRotateSpeed={.5} onStart={() => { destination.current = null; }} />;
}

export default function ExplorerScene({ selected, visible, skin, command, rotating, label, onSelect, onReady, onError, retry, bounds }: {
  selected: StructureId | null; visible: Set<string>; skin: number; command: CameraCommand; rotating: boolean; label: boolean;
  onSelect: (id: StructureId) => void; onReady: (id: string, bounds: Bounds) => void; onError: (id: string) => void;
  retry: number; bounds: Record<string, Bounds>;
}) {
  const name = structures.find(s => s.id === selected)?.name;
  return <Canvas camera={{ position: [0, 0, 9], fov: 38, near: .005, far: 100 }} dpr={[1, 1.5]} frameloop="demand"
    gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
    fallback={<div className="explorer-fallback">3D graphics are unavailable. Structure details remain available in the browser.</div>}
    onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); onError('graphics'); }, { once: true }); }}>
    <ambientLight intensity={1.5} /><directionalLight position={[4, 6, 5]} intensity={2.1} /><directionalLight position={[-4, 2, -3]} intensity={1.4} />
    {['body', ...structures.map(s => s.id)].map(id => <SceneBoundary key={`${id}-${retry}`} fallback={null} onError={() => onError(id)}>
      <Suspense fallback={null}><Model id={id} visible={id === 'body' ? skin > 0 : visible.has(id)} selected={selected === id}
        opacity={id === 'body' ? skin : id === 'skeleton' ? .55 : 1} onSelect={onSelect} onReady={onReady} /></Suspense>
    </SceneBoundary>)}
    {label && selected && visible.has(selected) && bounds[selected] && <Html center position={bounds[selected].center} style={{ pointerEvents: 'none' }}><span className="explorer-model-label">{name}</span></Html>}
    <Camera command={command} rotating={rotating} />
  </Canvas>;
}
