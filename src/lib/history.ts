import type { Report } from "@/types";

const KEY = "cwv-checker:history";
const MAX_ITEMS = 15;

export function loadHistory(): Report[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((r: Report) => r?.version === 1) : [];
  } catch {
    return [];
  }
}

function persist(list: Report[]): void {
  // If storage is full, drop the oldest reports until it fits.
  let items = list;
  while (items.length > 0) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      return;
    } catch {
      items = items.slice(0, -1);
    }
  }
}

export function saveReport(report: Report): Report[] {
  const list = [report, ...loadHistory()].slice(0, MAX_ITEMS);
  persist(list);
  return list;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}

export function readPreference<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const value = localStorage.getItem(`cwv-checker:${key}`);
    return allowed.includes(value as T) ? (value as T) : null;
  } catch {
    return null;
  }
}

export function writePreference(key: string, value: string): void {
  try {
    localStorage.setItem(`cwv-checker:${key}`, value);
  } catch {
    /* storage unavailable */
  }
}
