import {describe,expect,it,vi} from 'vitest';
import {parseGmailMessage} from '../domain/gmail';
import {seal,unseal} from '../server/secrets';
describe('Gmail content and credential boundaries',()=>{
 it('extracts plain text without importing attachments and recognizes sent messages',()=>{const m=parseGmailMessage({id:'a1',internalDate:'1000',labelIds:['SENT'],payload:{mimeType:'multipart/mixed',headers:[{name:'Subject',value:'Proposal'}],parts:[{mimeType:'text/plain',body:{data:Buffer.from('Hello').toString('base64url')}},{filename:'private.txt',mimeType:'text/plain',body:{data:Buffer.from('Attachment secret').toString('base64url')}}]}});expect(m.text).toBe('Hello');expect(m.direction).toBe('OUTBOUND');expect(m.automatic).toBe(false);});
 it('marks automatic responses and authenticates encrypted credentials to their workspace',()=>{expect(parseGmailMessage({id:'a2',internalDate:'1000',payload:{headers:[{name:'Auto-Submitted',value:'auto-replied'}]}}).automatic).toBe(true);vi.stubEnv('TOKEN_ENCRYPTION_KEY','a'.repeat(64));const token=seal('private-refresh-token','workspace:A');expect(token).not.toContain('private-refresh-token');expect(unseal(token,'workspace:A')).toBe('private-refresh-token');expect(()=>unseal(token,'workspace:B')).toThrow();vi.unstubAllEnvs();});
});
