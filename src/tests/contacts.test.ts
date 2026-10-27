import {describe,expect,it} from 'vitest';
import {csvCell,normalizedPhone,normalizedEmail} from '../domain/contacts';
describe('portable contact identity and CSV output',()=>{
 it('normalizes only unambiguous contact identifiers',()=>{expect(normalizedEmail(' A@EXAMPLE.COM ')).toBe('a@example.com');expect(normalizedPhone('+1 (202) 555-0123')).toBe('+12025550123');expect(normalizedPhone('202-555-0123')).toBeNull();});
 it('quotes CSV and prevents spreadsheet formula execution',()=>{expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');expect(csvCell('Pat, Jr.')).toBe('"Pat, Jr."');});
});
