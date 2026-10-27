import { existsSync } from 'node:fs';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { bootstrapAuth, getAuth } from '../server/auth';
import { access } from '../server/access';
import { appUrl } from '../server/config';
import { db } from '../server/db';
import { command, snapshot } from '../server/workspace';
if(existsSync('.env'))process.loadEnvFile('.env');
const enabled=!!process.env.DATABASE_URL&&new URL(process.env.DATABASE_URL).pathname.endsWith('_test');
describe.skipIf(!enabled)('authenticated workspace isolation',()=>{
 const ids:string[]=[];const userIds:string[]=[];let cookie='';let ctxA:{workspaceId:string;userId:string;role:string;demo:boolean};let ctxB:typeof ctxA;let leadId='';
 beforeAll(async()=>{vi.stubEnv('APP_MODE','selfhost');process.env.BETTER_AUTH_SECRET||='integration-test-only-secret-at-least-32-characters';for(const n of ['A','B']){const user=await bootstrapAuth().api.signUpEmail({body:{email:`test-${n}-${crypto.randomUUID()}@example.com`,password:'Example-test-password-123!',name:`Tester ${n}`}});userIds.push(user.user.id);const org=await db.organization.create({data:{id:crypto.randomUUID(),name:n,slug:crypto.randomUUID(),members:{create:{id:crypto.randomUUID(),userId:user.user.id,role:'owner'}}}});ids.push(org.id);if(n==='A'){ctxA={workspaceId:org.id,userId:user.user.id,role:'owner',demo:false};const r=await getAuth().handler(new Request(`${appUrl()}/api/auth/sign-in/email`,{method:'POST',headers:{'Content-Type':'application/json',Origin:appUrl()},body:JSON.stringify({email:user.user.email,password:'Example-test-password-123!'})}));expect(r.status).toBe(200);cookie=r.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');}else ctxB={workspaceId:org.id,userId:user.user.id,role:'owner',demo:false};}},30000);
 afterAll(async()=>{await db.feedbackEntry.deleteMany({where:{workspaceId:{in:ids}}});await db.auditLog.deleteMany({where:{workspaceId:{in:ids}}});await db.lead.deleteMany({where:{workspaceId:{in:ids}}});await db.organization.deleteMany({where:{id:{in:ids}}});await db.user.deleteMany({where:{id:{in:userIds}}});vi.unstubAllEnvs();await db.$disconnect();});
 it('requires sessions and validates workspace selection',async()=>{const host=new URL(appUrl()).host;await expect(access(new NextRequest(`${appUrl()}/api/workspace`,{headers:{Host:host}}))).rejects.toMatchObject({status:401});const actual=await access(new NextRequest(`${appUrl()}/api/workspace`,{headers:{Host:host,Cookie:cookie}}));expect(actual.workspaceId).toBe(ctxA.workspaceId);await expect(access(new NextRequest(`${appUrl()}/api/workspace`,{headers:{Host:host,Cookie:cookie,'X-Workspace-ID':ctxB.workspaceId}}))).rejects.toMatchObject({status:403});});
 it('rejects unrestricted signup',async()=>{const r=await getAuth().handler(new Request(`${appUrl()}/api/auth/sign-up/email`,{method:'POST',headers:{'Content-Type':'application/json',Origin:appUrl()},body:JSON.stringify({email:`uninvited-${crypto.randomUUID()}@example.com`,name:'Uninvited',password:'Example-test-password-123!'})}));expect(r.status).toBe(403);});
 it('isolates reads, edits, notes, drafts and feedback',async()=>{const lead=await command({action:'createLead',name:`Private ${crypto.randomUUID()}`},ctxA);if (!("id" in lead)) throw new Error("Lead ID missing"); leadId=lead.id;expect((await snapshot(ctxA)).leads.some(l=>l.id===leadId)).toBe(true);expect((await snapshot(ctxB)).leads.some(l=>l.id===leadId)).toBe(false);for(const action of [{action:'updateLead',name:'Stolen'},{action:'addNote',body:'Bad'},{action:'generateDraft'},{action:'feedback',rating:5,comments:'Bad'}])await expect(command({...action,leadId},ctxB)).rejects.toMatchObject({status:404});const audit=await db.auditLog.findFirst({where:{entityId:leadId}});expect(audit?.actorId).toBe(ctxA.userId);});

 it('keeps contact clocks independent from notes and saves next steps atomically',async()=>{
  const ctx=ctxA;const initial=await db.lead.findUniqueOrThrow({where:{id:leadId}});expect(initial.lastContactedAt).toBeNull();
  await command({action:'addNote',leadId,body:'Internal research only'},ctx);expect((await db.lead.findUniqueOrThrow({where:{id:leadId}})).lastContactedAt).toBeNull();
  const input={action:'logInteraction',leadId,outcome:'EMAILED',requestKey:crypto.randomUUID(),note:'Actually emailed',dueAt:'2026-12-01T15:00:00Z',nextAction:'Check proposal'};
  const first=await command(input,ctx);const again=await command(input,ctx);expect(again).toEqual(first);
  const saved=await db.lead.findUniqueOrThrow({where:{id:leadId},include:{tasks:true,interactions:true}});expect(saved.interactions).toHaveLength(1);expect(saved.tasks.filter(t=>t.status==='OPEN')).toHaveLength(1);expect(saved.lastContactedAt).not.toBeNull();
  const task=saved.tasks[0];await command({action:'rescheduleTask',leadId,taskId:task.id,revision:task.revision,snoozeDays:1},ctx);
  await expect(command({action:'completeTask',leadId,taskId:task.id,revision:task.revision},ctx)).rejects.toMatchObject({status:409});
  await expect(command({...input,requestKey:crypto.randomUUID(),localDueAt:'bad date',dueAt:undefined},ctx)).rejects.toMatchObject({status:400});expect(await db.interaction.count({where:{leadId}})).toBe(1);
 });
});
