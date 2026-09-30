"""Run with Blender --background Startup.blend --python scripts/export-atlas.py.
Exports named meshes in shared coordinates; omits annotations and restricted components.
No source Blender file is modified. GLB output uses core glTF without runtime decoders.
"""
import bpy, json, re, struct, hashlib
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'models' / 'atlas'
OUT.mkdir(parents=True, exist_ok=True)
SYSTEMS = {'1: Skeletal system': 'skeleton', '3: Joints': 'joints',
           '4: Muscular system': 'muscles', '5: Cardiovascular system': 'vessels',
           '6: Lymphoid organs': 'lymphatic', '7: Nervous system & Sense organs': 'nervous',
           '8: Visceral systems': 'viscera', '9: Regions of human body': 'surface'}
# Upstream identifies separate NC / unclear sources for kidney, inner ear and brain surfaces.
RESTRICTED = re.compile(r'kidney|renal|nephron|cochle|vestibul|semicircular|inner ear|labyrinth|tympan|ossicle|malleus|incus|stapes|white matter|telencephalon|cerebral hemisphere|cerebrum', re.I)
objects = {s: [] for s in SYSTEMS.values()}
excluded = []
for obj in sorted(bpy.data.objects, key=lambda o: o.name):
    if obj.type != 'MESH' or len(obj.data.polygons) < 4 or obj.name.endswith('.g'):
        continue
    collections = {c.name for c in obj.users_collection}
    system = next((s for c, s in SYSTEMS.items() if c in collections), None)
    if not system:
        continue
    if RESTRICTED.search(obj.name):
        excluded.append(obj.name)
        continue
    objects[system].append(obj)
corners = [o.matrix_world @ Vector(c) for o in objects['skeleton'] for c in o.bound_box]
lo = Vector([min(v[i] for v in corners) for i in range(3)])
hi = Vector([max(v[i] for v in corners) for i in range(3)])
center = (lo + hi) / 2
scale = 4.8 / (hi.z - lo.z)
print('ATLAS BOUNDS', list(lo), list(hi), 'SCALE', scale, flush=True)
for obj in objects['skeleton']:
    if any((obj.matrix_world @ Vector(c)).x < -.4 for c in obj.bound_box):
        print('LATERAL OUTLIER', obj.name, list(obj.location), flush=True)
# Evaluate copies in an empty scene, avoiding source add-ons and dependency cycles.
export_scene = bpy.data.scenes.new('VedaShield export')
bpy.context.window.scene = export_scene
manifest = {'version': 1, 'source': 'https://github.com/Z-Anatomy/Models-of-human-anatomy',
            'license': 'CC-BY-SA-4.0', 'excluded': excluded, 'systems': {}, 'parts': []}

for system, items in objects.items():
    blob = bytearray()
    doc = {'asset': {'version': '2.0', 'generator': 'VedaShield named anatomy exporter'},
           'scene': 0, 'scenes': [{'nodes': []}], 'nodes': [], 'meshes': [],
           'buffers': [], 'bufferViews': [], 'accessors': []}
    triangles = 0
    def accessor(values, fmt, component, kind, count, bounds=None):
        while len(blob) % 4: blob.append(0)
        offset = len(blob)
        blob.extend(struct.pack('<' + fmt * len(values), *values))
        view = len(doc['bufferViews'])
        doc['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(blob) - offset})
        acc = {'bufferView': view, 'componentType': component, 'count': count, 'type': kind}
        if bounds: acc.update({'min': bounds[0], 'max': bounds[1]})
        doc['accessors'].append(acc)
        return len(doc['accessors']) - 1
    for number, original in enumerate(items):
        obj = original.copy()
        obj.data = original.data.copy()
        export_scene.collection.objects.link(obj)
        obj.modifiers.clear()
        # Keep individually identifiable geometry, with a bounded per-system triangle budget.
        source_triangles = sum(len(p.vertices)-2 for p in obj.data.polygons)
        limit = max(250, min(4000, 420000 // max(1, len(items))))
        if source_triangles > limit:
            modifier = obj.modifiers.new('Web simplification', 'DECIMATE')
            modifier.ratio = limit / source_triangles
        evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        points, normals = [], []
        normal_matrix = obj.matrix_world.to_3x3().inverted().transposed()
        for vertex in mesh.vertices:
            v = (obj.matrix_world @ vertex.co - center) * scale
            points.extend((v.x, v.z, -v.y))
            n = (normal_matrix @ vertex.normal).normalized()
            normals.extend((n.x, n.z, -n.y))
        indices = [i for triangle in mesh.loop_triangles for i in triangle.vertices]
        if not indices:
            evaluated.to_mesh_clear()
            bpy.data.objects.remove(obj, do_unlink=True)
            continue
        minimum = [min(points[i::3]) for i in range(3)]
        maximum = [max(points[i::3]) for i in range(3)]
        identifier = system + '-' + hashlib.sha1(original.name.encode()).hexdigest()[:12]
        label = original.name.strip()
        side = 'Left' if label.endswith('.l') else 'Right' if label.endswith('.r') else ''
        label = re.sub(r'\.[lrij]$', '', label).strip('() ')
        label = (side + ' ' + label[0].lower() + label[1:]) if side else label
        position = accessor(points, 'f', 5126, 'VEC3', len(points)//3, (minimum, maximum))
        normal = accessor(normals, 'f', 5126, 'VEC3', len(normals)//3)
        index = accessor(indices, 'I', 5125, 'SCALAR', len(indices))
        doc['meshes'].append({'name': identifier, 'primitives': [{'attributes': {'POSITION': position, 'NORMAL': normal}, 'indices': index}]})
        doc['nodes'].append({'name': identifier, 'mesh': len(doc['meshes'])-1, 'extras': {'atlasId': identifier}})
        doc['scenes'][0]['nodes'].append(len(doc['nodes'])-1)
        manifest['parts'].append({'id': identifier, 'name': label, 'sourceName': original.name,
                                  'system': system, 'center': [(minimum[i]+maximum[i])/2 for i in range(3)],
                                  'size': [maximum[i]-minimum[i] for i in range(3)]})
        triangles += len(indices)//3
        evaluated.to_mesh_clear()
        copied_mesh = obj.data
        bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.meshes.remove(copied_mesh)
    doc['buffers'] = [{'byteLength': len(blob)}]
    encoded = json.dumps(doc, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    blob.extend(b'\0' * (-len(blob) % 4))
    glb = struct.pack('<III', 0x46546c67, 2, 28 + len(encoded) + len(blob))
    glb += struct.pack('<II', len(encoded), 0x4e4f534a) + encoded
    glb += struct.pack('<II', len(blob), 0x004e4942) + blob
    path = OUT / (system + '.glb')
    path.write_bytes(glb)
    manifest['systems'][system] = {'parts': len(doc['meshes']), 'triangles': triangles,
                                    'bytes': len(glb), 'sha256': hashlib.sha256(glb).hexdigest()}
    print('EXPORTED', system, len(doc['meshes']), triangles, len(glb), flush=True)
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf8')
print('ATLAS COMPLETE', len(manifest['parts']), 'parts', flush=True)
