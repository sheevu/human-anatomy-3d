import { DatabaseSync } from 'node:sqlite';
import { mkdirSync,existsSync,readFileSync,writeFileSync } from 'node:fs';
import { join,resolve } from 'node:path';
import {randomBytes,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
export const dataDir=resolve(process.env.DATA_DIR||'data');mkdirSync(dataDir,{recursive:true});
const keyPath=join(dataDir,'.encryption-key');
if(!process.env.STORAGE_KEY&&!existsSync(keyPath))writeFileSync(keyPath,randomBytes(32).toString('hex'),{mode:0o600});
const key=Buffer.from(process.env.STORAGE_KEY||readFileSync(keyPath,'utf8').trim(),'hex');
if(key.length!==32)throw Error('STORAGE_KEY must contain 64 hexadecimal characters');
export const db=new DatabaseSync(join(dataDir,'vedashield.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE,password TEXT,name TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,expires INTEGER);
CREATE TABLE IF NOT EXISTS profiles(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id) ON DELETE CASCADE,payload TEXT);
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY,profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,payload TEXT);
CREATE TABLE IF NOT EXISTS files(id TEXT PRIMARY KEY,profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,payload TEXT);
CREATE TABLE IF NOT EXISTS kyc(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,payload TEXT);
CREATE TABLE IF NOT EXISTS diabetes(id TEXT PRIMARY KEY,profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,payload TEXT);`);
export function encrypt(value){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);const result=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),result]).toString('base64');}
export function decrypt(value){const b=Buffer.from(value,'base64'),dec=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));dec.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([dec.update(b.subarray(28)),dec.final()]).toString());}
export const hashToken=t=>createHash('sha256').update(t).digest('hex');
