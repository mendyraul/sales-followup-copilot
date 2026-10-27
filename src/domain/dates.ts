import { Temporal } from '@js-temporal/polyfill';
export function validTimezone(zone: string) { try { Temporal.Now.zonedDateTimeISO(zone); return true; } catch { return false; } }
export function localDueAt(value: string, zone: string): Date {
  const plain=Temporal.PlainDateTime.from(value);
  return new Date(plain.toZonedDateTime(zone,{disambiguation:'reject'}).toInstant().epochMilliseconds);
}
export function dayWindow(zone:string, now=new Date()) {
  const day=Temporal.Instant.from(now.toISOString()).toZonedDateTimeISO(zone).startOfDay();
  return {start:new Date(day.toInstant().epochMilliseconds),end:new Date(day.add({days:1}).toInstant().epochMilliseconds)};
}
export function snoozedDueAt(days:number,zone:string,now=new Date()) { return new Date(Temporal.Instant.from(now.toISOString()).toZonedDateTimeISO(zone).add({days}).with({hour:9,minute:0,second:0,millisecond:0}).toInstant().epochMilliseconds); }
