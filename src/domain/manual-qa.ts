import { type ManualQaChecklistItem } from '../data/demoManualQaChecklist';

export function summarizeManualQaChecklist(items: ManualQaChecklistItem[]) {
  const readyItems = items.filter((item) => item.status === 'ready').length;
  const watchItems = items.filter((item) => item.status === 'watch').length;

  return {
    totalItems: items.length,
    readyItems,
    watchItems,
    areas: Array.from(new Set(items.map((item) => item.area))),
  };
}
