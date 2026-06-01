import type { Product, ProductCategory } from "@/lib/data/products";

export type Locale = "pl" | "en";

export const defaultLocale: Locale = "pl";
export const locales: Locale[] = ["pl", "en"];

const localizedPathnames: Record<string, Record<Locale, string>> = {
  "/collection": {
    pl: "/kolekcja",
    en: "/collection",
  },
};

function normalizePathname(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  const localizedEntry = Object.entries(localizedPathnames).find(([, localized]) =>
    Object.values(localized).includes(normalized),
  );

  return localizedEntry?.[0] ?? normalized;
}

export function getLocaleFromPathname(pathname?: string | null): Locale {
  return pathname?.startsWith("/en") ? "en" : "pl";
}

export function stripLocalePrefix(pathname: string) {
  if (pathname === "/en") {
    return "/";
  }

  if (pathname.startsWith("/en/")) {
    return pathname.slice(3);
  }

  return pathname || "/";
}

export function withLocalePath(pathname: string, locale: Locale) {
  const normalized = normalizePathname(pathname);
  const localized = localizedPathnames[normalized]?.[locale] ?? normalized;

  if (locale === "en") {
    return localized === "/" ? "/en" : `/en${localized}`;
  }

  return localized;
}

export function switchLocalePath(pathname: string, locale: Locale) {
  return withLocalePath(normalizePathname(stripLocalePrefix(pathname)), locale);
}

export function getCategoryLabel(category: ProductCategory, locale: Locale) {
const labels: Record<ProductCategory, Record<Locale, string>> = {
    "T-Shirts": {
      pl: "T-Shirty",
      en: "T-Shirts",
    },
    "Long Sleeves": {
      pl: "Longsleeve",
      en: "Long Sleeves",
    },
    Sweatshirts: {
      pl: "Bluzy",
      en: "Sweatshirts",
    },
    Hoodies: {
      pl: "Hoodie",
      en: "Hoodies",
    },
  };

  return labels[category][locale];
}

type LocalizedProductContent = {
  tagline: string;
  description: string;
  details: string[];
  material: string;
};

const polishProductContent: Record<string, LocalizedProductContent> = {
  "gm-001": {
    tagline: "Ciężka bluza z kapturem o prostej, mocnej linii.",
    description:
      "Bluza typu kangurka z grubej, miękkiej bawełny. Ma luźny krój, dwuwarstwowy kaptur i dyskretny znak Garçonmaires na piersi.",
    details: [
      "530 gsm, czesana bawełna fleece",
      "Luźny, prosty krój",
      "Przednia kieszeń kangurka",
      "Dwuwarstwowy kaptur",
      "Tonalne oznaczenie Garçonmaires na piersi",
    ],
    material: "100% bawełna",
  },
  "gm-002": {
    tagline: "T-shirt z grubszej dzianiny, z luźniejszym ramieniem.",
    description:
      "Codzienna baza pierwszej kolekcji: pudełkowy krój, stabilny kołnierz i mały znak marki z przodu.",
    details: [
      "Grubsza dzianina bawełniana",
      "Pudełkowy krój z opuszczonym ramieniem",
      "Wzmocnione wykończenie dekoltu",
      "Miękkie pranie wykańczające",
    ],
    material: "100% bawełna organiczna",
  },
  "gm-003": {
    tagline: "Longsleeve o spokojnym kroju i wydłużonej linii rękawa.",
    description:
      "Longsleeve z cięższej bawełny, zaprojektowany jako warstwa pod bluzę albo samodzielny element prostego zestawu.",
    details: [
      "Cięższa dzianina bawełniana",
      "Prosty, luźny krój",
      "Lekko wydłużony rękaw",
      "Tonalny nadruk na piersi i karku",
    ],
    material: "100% bawełna",
  },
  "gm-004": {
    tagline: "Ciężka bluza bez kaptura, z czystą linią ramion.",
    description:
      "Bluza crewneck z grubej bawełny loopback. Prosty krój, opuszczone ramię i minimalne oznaczenie marki.",
    details: [
      "480 gsm, bawełna loopback",
      "Luźny korpus i opuszczone ramię",
      "Ściągacz przy szyi, mankietach i dole",
      "Minimalne tonalne oznaczenie Garçonmaires",
    ],
    material: "100% bawełna",
  },
};

export function getProductCopy(product: Product, locale: Locale) {
  if (locale === "en") {
    return {
      category: getCategoryLabel(product.category, locale),
      tagline: product.tagline,
      description: product.description,
      details: product.details,
      material: product.material,
    };
  }

  const localized = polishProductContent[product.id];

  return {
    category: getCategoryLabel(product.category, locale),
    tagline: localized?.tagline ?? product.tagline,
    description: localized?.description ?? product.description,
    details: localized?.details ?? product.details,
    material: localized?.material ?? product.material,
  };
}

export const copy = {
  pl: {
    metaDescription:
      "Garçonmaires to polska marka odzieżowa tworzona wokół czerni, prostego kroju i mocnego znaku.",
    nav: {
      home: "Start",
      shop: "Kolekcja",
      about: "O marce",
      contact: "Kontakt",
      play: "Pasjans",
      collection: "Nowa kolekcja",
      cart: "Koszyk",
      menu: "Menu",
      close: "Zamknij",
    },
    home: {
      eyebrow: "DROP 01",
      title: "Garçonmaires zaczyna się od czerni.",
      description:
        "Pierwsza seria powstaje jako krótka garderoba: proste formy, cięższe tkaniny i wyrazisty znak.",
      primaryCta: "Dołącz przed premierą",
      secondaryCta: "Poznaj markę",
      featuredEyebrow: "DROP 01",
      featuredTitle: "Garçonmaires zaczyna się od czerni.",
      featuredDescription:
        "Pierwsza seria powstaje jako krótka garderoba: proste formy, cięższe tkaniny i wyrazisty znak.",
      featuredNotes: [
        "01 / heavy cotton",
        "02 / black base",
        "03 / limited run",
      ],
      visualLabel: "Studium znaku",
      visualMeta: "Garçonmaires / 01",
      visualCaption: "Czerń, kontrast, cichy znak.",
      viewAll: "Zobacz wszystko",
      statementEyebrow: "Manifest marki",
      statementTitle:
        "Mniej elementów. Więcej charakteru.",
      statementBodyOne:
        "Garçonmaires wychodzi z codziennego streetwearu, ale trzyma go bliżej elegancji: przez proporcje, materiał i ograniczoną paletę.",
      statementBodyTwo:
        "Czerń jest bazą. Biel i metaliczne detale budują kontrast. Reszta ma zostać spokojna, żeby ubranie robiło swoje.",
      statementCta: "Przeczytaj historię",
      notesEyebrow: "Notatki do kolekcji",
      notesTitle:
        "Pierwszy drop skupia się na kroju, ciężarze i znaku.",
      newsletterEyebrow: "Prywatna lista",
      newsletterTitle:
        "Zapisz się przed premierą DROP 01.",
      newsletterDescription:
        "Wyślemy informacje o dacie premiery, dostępnych modelach i wcześniejszym dostępie dla osób z listy.",
      newsletterPlaceholder: "Adres e-mail",
      newsletterButton: "Dołącz",
      featureBlocks: [
        {
          label: "Materiały",
          title: "Grubsza bawełna, czysta powierzchnia i oszczędny detal.",
          body: "Ubrania mają dobrze wyglądać w ruchu i w codziennym noszeniu, bez dopowiadania ich ozdobami.",
        },
        {
          label: "Tożsamość",
          title: "Streetwear z ciemniejszą, bardziej elegancką linią.",
          body: "To nie jest sportowa kolekcja ani klasyczna moda formalna. To ubrania pomiędzy: proste, mocne i do noszenia na co dzień.",
        },
        {
          label: "Podejście",
          title: "Krótka garderoba zamiast przypadkowego nadmiaru.",
          body: "DROP 01 ma tworzyć spójny zestaw: t-shirt, longsleeve, bluzy i dodatki w tym samym języku.",
        },
      ],
    },
    collectionPage: {
      eyebrow: "Drop 01",
      title: "DROP 01",
      description:
        "Pierwszy drop zostaje na razie w formie języka: czerń, ciężar, kontrast i prosty znak Garçonmaires.",
      leadLabel: "Kierunek",
      leadName: "Czerń / znak / krótka seria",
      leadCategory: "DROP 01",
      leadDescription:
        "Na tym etapie pokazujemy świat marki: ciemną bazę, graficzny znak i oszczędną formę.",
      conceptLabel: "Język marki",
      availability: "DROP 01 WKRÓTCE",
      productCta: "Zobacz kierunek",
      moodTitle: "Mniej opisu. Więcej nastroju.",
      moodBody:
        "Garçonmaires buduje napięcie między codziennością a elegancją: czarne tło, mocny znak i dużo przestrzeni.",
      footerNote: "",
    },
    shop: {
      eyebrow: "Sklep",
      title: "Kolekcja",
      description:
        "Pierwszy drop Garçonmaires: bluzy, t-shirty i warstwy bazowe w czerni, bieli i odcieniach szarości.",
      allCategories: "Wszystkie kategorie",
      featured: "Wyróżnione",
      priceLow: "Cena: od najniższej",
      priceHigh: "Cena: od najwyższej",
      name: "Nazwa",
      notes: [
        {
          label: "Język kolekcji",
          body: "Proste fasony, cięższe dzianiny i ograniczona paleta kolorów.",
        },
        {
          label: "Sygnatura",
          body: "Czerń, graficzny znak i detale, które nie próbują przejąć całego ubrania.",
        },
        {
          label: "Wykończenie",
          body: "Krój ma być widoczny od razu: w ramionach, długości i ciężarze materiału.",
        },
      ],
      piecesSuffix: "modeli",
      palette: "Czerń / Biel / Skala szarości",
    },
    product: {
      limitedRelease: "Limitowana premiera",
      selectSize: "Wybierz rozmiar",
      quantity: "Ilość",
      addToCart: "Dodaj do koszyka",
      buyNow: "Kup teraz",
      materials: "Materiał",
      details: "Szczegóły",
      service: "Zakupy",
      serviceBody:
        "Zamówienia w Polsce są rozliczane w PLN przez operatora płatności wybranego dla polskiego rynku.",
      relatedEyebrow: "Powiązane produkty",
      relatedTitle: "Zobacz też.",
    },
    cart: {
      eyebrow: "Koszyk",
      title: "Wybrane modele",
      canceled:
        "Płatność została przerwana. Koszyk pozostał zapisany, więc możesz wrócić do zamówienia w dowolnym momencie.",
      emptyTitle: "Twój koszyk jest teraz pusty.",
      emptyBody:
        "Przejrzyj kolekcję i dodaj modele, aby zobaczyć je tutaj.",
      continueShopping: "Wróć do sklepu",
      size: "Rozmiar",
      remove: "Usuń",
      summary: "Podsumowanie",
      subtotal: "Suma częściowa",
      shipping: "Dostawa",
      shippingAtCheckout: "Przy płatności",
      checkout: "Przejdź do płatności",
      paymentsNote:
        "Płatności są realizowane w PLN przez polskiego operatora płatności.",
      drawerTitle: "Wybrane modele",
      drawerEmptyBody: "Dodaj produkt z kolekcji, aby rozpocząć zamówienie.",
      drawerExplore: "Przeglądaj sklep",
      viewCart: "Zobacz koszyk",
    },
    about: {
      title: "O marce",
      description:
        "Garçonmaires to polska marka odzieżowa z Warszawy, budowana wokół czerni, prostego kroju i mocnego znaku.",
      eyebrow: "O Garçonmaires",
      heroTitle: "Born in Warsaw. Dressed in noir.",
      heroBody:
        "Garçonmaires to polska marka odzieżowa z Warszawy. Powstaje wokół prostych form, mocnego symbolu i ciemnej, miejskiej estetyki.",
      vision: "WIZJA",
      visionBody:
        "Zbudować polską markę, która ma własny znak i własny ton.\n\nElegancja nie musi oznaczać koszuli i garnituru. Może być w kroju bluzy, ciężarze bawełny i sposobie noszenia czerni.",
      identity: "TOŻSAMOŚĆ",
      identityBody:
        "Czyste formy, mocny symbol i ubrania bez niepotrzebnego hałasu.\n\nGarçonmaires stawia na rzeczy, które mają charakter, ale nie muszą go tłumaczyć dużym nadrukiem.",
      mood: "NASTRÓJ",
      moodBody:
        "Czerń, szkło, metal, stare wnętrza i warszawska surowość.\n\nMiędzy ulicą a elegancją.\nMiędzy codziennym ubraniem a czymś bardziej zdecydowanym.",
      storyEyebrow: "HISTORIA MARKI",
      storyTitle:
        "Nowa interpretacja polskiej elegancji.",
      story: [
        "Garçonmaires powstało z potrzeby stworzenia marki, która mówi o polskiej elegancji współczesnym językiem: przez streetwear, prostotę i znak.",
        "Nie wracamy do nostalgii wprost. Bliżej nam do atmosfery miasta: kontrastu, surowych materiałów, ciemnych wnętrz i rzeczy, które nie muszą krzyczeć.",
      ],
    },
    contact: {
      title: "Kontakt",
      description:
        "Kontakt z Garçonmaires w sprawie kolekcji, prasy, współpracy i zamówień.",
      eyebrow: "Kontakt",
      heroTitle: "Kontakt ze studiem.",
      heroBody:
        "Napisz do nas w sprawie kolekcji, prasy, współpracy albo zamówienia. Odpowiadamy bezpośrednio ze studia Garçonmaires.",
      email: "E-mail",
      base: "Miasto",
      name: "Imię i nazwisko",
      subject: "Temat",
      message: "Wiadomość",
      send: "Wyślij wiadomość",
    },
    footer: {
      body:
        "Ciemna garderoba z Warszawy: bluzy, t-shirty i dodatki budowane wokół prostego kroju, cięższych materiałów i mocnego znaku.",
      navigation: "Nawigacja",
      contact: "Kontakt",
      press: "Prasa i sprzedaż hurtowa na zapytanie",
      studio: "Garçonmaires Studio",
    },
    success: {
      title: "Płatność zakończona",
      description: "Dziękujemy za zamówienie Garçonmaires.",
      eyebrow: "Zamówienie potwierdzone",
      heroTitle: "Dziękujemy za zamówienie.",
      heroBody:
        "Twoje zamówienie Garçonmaires zostało przyjęte. Wkrótce wyślemy e-mail z podsumowaniem zakupu i dalszymi krokami.",
      market: "Rynek",
      total: "Łącznie",
      confirmed: "Potwierdzone",
      confirmationEmail: "E-mail potwierdzający",
      continueShopping: "Wróć do sklepu",
      returnHome: "Wróć na start",
      marketName: "Polska",
    },
    checkout: {
      redirecting: "Przekierowanie...",
      startError: "Nie udało się rozpocząć płatności.",
      emptyError: "Twój koszyk jest pusty.",
      configError:
        "Operator płatności nie jest jeszcze skonfigurowany.",
      sessionError: "Nie udało się utworzyć płatności.",
    },
    languageName: "PL",
  },
  en: {
    metaDescription:
      "Garçonmaires is a monochrome fashion label blending modern streetwear with elegant editorial minimalism.",
    nav: {
      home: "Home",
      shop: "Collection",
      about: "About",
      contact: "Contact",
      play: "Solitaire",
      collection: "New Collection",
      cart: "Cart",
      menu: "Menu",
      close: "Close",
    },
    home: {
      eyebrow: "DROP 01",
      title: "Garçonmaires begins with black.",
      description:
        "The first series takes shape as a concise wardrobe: clean forms, heavier fabrics, and a sharp graphic mark.",
      primaryCta: "Join before launch",
      secondaryCta: "About the brand",
      featuredEyebrow: "DROP 01",
      featuredTitle: "Garçonmaires begins with black.",
      featuredDescription:
        "The first series takes shape as a concise wardrobe: clean forms, heavier fabrics, and a sharp graphic mark.",
      featuredNotes: [
        "01 / heavy cotton",
        "02 / black base",
        "03 / limited run",
      ],
      visualLabel: "Mark study",
      visualMeta: "Garçonmaires / 01",
      visualCaption: "Black, contrast, quiet mark.",
      viewAll: "View the world",
      statementEyebrow: "Brand Statement",
      statementTitle:
        "Luxury reduced to silhouette, contrast, and atmosphere.",
      statementBodyOne:
        "Garçonmaires is built around the tension between streetwear and elegance. The first collection avoids excess and lets proportion, jersey weight, and finish define the mood.",
      statementBodyTwo:
        "Black leads the wardrobe. White interrupts with precision. Everything else becomes tone, shadow, and space around the body.",
      statementCta: "Read the story",
      notesEyebrow: "Collection Notes",
      notesTitle: "Quiet structure, aligned with a single editorial mood.",
      newsletterEyebrow: "Private List",
      newsletterTitle: "Receive collection releases and studio notes first.",
      newsletterDescription:
        "Join the Garçonmaires list for collection releases, studio updates, and private announcements.",
      newsletterPlaceholder: "Email address",
      newsletterButton: "Subscribe",
      featureBlocks: [
        {
          label: "Materials",
          title: "Dense cotton, jersey weight, and tonal surfaces.",
          body: "Every piece is reduced to cut, texture, and finish so the silhouette carries the full weight.",
        },
        {
          label: "Identity",
          title: "Streetwear sharpened through editorial restraint.",
          body: "The collection balances city uniform energy with the discipline of luxury ready-to-wear.",
        },
        {
          label: "Approach",
          title: "A concise wardrobe designed to layer without noise.",
          body: "Each piece is edited with discipline so the collection remains clear, wearable, and enduring.",
        },
      ],
    },
    collectionPage: {
      eyebrow: "Drop 01",
      title: "DROP 01",
      description:
        "For now, the first drop stays in the language of the brand: black, weight, contrast, and the Garçonmaires mark.",
      leadLabel: "Direction",
      leadName: "Black / mark / short run",
      leadCategory: "DROP 01",
      leadDescription:
        "At this stage, the page shows the brand world: a dark base, a graphic mark, and restrained form.",
      conceptLabel: "Brand language",
      availability: "DROP 01 SOON",
      productCta: "View direction",
      moodTitle: "Less explanation. More atmosphere.",
      moodBody:
        "Garçonmaires builds tension between everyday wear and elegance: black ground, a strong mark, and deliberate space.",
      footerNote: "",
    },
    shop: {
      eyebrow: "Shop",
      title: "Collection",
      description:
        "A monochrome first drop of elevated essentials shaped for modern city dressing.",
      allCategories: "All Categories",
      featured: "Featured",
      priceLow: "Price: Low to High",
      priceHigh: "Price: High to Low",
      name: "Name",
      notes: [
        {
          label: "Collection Language",
          body: "Dense essentials, tailored proportion, and matte finish.",
        },
        {
          label: "Signature",
          body: "A monochrome wardrobe shaped by structure, contrast, and restraint.",
        },
        {
          label: "Finish",
          body: "Apparel designed to read clearly on the body.",
        },
      ],
      piecesSuffix: "pieces",
      palette: "Black / White / Grayscale",
    },
    product: {
      limitedRelease: "Limited Release",
      selectSize: "Select size",
      quantity: "Quantity",
      addToCart: "Add to cart",
      buyNow: "Buy now",
      materials: "Materials",
      details: "Details",
      service: "Service",
      serviceBody:
        "Orders for Poland are processed in PLN through the configured Polish payment provider.",
      relatedEyebrow: "Related Products",
      relatedTitle: "Continue the wardrobe.",
    },
    cart: {
      eyebrow: "Cart",
      title: "Selected Pieces",
      canceled:
        "Checkout was canceled. Your cart has been saved so you can finish the order whenever you are ready.",
      emptyTitle: "Your cart is currently empty.",
      emptyBody:
        "Explore the collection and add pieces to review them here.",
      continueShopping: "Continue shopping",
      size: "Size",
      remove: "Remove",
      summary: "Summary",
      subtotal: "Subtotal",
      shipping: "Shipping",
      shippingAtCheckout: "At checkout",
      checkout: "Continue to checkout",
      paymentsNote:
        "Payments are processed in PLN through the configured Polish payment provider.",
      drawerTitle: "Selected Pieces",
      drawerEmptyBody: "Add pieces from the collection to begin checkout.",
      drawerExplore: "Explore the shop",
      viewCart: "View cart",
    },
    about: {
      title: "About",
      description:
        "Garçonmaires is a Polish clothing brand built around elegance, simplicity and contrast.",
      eyebrow: "About Garçonmaires",
      heroTitle: "Born in Warsaw. Dressed in noir.",
      heroBody:
        "Garçonmaires is a Polish clothing brand built around elegance, simplicity and contrast.\n\nRooted in its local context, it speaks through a contemporary language of fashion.",
      vision: "VISION",
      visionBody:
        "A modern Polish brand that does not imitate foreign codes or repeat the obvious.\n\nElegance does not have to be predictable. Streetwear does not have to be loud.",
      identity: "IDENTITY",
      identityBody:
        "Clean forms. A strong symbol. Restrained elegance.\n\nGarçonmaires is built around garments with presence, not excess.",
      mood: "MOOD",
      moodBody:
        "Black, glass, metal, old interiors and the Polish landscape.\n\nBetween the street and elegance.\nBetween everyday reality and refinement.",
      storyEyebrow: "BRAND STORY",
      storyTitle:
        "A new interpretation of Polish elegance.",
      story: [
        "Garçonmaires was created from the need to build a brand that connects quality, contemporary streetwear and local sensitivity.",
        "We are not interested in literal nostalgia. We are interested in atmosphere: Warsaw, restraint, contrast, rawness and elegance that does not need to be loud.",
      ],
    },
    contact: {
      title: "Contact",
      description:
        "Contact Garçonmaires for studio inquiries, wholesale conversation, and private appointments.",
      eyebrow: "Contact",
      heroTitle: "Studio access.",
      heroBody:
        "For press, wholesale, and collection inquiries, contact the Garçonmaires studio directly.",
      email: "Email",
      base: "Base",
      name: "Name",
      subject: "Subject",
      message: "Message",
      send: "Send inquiry",
    },
    footer: {
      body:
        "Monochrome essentials for a modern street silhouette. A restrained first drop built around four foundational garments.",
      navigation: "Navigation",
      contact: "Contact",
      press: "Press and wholesale on request",
      studio: "Garçonmaires Studio",
    },
    success: {
      title: "Checkout Success",
      description: "Thank you for your Garçonmaires order.",
      eyebrow: "Order Confirmed",
      heroTitle: "Thank you for your order.",
      heroBody:
        "Your Garçonmaires order has been received. A confirmation email will be sent shortly with your purchase summary and next steps.",
      market: "Market",
      total: "Total",
      confirmed: "Confirmed",
      confirmationEmail: "Confirmation email",
      continueShopping: "Continue shopping",
      returnHome: "Return home",
      marketName: "Poland",
    },
    checkout: {
      redirecting: "Redirecting...",
      startError: "Unable to start checkout.",
      emptyError: "Your cart is empty.",
      configError:
        "The payment provider is not configured yet.",
      sessionError: "Unable to create payment.",
    },
    languageName: "EN",
  },
} as const;
