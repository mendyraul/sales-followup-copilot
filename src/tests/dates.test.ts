import { describe,expect,it } from 'vitest';
import { localDueAt,dayWindow,snoozedDueAt } from '../domain/dates';
describe('workspace task dates',()=>{
 it('rejects ambiguous and nonexistent local times',()=>{expect(()=>localDueAt('2026-03-08T02:30','America/New_York')).toThrow();expect(()=>localDueAt('2026-11-01T01:30','America/New_York')).toThrow();});
 it('uses local calendar days over daylight saving transitions',()=>{const range=dayWindow('America/New_York',new Date('2026-03-08T16:00:00Z'));expect((range.end.getTime()-range.start.getTime())/3600000).toBe(23);expect(snoozedDueAt(1,'America/New_York',new Date('2026-03-07T18:00:00Z')).toISOString()).toBe('2026-03-08T13:00:00.000Z');});
});
