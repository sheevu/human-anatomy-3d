"""BodyParts3D derivative preparation: preserve shared coordinates, simplify, export GLB."""
import json, pathlib, urllib.request, concurrent.futures, hashlib
import numpy as np
import trimesh

ROOT=pathlib.Path(__file__).resolve().parents[1]
CACHE=ROOT/'data'/'anatomy-source'; CACHE.mkdir(parents=True,exist_ok=True)
OUT=ROOT/'public'/'models'; OUT.mkdir(parents=True,exist_ok=True)
BASE='https://raw.githubusercontent.com/Kevin-Mattheus-Moerman/BodyParts3D/main/assets/BodyParts3D_data/'
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'VedaShield-Anatomy-Setup'}),timeout=120).read()
tree=json.loads(get('https://api.github.com/repos/Kevin-Mattheus-Moerman/BodyParts3D/git/trees/main?recursive=1'))['tree']
available={pathlib.Path(x['path']).stem for x in tree if '/stl/' in x['path'] and x['path'].endswith('.stl')}
com=get(BASE+'composite_parts.txt').decode().splitlines()
brain=sorted({l.split('\t')[2] for l in com if l.startswith('FMA50801\t') and l.split('\t')[2] in available})
groups={'body':['FMA7163'],'brain':brain,'heart':['FMA7274'],'lungs':['FMA7333','FMA7337','FMA7370','FMA7371','FMA7383'],'liver':['FMA7197'],'pancreas':['FMA7198nsn'],'stomach':['FMA7148'],'kidneys':['FMA7204','FMA7205'],'intestines':['FMA7206','FMA7207','FMA7208','FMA14543nsn']}
def download(id):
    path=CACHE/(id+'.stl')
    if not path.exists(): path.write_bytes(get(BASE+'stl/'+id+'.stl'))
    return id
ids=sorted({id for group in groups.values() for id in group})
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    for i,id in enumerate(pool.map(download,ids)): print(f'Downloaded {i+1}/{len(ids)} {id}',flush=True)
skin=trimesh.load(CACHE/'FMA7163.stl',force='mesh')
center=skin.bounds.mean(axis=0); scale=4.8/(skin.bounds[1,2]-skin.bounds[0,2])
manifest={}
for name,parts in groups.items():
    mesh=trimesh.util.concatenate([trimesh.load(CACHE/(id+'.stl'),force='mesh') for id in parts])
    target=26000 if name=='body' else 18000 if name=='brain' else 9000
    if len(mesh.faces)>target: mesh=mesh.simplify_quadric_decimation(face_count=target)
    mesh.vertices=(mesh.vertices-center)*scale
    mesh.apply_transform(trimesh.transformations.rotation_matrix(-np.pi/2,[1,0,0]))
    mesh.export(OUT/(name+'.glb'))
    manifest[name]={'files':parts,'triangles':len(mesh.faces),'center':mesh.centroid.tolist(),'sha256':hashlib.sha256((OUT/(name+'.glb')).read_bytes()).hexdigest()}
    print(f'Exported {name}: {len(mesh.faces)} triangles',flush=True)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
(OUT/'LICENSE-source.txt').write_bytes(get(BASE+'LICENSE_content'))
print('Anatomy ready.',flush=True)
