import type { GeneratedValue } from "../shared/types";

const HISTORY_KEY = "test-data-history";
const HISTORY_LIMIT = 20;

export async function loadHistory(): Promise<GeneratedValue[]> {
  const result = await chrome.storage.local.get(HISTORY_KEY);
  return Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] as GeneratedValue[] : [];
}

export async function saveHistory(value: GeneratedValue): Promise<GeneratedValue[]> {
  const history = [value, ...(await loadHistory())].slice(0, HISTORY_LIMIT);
  await chrome.storage.local.set({ [HISTORY_KEY]: history });
  return history;
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(HISTORY_KEY);
}
