import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { type CarouselApi, Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ChefHat, MapPin, MessageCircle, Minus, Phone, Plus, ShoppingBag } from "lucide-react";
import { loadDailyMenuRows, type MenuRow } from "@/lib/menuData";
import {
  DELIVERY_ZONES,
  formatFcfa,
  getInitialLanguage,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  persistLanguage,
  type Language,
  PHONE_NUMBER_DISPLAY,
  PHONE_NUMBER_LINK,
  SNAPCHAT_HANDLE,
  SNAPCHAT_URL,
  WHATSAPP_NUMBER,
} from "@/lib/siteConfig";
import instagramIcon from "../../../assets/Icons/Instagram.svg";
import snapchatIcon from "../../../assets/Icons/Snapchat.svg";

const copy = {
  en: {
    heroSubtitle: "Fresh Meals, Instant deliveries",
    orderNow: "Message on WhatsApp",
    menuTitle: "Today's Menu",
    menuSubtitle: "Choose from today's available dishes.",
    loading: "Loading today's menu...",
    emptyMenu: "Today's menu is currently unavailable.",
    fullMenuCta: "View Full Menu",
    fullMenuHint: "Need something else? Browse the on-command full menu.",
    drinksTitle: "Drinks",
    drinksSubtitle: "Bottled water, alcoholic drinks, and beverages.",
    drinksHint: "Tell us exactly what you want under Special instructions below.",
    zoneLabel: "Delivery zone",
    nameLabel: "Your name",
    phoneLabel: "Phone number",
    addressLabel: "Delivery address",
    noteLabel: "Special instructions",
    notePlaceholder: "Spice level, no onions, gate code, quantity for events...",
    summaryTitle: "Selected Items",
    selectedCount: "Selected dishes",
    deliveryFee: "Delivery fee",
    emptyCart: "No dishes selected yet.",
    sendOrder: "Send Full Order on WhatsApp",
    location: "Douala, Cameroon",
  },
  fr: {
    heroSubtitle: "Repas frais, Livraisons instantanées",
    orderNow: "Commander sur WhatsApp",
    menuTitle: "Menu du jour",
    menuSubtitle: "Choisissez parmi les plats disponibles aujourd'hui.",
    loading: "Chargement du menu du jour...",
    emptyMenu: "Le menu du jour est indisponible pour le moment.",
    fullMenuCta: "Voir le menu complet",
    fullMenuHint: "Besoin d'autre chose ? Consultez le menu complet sur commande.",
    drinksTitle: "Boissons",
    drinksSubtitle: "Eau en bouteille, boissons alcoolisées et boissons variées.",
    drinksHint: "Précisez exactement ce que vous voulez dans Instructions spéciales ci-dessous.",
    zoneLabel: "Zone de livraison",
    nameLabel: "Votre nom",
    phoneLabel: "Numéro de téléphone",
    addressLabel: "Adresse de livraison",
    noteLabel: "Instructions spéciales",
    notePlaceholder: "Niveau de piment, sans oignons, code du portail, quantité pour un événement...",
    summaryTitle: "Articles sélectionnés",
    selectedCount: "Plats sélectionnés",
    deliveryFee: "Frais de livraison",
    emptyCart: "Aucun plat sélectionné pour le moment.",
    sendOrder: "Envoyer la commande complète sur WhatsApp",
    location: "Douala, Cameroun",
  },
} as const;

const STATIC_DRINKS: Array<{ id: string; dish: Record<Language, string>; price: number }> = [
  {
    id: "drink-bottled-water",
    dish: { en: "Bottled water", fr: "Eau en bouteille" },
    price: 500,
  },
  {
    id: "drink-alcoholic-drinks",
    dish: { en: "Alcoholic drinks", fr: "Boissons alcoolisées" },
    price: 2500,
  },
  {
    id: "drink-beverages",
    dish: { en: "Beverages", fr: "Beverages" },
    price: 1500,
  },
];

const HERO_CAROUSEL_IMAGES = [
  {
    src360: "/images/carousel/meal-1-360x240.webp",
    src600: "/images/carousel/meal-1-600x400.webp",
    alt: "Meal preview 1",
  },
  {
    src360: "/images/carousel/meal-2-360x240.webp",
    src600: "/images/carousel/meal-2-600x400.webp",
    alt: "Meal preview 2",
  },
  {
    src360: "/images/carousel/meal-3-360x240.webp",
    src600: "/images/carousel/meal-3-600x400.webp",
    alt: "Meal preview 3",
  },
  {
    src360: "/images/carousel/meal-4-360x240.webp",
    src600: "/images/carousel/meal-4-600x400.webp",
    alt: "Meal preview 4",
  },
  {
    src360: "/images/carousel/meal-5-360x240.webp",
    src600: "/images/carousel/meal-5-600x400.webp",
    alt: "Meal preview 5",
  },
];

const isDrinkRow = (row: MenuRow) => {
  const category = row.category.toLowerCase();
  const dish = row.dish.toLowerCase();
  return (
    category.includes("drink") ||
    category.includes("boisson") ||
    category.includes("beverage") ||
    dish.includes("bottled water") ||
    dish.includes("alcoholic") ||
    dish.includes("beverage")
  );
};

function Home() {
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage());
  const [rows, setRows] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [selectedZoneId, setSelectedZoneId] = useState(DELIVERY_ZONES[0].id);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const t = copy[language];

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        const result = await loadDailyMenuRows();
        if (cancelled) return;
        setRows(result.rows);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!carouselApi) return;

    const timer = window.setInterval(() => {
      carouselApi.scrollNext();
    }, 3200);

    return () => {
      window.clearInterval(timer);
    };
  }, [carouselApi]);

  const dailyRows = useMemo(() => rows.filter((row) => !isDrinkRow(row)), [rows]);

  const drinkRows = useMemo<MenuRow[]>(
    () =>
      STATIC_DRINKS.map((item, index) => ({
        id: item.id,
        category: "Drinks",
        dish: item.dish[language],
        price: item.price,
        sortOrder: 10000 + index,
        onDemand: false,
      })),
    [language],
  );

  const selectableRows = useMemo(() => [...dailyRows, ...drinkRows], [dailyRows, drinkRows]);

  const selectedZone = useMemo(
    () => DELIVERY_ZONES.find((zone) => zone.id === selectedZoneId) ?? DELIVERY_ZONES[0],
    [selectedZoneId],
  );

  const cartRows = useMemo(
    () =>
      selectableRows
        .map((row) => ({ ...row, quantity: cart[row.id] ?? 0 }))
        .filter((row) => row.quantity > 0),
    [cart, selectableRows],
  );

  const selectedDishCount = useMemo(
    () => cartRows.reduce((sum, item) => sum + item.quantity, 0),
    [cartRows],
  );

  const chooseLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    persistLanguage(nextLanguage);
  };

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

  const sendOrderOnWhatsApp = () => {
    if (selectedDishCount === 0) return;

    const unknown = language === "fr" ? "Non renseigne" : "Not provided";
    const lines = cartRows.map((item) =>
      item.id.startsWith("drink-")
        ? `- ${item.quantity} x ${item.dish}`
        : `- ${item.quantity} x ${item.dish} (${formatFcfa(item.price)})`,
    );

    const text = encodeURIComponent(
      [
        language === "fr" ? "Nouvelle commande - Eat With Maddie" : "New Order - Eat With Maddie",
        "",
        ...(lines.length > 0 ? lines : ["-"]),
        "",
        `${t.selectedCount}: ${selectedDishCount}`,
        `${t.deliveryFee}: ${formatFcfa(selectedZone.fee)}`,
        `${t.zoneLabel}: ${selectedZone.name[language]}`,
        `${t.nameLabel}: ${name.trim() || unknown}`,
        `${t.phoneLabel}: ${phone.trim() || unknown}`,
        `${t.addressLabel}: ${address.trim() || unknown}`,
        `${t.noteLabel}: ${notes.trim() || "-"}`,
      ].join("\n"),
    );

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)] text-foreground">
      <nav className="sticky top-0 z-50 border-b border-[var(--surface-line)] bg-[var(--surface-0)]/95 backdrop-blur">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full border border-white/50 bg-[linear-gradient(135deg,#7b0606,#b21717)] text-white">
              <ChefHat size={18} />
            </div>
            <p className="font-semibold text-[var(--brand-900)]">Eat With Maddie</p>
          </div>

          <a
            href={PHONE_NUMBER_LINK}
            className="hidden items-center gap-2 rounded-full border border-[var(--surface-line)] px-3 py-2 text-sm text-[var(--brand-800)] sm:flex"
          >
            <Phone size={15} />
            {PHONE_NUMBER_DISPLAY}
          </a>

          <div className="inline-flex rounded-full border border-[var(--surface-line)] p-1">
            <button
              type="button"
              onClick={() => chooseLanguage("en")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                language === "en" ? "bg-[var(--brand-700)] text-white" : "text-[var(--ink-muted)]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => chooseLanguage("fr")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                language === "fr" ? "bg-[var(--brand-700)] text-white" : "text-[var(--ink-muted)]"
              }`}
            >
              FR
            </button>
          </div>
        </div>
      </nav>

      <main>
        <section className="border-b border-[var(--surface-line)] bg-[linear-gradient(120deg,#5f0b0d_0%,#8e1015_48%,#3a0405_100%)] text-white">
          <div className="container grid gap-8 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <h1 className="text-5xl font-semibold md:text-7xl">Eat With Maddie</h1>
              <p className="mt-4 max-w-xl text-base text-white/85 md:text-lg">{t.heroSubtitle}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={sendOrderOnWhatsApp}
                  className="rounded-full bg-[#f5b12d] px-6 py-6 text-base font-semibold text-[#4c0d0d] hover:bg-[#ffc95b]"
                >
                  <MessageCircle className="mr-2" size={18} />
                  {t.orderNow}
                </Button>
                <a href={PHONE_NUMBER_LINK}>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-white/35 bg-transparent px-6 py-6 text-base text-white hover:bg-white/10"
                  >
                    <Phone className="mr-2" size={18} />
                    {language === "fr" ? "Appeler" : "Call now"}
                  </Button>
                </a>
              </div>
              <div className="mt-6 space-y-2 text-sm text-white/90">
                <span className="flex items-center gap-2">
                  <MapPin size={15} />
                  {t.location}
                </span>
                <a
                  href={SNAPCHAT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <img src={snapchatIcon} alt="" aria-hidden="true" className="h-[15px] w-[15px] opacity-90" />
                  {SNAPCHAT_HANDLE}
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <img src={instagramIcon} alt="" aria-hidden="true" className="h-[15px] w-[15px] opacity-90" />
                  {INSTAGRAM_HANDLE}
                </a>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[340px] lg:mx-0 lg:justify-self-end">
              <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
                <CarouselContent className="-ml-0">
                  {HERO_CAROUSEL_IMAGES.map((image, index) => (
                    <CarouselItem key={image.src600} className="pl-0">
                      <div className="overflow-hidden rounded-[28%] border border-white/20 bg-white/10 shadow-lg shadow-black/30">
                        <img
                          src={image.src600}
                          srcSet={`${image.src360} 360w, ${image.src600} 600w`}
                          sizes="(max-width: 768px) 72vw, 340px"
                          alt={image.alt}
                          className="aspect-[3/2] w-full object-cover"
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding="async"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--surface-line)] bg-[var(--surface-0)] py-14 md:py-20">
          <div className="container">
            <h2 className="text-center text-4xl text-[var(--brand-900)] md:text-5xl">{t.menuTitle}</h2>
            <p className="mx-auto mt-3 max-w-3xl text-center text-[var(--ink-muted)]">{t.menuSubtitle}</p>

            {loading ? (
              <p className="mt-10 text-center text-[var(--ink-muted)]">{t.loading}</p>
            ) : (
              <div className="mt-8 rounded-2xl border border-[var(--surface-line)] bg-white p-4 md:p-6">
                {dailyRows.length === 0 ? (
                  <p className="text-center text-[var(--ink-muted)]">{t.emptyMenu}</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {dailyRows.map((item) => {
                      const qty = cart[item.id] ?? 0;
                      return (
                        <article
                          key={item.id}
                          className="rounded-xl border border-[var(--surface-line)] bg-[var(--surface-0)] p-3"
                        >
                          <p className="text-sm text-[var(--brand-900)]">{item.dish}</p>
                          <p className="mt-1 text-sm font-semibold text-[var(--accent-900)]">{formatFcfa(item.price)}</p>
                          <div className="mt-3 flex justify-end">
                            <div className="flex items-center gap-1 rounded-full border border-[var(--surface-line)] bg-white p-1">
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(item.id, -1)}
                                className="rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-1)]"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-6 text-center text-sm font-semibold text-[var(--brand-900)]">{qty}</span>
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(item.id, 1)}
                                className="rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-1)]"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}

                <Accordion type="single" collapsible className="mt-4 w-full">
                  <AccordionItem value="drinks" className="rounded-xl border border-[var(--surface-line)] px-4">
                    <AccordionTrigger className="text-base hover:no-underline">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 pr-4">
                        <span className="rounded-2xl border bg-gradient-to-r from-[#7a1712] to-[#d46f1f] px-3.5 py-2 text-left text-base font-semibold text-white">
                          {t.drinksTitle}
                        </span>
                        <span className="text-sm font-medium text-[var(--ink-muted)]">{t.drinksSubtitle}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-3 text-xs text-[var(--ink-muted)]">{t.drinksHint}</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {drinkRows.map((item) => {
                          const qty = cart[item.id] ?? 0;
                          return (
                            <article
                              key={item.id}
                              className="rounded-xl border border-[var(--surface-line)] bg-[var(--surface-0)] p-3"
                            >
                              <p className="text-sm text-[var(--brand-900)]">{item.dish}</p>
                              <div className="mt-3 flex justify-end">
                                <div className="flex items-center gap-1 rounded-full border border-[var(--surface-line)] bg-white p-1">
                                  <button
                                    type="button"
                                    onClick={() => updateItemQuantity(item.id, -1)}
                                    className="rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-1)]"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <span className="w-6 text-center text-sm font-semibold text-[var(--brand-900)]">{qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateItemQuantity(item.id, 1)}
                                    className="rounded-full p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-1)]"
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
                </Accordion>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-center text-sm text-[var(--ink-muted)]">{t.fullMenuHint}</p>
              <Link href="/full-menu">
                <a
                  onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "auto" })}
                  className="inline-flex rounded-full border border-[var(--surface-line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand-800)] hover:border-[var(--brand-300)] hover:text-[var(--brand-900)]"
                >
                  {t.fullMenuCta}
                </a>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--surface-line)] bg-[var(--surface-0)] py-14 md:py-20">
          <div className="container grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-[var(--surface-line)] bg-white p-6 md:p-8">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--brand-900)]">{t.zoneLabel}</span>
                  <select
                    value={selectedZoneId}
                    onChange={(event) => setSelectedZoneId(event.target.value)}
                    className="w-full rounded-xl border border-[var(--surface-line)] bg-white px-4 py-3 text-sm"
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
                    className="w-full rounded-xl border border-[var(--surface-line)] px-4 py-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--brand-900)]">{t.phoneLabel}</span>
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-xl border border-[var(--surface-line)] px-4 py-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--brand-900)]">{t.addressLabel}</span>
                  <input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="w-full rounded-xl border border-[var(--surface-line)] px-4 py-3 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-[var(--brand-900)]">{t.noteLabel}</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder={t.notePlaceholder}
                    rows={4}
                    className="w-full rounded-xl border border-[var(--surface-line)] px-4 py-3 text-sm"
                  />
                </label>
              </div>
            </div>

            <aside className="rounded-2xl border border-[var(--surface-line)] bg-[var(--surface-1)] p-6 md:p-8 lg:sticky lg:top-24 lg:h-fit">
              <h3 className="text-2xl text-[var(--brand-900)]">{t.summaryTitle}</h3>
              <div className="mt-5 space-y-3">
                {cartRows.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--surface-line)] bg-white p-4 text-sm text-[var(--ink-muted)]">
                    {t.emptyCart}
                  </p>
                ) : (
                  cartRows.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--surface-line)] bg-white px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-[var(--brand-900)]">
                          {item.quantity} x {item.dish}
                        </p>
                        {!item.id.startsWith("drink-") && (
                          <p className="text-xs text-[var(--ink-muted)]">{formatFcfa(item.price)}</p>
                        )}
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
                  <span className="inline-flex items-center gap-2">
                    <ShoppingBag size={14} />
                    {t.selectedCount}
                  </span>
                  <span className="font-semibold text-[var(--brand-900)]">{selectedDishCount}</span>
                </div>
                <div className="flex justify-between rounded-xl border border-[var(--surface-line)] bg-white px-4 py-3">
                  <span>{t.deliveryFee}</span>
                  <span className="font-semibold text-[var(--brand-900)]">{formatFcfa(selectedZone.fee)}</span>
                </div>
              </div>

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

export default Home;
