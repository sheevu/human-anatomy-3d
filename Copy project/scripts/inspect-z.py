import bpy,json
from pathlib import Path
rows=[]
for o in bpy.data.objects:
 if o.type=='MESH': rows.append({'name':o.name,'collections':[c.name for c in o.users_collection],'vertices':len(o.data.vertices),'bounds':list(o.dimensions),'props':{k:str(o[k])[:120] for k in o.keys()}})
Path('data/z-anatomy-inventory.json').write_text(json.dumps(rows,indent=2),encoding='utf8')
print('MESHES',len(rows))
print('COLLECTIONS',[(c.name,len(c.all_objects)) for c in bpy.data.collections if len(c.all_objects)>20][:100])
