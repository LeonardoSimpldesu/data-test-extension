import type { GeneratorId } from "../shared/types";

export interface Preferences {
  masked: boolean;
  cardBrand: "visa" | "mastercard" | "amex" | "elo";
  passwordLength: number;
  textLength: number;
  batchSize: number;
  favorites: GeneratorId[];
}

export const defaultPreferences: Preferences = {
  masked: true,
  cardBrand: "visa",
  passwordLength: 12,
  textLength: 6,
  batchSize: 10,
  favorites: []
};

const PREFERENCES_KEY = "test-data-preferences";

export async function loadPreferences(): Promise<Preferences> {
  const result = await chrome.storage.local.get(PREFERENCES_KEY);
  const saved = result[PREFERENCES_KEY];
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return defaultPreferences;
  const values = saved as Record<string, unknown>;
  return {
    ...defaultPreferences,
    masked: typeof values.masked === "boolean" ? values.masked : defaultPreferences.masked,
    cardBrand: isCardBrand(values.cardBrand) ? values.cardBrand : defaultPreferences.cardBrand,
    passwordLength: clampNumber(values.passwordLength, 4, 64, defaultPreferences.passwordLength),
    textLength: clampNumber(values.textLength, 1, 32, defaultPreferences.textLength),
    batchSize: clampNumber(values.batchSize, 2, 100, defaultPreferences.batchSize),
    favorites: Array.isArray(values.favorites)
      ? values.favorites.filter((id): id is GeneratorId => typeof id === "string")
      : defaultPreferences.favorites
  };
}

export function savePreferences(preferences: Preferences): Promise<void> {
  return chrome.storage.local.set({ [PREFERENCES_KEY]: preferences });
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function isCardBrand(value: unknown): value is Preferences["cardBrand"] {
  return value === "visa" || value === "mastercard" || value === "amex" || value === "elo";
}
