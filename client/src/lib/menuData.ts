export type MenuRow = {
  id: string;
  category: string;
  dish: string;
  price: number;
  sortOrder: number;
  onDemand: boolean;
};

type MenuSource = "sheet" | "fallback";

type LoadMenuResult = {
  rows: MenuRow[];
  source: MenuSource;
  warning?: string;
};

type RawMenuRow = {
  category: string;
  dish: string;
  price: number;
  sortOrder: number;
  onDemand: boolean;
};

const FULL_FALLBACK_PATH = "/data/full-menu-fallback.json";
const DAILY_FALLBACK_PATH = "/data/daily-menu-fallback.json";
const DEFAULT_DAILY_MENU_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRy2FMbCjSFhv0TV1ReNnoEwOi3U0VudWfah_XfQUy1VIqzZEQv_Jnn9iDlU7Xpm6vqp98STUrZR92E/pub?gid=0&single=true&output=csv";
const DAILY_MENU_CACHE_KEY = "eat_with_maddie:last_synced_daily_menu:v1";

const normalizeHeader = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "_");

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parsePrice = (value: string): number | null => {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseSortOrder = (value: string, fallback: number): number => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

const normalizeRows = (rows: RawMenuRow[]): MenuRow[] =>
  rows
    .filter((row) => row.category && row.dish && Number.isFinite(row.price))
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.dish.localeCompare(b.dish);
    })
    .map((row, index) => ({
      id: `item-${index + 1}`,
      ...row,
    }));

const parseCsvToRows = (
  csv: string,
  defaultOnDemand: boolean,
  defaultCategory?: string,
): RawMenuRow[] => {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const headerIndex = (name: string) => headers.findIndex((header) => header === name);

  const categoryIndex = headerIndex("category");
  const dishIndex = headerIndex("dish");
  const priceIndex = headerIndex("price");
  const sortOrderIndex = headerIndex("sort_order");
  const onDemandIndex = headerIndex("on_demand");

  if (dishIndex === -1 || priceIndex === -1) {
    throw new Error("Missing required CSV headers: dish, price");
  }

  if (categoryIndex === -1 && !defaultCategory) {
    throw new Error("Missing required CSV header: category");
  }

  const rows: RawMenuRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const category =
      categoryIndex >= 0
        ? values[categoryIndex]?.trim() ?? ""
        : defaultCategory ?? "";
    const dish = values[dishIndex]?.trim() ?? "";
    const priceValue = values[priceIndex]?.trim() ?? "";
    const parsedPrice = parsePrice(priceValue);

    if (!category || !dish || parsedPrice === null) continue;

    const sortOrder =
      sortOrderIndex >= 0
        ? parseSortOrder(values[sortOrderIndex] ?? "", i)
        : i;

    const onDemand =
      onDemandIndex >= 0
        ? parseBoolean(values[onDemandIndex] ?? "")
        : defaultOnDemand;

    rows.push({
      category,
      dish,
      price: parsedPrice,
      sortOrder,
      onDemand,
    });
  }

  return rows;
};

const fetchCsvRows = async (
  url: string,
  defaultOnDemand: boolean,
  defaultCategory?: string,
): Promise<RawMenuRow[]> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV (${response.status})`);
  }
  const csv = await response.text();
  return parseCsvToRows(csv, defaultOnDemand, defaultCategory);
};

const fetchFallbackRows = async (path: string): Promise<RawMenuRow[]> => {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch fallback JSON (${response.status})`);
  }

  const payload = (await response.json()) as Array<Partial<RawMenuRow>>;
  return payload.map((row, index) => ({
    category: String(row.category ?? "").trim(),
    dish: String(row.dish ?? "").trim(),
    price: Number(row.price ?? NaN),
    sortOrder: Number.isFinite(Number(row.sortOrder)) ? Number(row.sortOrder) : index + 1,
    onDemand: Boolean(row.onDemand),
  }));
};

const loadMenuRows = async (
  csvUrl: string | undefined,
  fallbackPath: string,
  defaultOnDemand: boolean,
  defaultCategory?: string,
): Promise<LoadMenuResult> => {
  const trimmedUrl = csvUrl?.trim();

  if (trimmedUrl) {
    try {
      const rows = normalizeRows(await fetchCsvRows(trimmedUrl, defaultOnDemand, defaultCategory));
      if (rows.length > 0) {
        return { rows, source: "sheet" };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const fallbackRows = normalizeRows(await fetchFallbackRows(fallbackPath));
      return {
        rows: fallbackRows,
        source: "fallback",
        warning: `Using fallback data because sheet fetch failed: ${message}`,
      };
    }
  }

  const fallbackRows = normalizeRows(await fetchFallbackRows(fallbackPath));
  return { rows: fallbackRows, source: "fallback" };
};

const writeDailyMenuCache = (rows: MenuRow[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DAILY_MENU_CACHE_KEY, JSON.stringify(rows));
  } catch {
    // Ignore storage failures and keep runtime behavior stable.
  }
};

const readDailyMenuCache = (): MenuRow[] => {
  if (typeof window === "undefined") return [];
  try {
    const payload = window.localStorage.getItem(DAILY_MENU_CACHE_KEY);
    if (!payload) return [];

    const parsed = JSON.parse(payload) as unknown;
    if (!Array.isArray(parsed)) return [];

    const rows = parsed
      .map((entry, index) => {
        if (typeof entry !== "object" || entry === null) return null;
        const row = entry as Partial<MenuRow>;
        const price = Number(row.price);
        const sortOrder = Number(row.sortOrder);

        return {
          id: typeof row.id === "string" && row.id.trim() ? row.id : `item-${index + 1}`,
          category: typeof row.category === "string" ? row.category : "",
          dish: typeof row.dish === "string" ? row.dish : "",
          price,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : index + 1,
          onDemand: Boolean(row.onDemand),
        } satisfies MenuRow;
      })
      .filter((row): row is MenuRow => Boolean(row && row.category && row.dish && Number.isFinite(row.price)));

    return rows;
  } catch {
    return [];
  }
};

export const loadDailyMenuRows = async (): Promise<LoadMenuResult> => {
  const csvUrl =
    ((import.meta.env.VITE_DAILY_MENU_CSV_URL as string | undefined) || DEFAULT_DAILY_MENU_CSV_URL).trim();

  if (csvUrl) {
    try {
      const rows = normalizeRows(await fetchCsvRows(csvUrl, false, "Today"));
      if (rows.length > 0) {
        writeDailyMenuCache(rows);
        return { rows, source: "sheet" };
      }
    } catch {
      // Fall through to last synced cache.
    }
  }

  const cachedRows = readDailyMenuCache();
  if (cachedRows.length > 0) {
    return { rows: cachedRows, source: "sheet" };
  }

  try {
    const fallbackRows = normalizeRows(await fetchFallbackRows(DAILY_FALLBACK_PATH));
    if (fallbackRows.length > 0) {
      return { rows: fallbackRows, source: "fallback" };
    }
  } catch {
    // Ignore local fallback read failures and return an empty menu.
  }

  return { rows: [], source: "sheet" };
};

export const loadFullMenuRows = async () =>
  loadMenuRows(
    undefined,
    FULL_FALLBACK_PATH,
    true,
  );
