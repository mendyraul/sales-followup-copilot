export const normalizedEmail=(value:string|null|undefined)=>value?.trim().toLowerCase()||null;
export function normalizedPhone(value:string|null|undefined){const phone=value?.replace(/[\s().-]/g,'');return phone&&/^\+[1-9]\d{6,14}$/.test(phone)?phone:null;}
export function csvCell(value:unknown){let s=String(value??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
