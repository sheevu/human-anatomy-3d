import { spawnSync } from 'node:child_process';
const install=spawnSync('python',['-m','pip','install','trimesh','fast-simplification','numpy'],{stdio:'inherit'});
if(install.status)process.exit(install.status);
const run=spawnSync('python',['scripts/download-anatomy.py'],{stdio:'inherit'}); process.exit(run.status||0);
