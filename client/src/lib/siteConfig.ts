export type Language = "en" | "fr";
export type LocalizedText = Record<Language, string>;

export type DeliveryZone = {
  id: string;
  fee: number;
  name: LocalizedText;
};

const LANGUAGE_STORAGE_KEY = "eat_with_maddie_language";

export const WHATSAPP_NUMBER = "237679719340";
export const PHONE_NUMBER_DISPLAY = "+237 679 719 340";
export const PHONE_NUMBER_LINK = "tel:+237679719340";

export const INSTAGRAM_HANDLE = "madii_dove";
export const INSTAGRAM_URL = "https://instagram.com/madii_dove";
export const SNAPCHAT_HANDLE = "maddiebelle1493";
export const SNAPCHAT_URL = "https://www.snapchat.com/add/maddiebelle1493";

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: "akwa", fee: 1000, name: { en: "Akwa", fr: "Akwa" } },
  { id: "deido", fee: 1000, name: { en: "Deido", fr: "Deido" } },
  { id: "bonamoussadi", fee: 1000, name: { en: "Bonamoussadi", fr: "Bonamoussadi" } },
  { id: "logpom", fee: 1000, name: { en: "Logpom", fr: "Logpom" } },
  { id: "logbessou", fee: 1000, name: { en: "Logbessou", fr: "Logbessou" } },
  { id: "bonaberi", fee: 1500, name: { en: "Bonaberi", fr: "Bonaberi" } },
  { id: "bonanjo", fee: 1500, name: { en: "Bonanjo", fr: "Bonanjo" } },
  { id: "bonapriso", fee: 1500, name: { en: "Bonapriso", fr: "Bonapriso" } },
];

export const formatFcfa = (value: number) =>
  `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;

const normalizeLanguage = (value: string | null | undefined): Language | null => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("en")) return "en";
  return null;
};

export const getInitialLanguage = (): Language => {
  if (typeof window !== "undefined") {
    const stored = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    if (stored) return stored;
  }

  if (typeof navigator !== "undefined") {
    for (const candidate of navigator.languages ?? []) {
      const parsed = normalizeLanguage(candidate);
      if (parsed) return parsed;
    }
    const parsed = normalizeLanguage(navigator.language);
    if (parsed) return parsed;
  }

  return "en";
};

export const persistLanguage = (language: Language) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
};
