import { Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { loadFullMenuRows, type MenuRow } from "@/lib/menuData";
import {
  DELIVERY_ZONES,
  formatFcfa,
  getInitialLanguage,
  type Language,
  persistLanguage,
  PHONE_NUMBER_DISPLAY,
  PHONE_NUMBER_LINK,
  WHATSAPP_NUMBER,
} from "@/lib/siteConfig";

type Copy = {
  title: string;
  subtitle: string;
  onCommand: string;
  allCategories: string;
  itemCount: string;
  loading: string;
  empty: string;
  warningPrefix: string;
  orderTitle: string;
  orderSubtitle: string;
  nameLabel: string;
  phoneLabel: string;
  addressLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  zoneLabel: string;
  summaryTitle: string;
  summaryHint: string;
  selectedCount: string;
  deliveryFee: string;
  sendOrder: string;
  backToHome: string;
  pricesNote: string;
};

const copy: Record<Language, Copy> = {
  en: {
    title: "Full Menu",
    subtitle: "These items are only available on command.",
    onCommand: "Only available on command",
    allCategories: "All Categories",
    itemCount: "items",
    loading: "Loading full menu...",
    empty: "Full menu is currently unavailable.",
    warningPrefix: "Using fallback menu:",
    orderTitle: "Finalize Full Menu Order",
    orderSubtitle: "Select items, add your details, then send your order on WhatsApp.",
    nameLabel: "Your name",
    phoneLabel: "Phone number",
    addressLabel: "Delivery address",
    noteLabel: "Special instructions",
    notePlaceholder: "Spice level, no onions, gate code, quantity for events...",
    zoneLabel: "Delivery zone",
    summaryTitle: "Selected Items",
    summaryHint: "On-command items are priced slightly higher than the daily menu.",
    selectedCount: "Selected dishes",
    deliveryFee: "Delivery fee",
    sendOrder: "Send Full Menu Order on WhatsApp",
    backToHome: "Back to Daily Menu",
    pricesNote: "These prices apply to on-command preparation.",
  },
  fr: {
    title: "Menu complet",
    subtitle: "Ces plats sont disponibles uniquement sur commande.",
    onCommand: "Disponible uniquement sur commande",
    allCategories: "Toutes les catégories",
    itemCount: "articles",
    loading: "Chargement du menu complet...",
    empty: "Le menu complet est indisponible pour le moment.",
    warningPrefix: "Utilisation du menu de secours :",
    orderTitle: "Finaliser la commande menu complet",
    orderSubtitle: "Sélectionnez vos plats, ajoutez vos informations, puis envoyez votre commande sur WhatsApp.",
    nameLabel: "Votre nom",
    phoneLabel: "Numéro de téléphone",
    addressLabel: "Adresse de livraison",
    noteLabel: "Instructions spéciales",
    notePlaceholder: "Niveau de piment, sans oignons, code du portail, quantité pour un événement...",
    zoneLabel: "Zone de livraison",
    summaryTitle: "Articles sélectionnés",
    summaryHint: "Les plats sur commande sont légèrement plus chers que le menu du jour.",
    selectedCount: "Plats sélectionnés",
    deliveryFee: "Frais de livraison",
    sendOrder: "Envoyer la commande menu complet sur WhatsApp",
    backToHome: "Retour au menu du jour",
    pricesNote: "Ces prix s'appliquent aux préparations sur commande.",
  },
};

const toneClasses = [
  "from-[#f4bd2f] to-[#ffe7a9] border-[#e8b128]",
  "from-[#2f120f] to-[#7a1712] border-[#f0a81e]",
  "from-[#5c0808] to-[#d46f1f] border-[#f0a81e]",
  "from-[#4b0508] to-[#8f1010] border-[#f0a81e]",
  "from-[#f2d9b0] to-[#f2a348] border-[#c95e18]",
  "from-[#4a0000] to-[#8b0909] border-[#d9b36e]",
  "from-[#f9cf1b] to-[#f4aa18] border-[#f0d66a]",
];

function FullMenu() {
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage());
  const [menuRows, setMenuRows] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openValues, setOpenValues] = useState<string[]>([]);
  const [singleOpenValue, setSingleOpenValue] = useState<string>("");
  const [selectedZoneId, setSelectedZoneId] = useState(DELIVERY_ZONES[0].id);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});

  const t = copy[language];

  const chooseLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    persistLanguage(nextLanguage);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const result = await loadFullMenuRows();
        if (cancelled) return;
        setMenuRows(result.rows);
        setLoadWarning(result.warning ?? null);
      } catch (error) {
        if (cancelled) return;
        setMenuRows([]);
        setLoadWarning(error instanceof Error ? error.message : "Failed to load full menu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const row of menuRows) {
      if (!seen.has(row.category)) {
        seen.add(row.category);
        ordered.push(row.category);
      }
    }
    return ordered;
  }, [menuRows]);

  useEffect(() => {
    if (activeCategory === "all") return;
    if (!categories.includes(activeCategory)) setActiveCategory("all");
  }, [activeCategory, categories]);

  const selectedZone = useMemo(
    () => DELIVERY_ZONES.find((zone) => zone.id === selectedZoneId) ?? DELIVERY_ZONES[0],
    [selectedZoneId],
  );

  const categoriesToRender = useMemo(
    () => (activeCategory === "all" ? categories : categories.filter((category) => category === activeCategory)),
    [activeCategory, categories],
  );

  const cartRows = useMemo(
    () =>
      menuRows
        .map((item) => ({ ...item, quantity: cart[item.id] ?? 0 }))
        .filter((item) => item.quantity > 0),
    [cart, menuRows],
  );

  const selectedDishCount = useMemo(
    () => cartRows.reduce((sum, item) => sum + item.quantity, 0),
    [cartRows],
  );

  const categoryIndex = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((category, index) => map.set(category, index));
    return map;
  }, [categories]);

  const updateItemQuantity = (itemId: string, delta: number) => {
    setCart((current) => {
      const nextValue = Math.max(0, (current[itemId] ?? 0) + delta);
      if (nextValue === 0) {
        const { [itemId]: _, ...rest } = current;
        return rest;
      }
      return { ...current, [itemId]: nextValue };
    });
  };

  const getWhatsAppMessage = () => {
    const unknown = language === "fr" ? "Non renseigne" : "Not provided";
    const lineItems = cartRows.map(
      (item) => `- ${item.quantity} x ${item.dish} (${formatFcfa(item.price)})`,
    );

    return [
      language === "fr" ? "Commande menu complet - Eat With Maddie" : "Full Menu Order - Eat With Maddie",
      language === "fr" ? "(Articles sur commande)" : "(Items available on command)",
      "",
      language === "fr" ? "Articles selectionnes:" : "Selected items:",
      ...(lineItems.length > 0 ? lineItems : ["-"]),
      "",
      `${t.selectedCount}: ${selectedDishCount}`,
      `${t.deliveryFee}: ${formatFcfa(selectedZone.fee)}`,
      `${t.zoneLabel}: ${selectedZone.name[language]}`,
      "",
      `${t.nameLabel}: ${name.trim() || unknown}`,
      `${t.phoneLabel}: ${phone.trim() || unknown}`,
      `${t.addressLabel}: ${address.trim() || unknown}`,
      `${t.noteLabel}: ${notes.trim() || "-"}`,
    ].join("\n");
  };

  const sendOrderOnWhatsApp = () => {
    if (selectedDishCount === 0) return;
    const text = encodeURIComponent(getWhatsAppMessage());
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-foreground">
      <nav className="sticky top-0 z-50 border-b border-[var(--surface-line)] bg-[var(--surface-0)]/95 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <Link href="/">
            <a className="inline-flex items-center gap-2 rounded-full border border-[var(--surface-line)] px-3 py-2 text-sm font-medium text-[var(--brand-800)]">
              <ChevronLeft size={15} />
              {t.backToHome}
            </a>
          </Link>
          <a
            href={PHONE_NUMBER_LINK}
            className="hidden items-center gap-2 rounded-full border border-[var(--surface-line)] px-3 py-2 text-sm font-medium text-[var(--brand-800)] sm:flex"
          >
            {PHONE_NUMBER_DISPLAY}
          </a>
          <div className="inline-flex rounded-full border border-[var(--surface-line)] p-1">
            <button
              type="button"
              onClick={() => chooseLanguage("en")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                language === "en"
                  ? "bg-[var(--brand-700)] text-white"
                  : "text-[var(--ink-muted)] hover:text-[var(--brand-800)]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => chooseLanguage("fr")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                language === "fr"
                  ? "bg-[var(--brand-700)] text-white"
                  : "text-[var(--ink-muted)] hover:text-[var(--brand-800)]"
              }`}
            >
              FR
            </button>
          </div>
        </div>
      </nav>

      <main>
        <section className="border-b border-[var(--surface-line)] bg-[var(--surface-0)] py-14 md:py-20">
          <div className="container">
            <h1 className="text-center text-4xl text-[var(--brand-900)] md:text-5xl">{t.title}</h1>
            <p className="mx-auto mt-3 max-w-3xl text-center text-[var(--ink-muted)]">{t.subtitle}</p>
            <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-[var(--ink-muted)]">{t.pricesNote}</p>

            {loadWarning && (
              <p className="mx-auto mt-4 max-w-3xl rounded-xl border border-[var(--surface-line)] bg-[var(--surface-1)] px-4 py-2 text-center text-sm text-[var(--ink-muted)]">
                {t.warningPrefix} {loadWarning}
              </p>
            )}

            {loading ? (
              <p className="mt-10 text-center text-[var(--ink-muted)]">{t.loading}</p>
            ) : menuRows.length === 0 ? (
              <p className="mt-10 text-center text-[var(--ink-muted)]">{t.empty}</p>
            ) : (
              <>
                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory("all");
                      setOpenValues([]);
                      setSingleOpenValue("");
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      activeCategory === "all"
                        ? "bg-[var(--brand-700)] text-white"
                        : "border border-[var(--surface-line)] bg-white text-[var(--ink-muted)] hover:text-[var(--brand-900)]"
                    }`}
                  >
                    {t.allCategories}
                  </button>

                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(category);
                        setSingleOpenValue(category);
                        setOpenValues([]);
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                        activeCategory === category
                          ? "bg-[var(--brand-700)] text-white"
                          : "border border-[var(--surface-line)] bg-white text-[var(--ink-muted)] hover:text-[var(--brand-900)]"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="mt-8 rounded-2xl border border-[var(--surface-line)] bg-white p-4 md:p-6">
                  {activeCategory === "all" ? (
                    <Accordion type="multiple" value={openValues} onValueChange={setOpenValues} className="w-full">
                      {categoriesToRender.map((category) => {
                        const items = menuRows.filter((item) => item.category === category);
                        const toneClass = toneClasses[(categoryIndex.get(category) ?? 0) % toneClasses.length];

                        return (
                          <AccordionItem key={category} value={category} className="mb-3 rounded-xl border border-[var(--surface-line)] px-4">
                            <AccordionTrigger className="text-base hover:no-underline">
                              <div className="flex min-w-0 flex-wrap items-center gap-2 pr-4">
                                <span className={`basis-full rounded-2xl border bg-gradient-to-r px-3.5 py-2 text-left text-base leading-snug font-semibold text-white sm:basis-auto sm:text-[1.05rem] ${toneClass}`}>
                                  {category}
                                </span>
                                <span className="text-sm font-medium text-[var(--ink-muted)] sm:text-[0.95rem]">
                                  {items.length} {t.itemCount}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid gap-3 md:grid-cols-2">
                                {items.map((item) => {
                                  const qty = cart[item.id] ?? 0;
                                  return (
                                    <article key={item.id} className="rounded-xl border border-[var(--surface-line)] bg-[var(--surface-0)] p-3">
                                      <p className="text-sm leading-relaxed text-[var(--brand-900)]">{item.dish}</p>
                                      <p className="mt-1 text-sm font-semibold text-[var(--accent-900)]">{formatFcfa(item.price)}</p>
                                      <p className="mt-1 text-xs text-[var(--ink-muted)]">{t.onCommand}</p>
                                      <div className="mt-3 flex justify-end">
                                        <div className="flex items-center gap-1 rounded-full border border-[var(--surface-line)] bg-white p-1">
                                          <button
                                            type="button"
                                            onClick={() => updateItemQuantity(item.id, -1)}
                                            className="rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-1)]"
                                            aria-label="Decrease quantity"
                                          >
                                            <Minus size={14} />
                                          </button>
                                          <span className="w-6 text-center text-sm font-semibold text-[var(--brand-900)]">{qty}</span>
                                          <button
                                            type="button"
                                            onClick={() => updateItemQuantity(item.id, 1)}
                                            className="rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-1)]"
                                            aria-label="Increase quantity"
                                          >
                                            <Plus size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  ) : (
                    <Accordion
                      type="single"
                      collapsible
                      value={singleOpenValue}
                      onValueChange={setSingleOpenValue}
                      className="w-full"
                    >
                      {categoriesToRender.map((category) => {
                        const items = menuRows.filter((item) => item.category === category);
                        const toneClass = toneClasses[(categoryIndex.get(category) ?? 0) % toneClasses.length];

                        return (
                          <AccordionItem key={category} value={category} className="mb-3 rounded-xl border border-[var(--surface-line)] px-4">
                            <AccordionTrigger className="text-base hover:no-underline">
                              <div className="flex min-w-0 flex-wrap items-center gap-2 pr-4">
                                <span className={`basis-full rounded-2xl border bg-gradient-to-r px-3.5 py-2 text-left text-base leading-snug font-semibold text-white sm:basis-auto sm:text-[1.05rem] ${toneClass}`}>
                                  {category}
                                </span>
                                <span className="text-sm font-medium text-[var(--ink-muted)] sm:text-[0.95rem]">
                                  {items.length} {t.itemCount}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid gap-3 md:grid-cols-2">
                                {items.map((item) => {
                                  const qty = cart[item.id] ?? 0;
                                  return (
                                    <article key={item.id} className="rounded-xl border border-[var(--surface-line)] bg-[var(--surface-0)] p-3">
                                      <p className="text-sm leading-relaxed text-[var(--brand-900)]">{item.dish}</p>
                                      <p className="mt-1 text-sm font-semibold text-[var(--accent-900)]">{formatFcfa(item.price)}</p>
                                      <p className="mt-1 text-xs text-[var(--ink-muted)]">{t.onCommand}</p>
                                      <div className="mt-3 flex justify-end">
                                        <div className="flex items-center gap-1 rounded-full border border-[var(--surface-line)] bg-white p-1">
                                          <button
                                            type="button"
                                            onClick={() => updateItemQuantity(item.id, -1)}
                                            className="rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-1)]"
                                            aria-label="Decrease quantity"
                                          >
                                            <Minus size={14} />
                                          </button>
                                          <span className="w-6 text-center text-sm font-semibold text-[var(--brand-900)]">{qty}</span>
                                          <button
                                            type="button"
                                            onClick={() => updateItemQuantity(item.id, 1)}
                                            className="rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-1)]"
                                            aria-label="Increase quantity"
                                          >
                                            <Plus size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="border-b border-[var(--surface-line)] bg-[var(--surface-0)] py-14 md:py-20">
          <div className="container grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-[var(--surface-line)] bg-white p-6 md:p-8">
              <h2 className="text-3xl text-[var(--brand-900)] md:text-4xl">{t.orderTitle}</h2>
              <p className="mt-2 text-[var(--ink-muted)]">{t.orderSubtitle}</p>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--brand-900)]">{t.zoneLabel}</span>
                  <select
                    value={selectedZoneId}
                    onChange={(event) => setSelectedZoneId(event.target.value)}
                    className="w-full rounded-xl border border-[var(--surface-line)] bg-white px-4 py-3 text-sm outline-none ring-offset-2 transition focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                  >
                    {DELIVERY_ZONES.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name[language]} - {formatFcfa(zone.fee)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--brand-900)]">{t.nameLabel}</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-[var(--surface-line)] px-4 py-3 text-sm outline-none ring-offset-2 transition focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--brand-900)]">{t.phoneLabel}</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-xl border border-[var(--surface-line)] px-4 py-3 text-sm outline-none ring-offset-2 transition focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--brand-900)]">{t.addressLabel}</span>
                  <input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="w-full rounded-xl border border-[var(--surface-line)] px-4 py-3 text-sm outline-none ring-offset-2 transition focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--brand-900)]">{t.noteLabel}</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder={t.notePlaceholder}
                    rows={4}
                    className="w-full rounded-xl border border-[var(--surface-line)] px-4 py-3 text-sm outline-none ring-offset-2 transition focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
                  />
                </label>
              </div>
            </div>

            <aside className="rounded-2xl border border-[var(--surface-line)] bg-[var(--surface-1)] p-6 md:p-8 lg:sticky lg:top-24 lg:h-fit">
              <h3 className="text-2xl text-[var(--brand-900)]">{t.summaryTitle}</h3>
              <div className="mt-5 space-y-3">
                {cartRows.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--surface-line)] bg-white p-4 text-sm text-[var(--ink-muted)]">
                    {t.empty}
                  </p>
                ) : (
                  cartRows.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--surface-line)] bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-[var(--brand-900)]">{item.quantity} x {item.dish}</p>
                        <p className="text-xs text-[var(--ink-muted)]">{formatFcfa(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, -1)}
                          className="rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-1)]"
                        >
                          <Minus size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, 1)}
                          className="rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-1)]"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 space-y-2 text-sm text-[var(--ink-muted)]">
                <div className="flex items-center justify-between rounded-xl border border-[var(--surface-line)] bg-white px-4 py-3">
                  <span className="inline-flex items-center gap-2"><ShoppingBag size={14} /> {t.selectedCount}</span>
                  <span className="font-semibold text-[var(--brand-900)]">{selectedDishCount}</span>
                </div>
                <div className="flex justify-between rounded-xl border border-[var(--surface-line)] bg-white px-4 py-3">
                  <span>{t.deliveryFee}</span>
                  <span className="font-semibold text-[var(--brand-900)]">{formatFcfa(selectedZone.fee)}</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-[var(--ink-muted)]">{t.summaryHint}</p>

              <Button
                type="button"
                onClick={sendOrderOnWhatsApp}
                disabled={selectedDishCount === 0}
                className="mt-6 w-full rounded-full bg-[var(--brand-700)] py-6 text-base text-white hover:bg-[var(--brand-900)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <MessageCircle className="mr-2" size={18} />
                {t.sendOrder}
              </Button>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

export default FullMenu;
