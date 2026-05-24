import type { Product, ProductCategory } from "@/lib/data/products";

export type Locale = "pl" | "en";

export const defaultLocale: Locale = "pl";
export const locales: Locale[] = ["pl", "en"];

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
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (locale === "en") {
    return normalized === "/" ? "/en" : `/en${normalized}`;
  }

  return normalized;
}

export function switchLocalePath(pathname: string, locale: Locale) {
  return withLocalePath(stripLocalePrefix(pathname), locale);
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
    tagline: "Ciężka bawełna fleece i powściągliwa streetwearowa sylwetka.",
    description:
      "Ciężka kangurka z uporządkowaną linią ramion, czystym dołem i tonalnym detalem Garçonmaires utrzymanym w pełnej dyscyplinie.",
    details: [
      "530 gsm, czesana bawełna fleece",
      "Luźny prosty krój",
      "Przednia kieszeń kangurka",
      "Dwuwarstwowy kaptur",
      "Tonalny znak Garçonmaires na piersi",
    ],
    material: "100% bawełna",
  },
  "gm-002": {
    tagline: "Zwarta dzianina, opuszczone ramię i czyste oznaczenie marki.",
    description:
      "Podstawowy t-shirt premium o pudełkowym kroju, precyzyjnym kołnierzu i minimalistycznym znaku z przodu.",
    details: [
      "Zwarta dzianina bawełniana",
      "Pudełkowy krój z opuszczonym ramieniem",
      "Wykończony dekolt",
      "Miękkie pranie wykańczające",
    ],
    material: "100% bawełna organiczna",
  },
  "gm-003": {
    tagline: "Zwarta dzianina, wydłużona linia i spokojny charakter.",
    description:
      "Longsleeve premium zaprojektowany z lekko wydłużonym rękawem, zbalansowaną szerokością korpusu i czystym monochromatycznym wykończeniem.",
    details: [
      "Zwarta ciężka dzianina bawełniana",
      "Prosty luźny krój",
      "Wydłużona proporcja rękawa",
      "Tonalny nadruk na piersi i karku",
    ],
    material: "100% zwarta bawełna",
  },
  "gm-004": {
    tagline: "Gęsta bawełna loopback i czysta sylwetka bez kaptura.",
    description:
      "Ciężka bluza crewneck skrojona bez nadmiaru, z naciskiem na objętość, układ na sylwetce i precyzyjne monochromatyczne wykończenie.",
    details: [
      "480 gsm, bawełna loopback",
      "Luźny korpus i opuszczone ramię",
      "Ściągacz przy szyi, mankietach i dole",
      "Minimalny tonalny podpis Garçonmaires",
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
      "Garçonmaires to monochromatyczna marka modowa łącząca nowoczesny streetwear z eleganckim, edytorialnym minimalizmem.",
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
      eyebrow: "GARÇONMAIRES / POLSKI STREETWEAR",
      title: "POLSKA ELEGANCJA\nW FORMIE STREETWEARU.",
      description:
        "Garçonmaires to polska marka odzieżowa budowana wokół jakości, prostoty i wyrazistego znaku.\n\nWspółczesny streetwear. Powściągliwa elegancja. Lokalny kontekst.",
      primaryCta: "POZNAJ MARKĘ",
      secondaryCta: "DROP 01 WKRÓTCE",
      featuredEyebrow: "DROP 01",
      featuredTitle: "Pierwsza forma\nGarçonmaires jest w przygotowaniu.",
      featuredDescription:
        "Pierwszy drop będzie oparty na czerni, prostocie i graficznym symbolu marki.\n\nProdukty pojawią się po zakończeniu prac nad próbkami i finalną formą kolekcji.",
      viewAll: "Zobacz wszystko",
      statementEyebrow: "Manifest marki",
      statementTitle:
        "Luksus sprowadzony do sylwetki, kontrastu i atmosfery.",
      statementBodyOne:
        "Garçonmaires powstaje na napięciu między streetwearem a elegancją. Pierwsza kolekcja odrzuca nadmiar i pozwala, by nastrój tworzyły proporcja, ciężar dzianiny i wykończenie.",
      statementBodyTwo:
        "Czerń prowadzi garderobę. Biel przecina ją z precyzją. Wszystko inne staje się tonem, cieniem i przestrzenią wokół ciała.",
      statementCta: "Przeczytaj historię",
      notesEyebrow: "Notatki do kolekcji",
      notesTitle:
        "Cicha struktura podporządkowana jednemu wyrazistemu nastrojowi.",
      newsletterEyebrow: "Prywatna lista",
      newsletterTitle:
        "Otrzymuj premiery kolekcji i wiadomości ze studia jako pierwsza.",
      newsletterDescription:
        "Dołącz do listy Garçonmaires, aby otrzymywać informacje o premierach, aktualizacjach ze studia i prywatnych ogłoszeniach.",
      newsletterPlaceholder: "Adres e-mail",
      newsletterButton: "Dołącz",
      featureBlocks: [
        {
          label: "Materiały",
          title: "Zwarta bawełna, ciężar dzianiny i tonalne powierzchnie.",
          body: "Każdy model został sprowadzony do kroju, faktury i wykończenia, aby ciężar niosła sama sylwetka.",
        },
        {
          label: "Tożsamość",
          title: "Streetwear wyostrzony przez edytorialną dyscyplinę.",
          body: "Kolekcja łączy energię miejskiego uniformu z powściągliwością luksusowego ready-to-wear.",
        },
        {
          label: "Podejście",
          title: "Krótsza garderoba zaprojektowana do warstw bez szumu.",
          body: "Każdy model został zredagowany z dyscypliną, aby cała kolekcja pozostała klarowna, użytkowa i trwała.",
        },
      ],
    },
    shop: {
      eyebrow: "Sklep",
      title: "Kolekcja",
      description:
        "Monochromatyczny pierwszy drop podniesionych essentials zaprojektowanych dla współczesnego miejskiego ubioru.",
      allCategories: "Wszystkie kategorie",
      featured: "Wyróżnione",
      priceLow: "Cena: od najniższej",
      priceHigh: "Cena: od najwyższej",
      name: "Nazwa",
      notes: [
        {
          label: "Język kolekcji",
          body: "Gęste essentials, precyzyjna proporcja i matowe wykończenie.",
        },
        {
          label: "Sygnatura",
          body: "Monochromatyczna garderoba prowadzona przez strukturę, kontrast i powściągliwość.",
        },
        {
          label: "Wykończenie",
          body: "Ubrania zaprojektowane tak, by czytelnie pracowały na ciele.",
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
      service: "Obsługa",
      serviceBody:
        "Zamówienia na terenie Polski są rozliczane w PLN przez Stripe Checkout z lokalnymi metodami płatności.",
      relatedEyebrow: "Powiązane produkty",
      relatedTitle: "Kontynuuj garderobę.",
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
        "Płatności są realizowane w PLN przez Stripe Checkout dla klientów w Polsce.",
      drawerTitle: "Wybrane modele",
      drawerEmptyBody: "Dodaj produkty z kolekcji, aby rozpocząć zamówienie.",
      drawerExplore: "Przeglądaj sklep",
      viewCart: "Zobacz koszyk",
    },
    about: {
      title: "O marce",
      description:
        "Garçonmaires to polska marka odzieżowa budowana wokół elegancji, prostoty i kontrastu.",
      eyebrow: "O Garçonmaires",
      heroTitle: "Urodzone w Warszawie. Ubrane w noir.",
      heroBody:
        "Garçonmaires to polska marka odzieżowa budowana wokół elegancji, prostoty i kontrastu.\n\nWychodzi z lokalnego kontekstu, ale mówi współczesnym językiem mody.",
      vision: "WIZJA",
      visionBody:
        "Nowoczesna polska marka, która nie udaje zagranicznej i nie powiela oczywistości.\n\nElegancja nie musi być klasyczna w oczywisty sposób. Streetwear nie musi być krzykliwy.",
      identity: "TOŻSAMOŚĆ",
      identityBody:
        "Czyste formy. Mocny symbol. Powściągliwa elegancja.\n\nGarçonmaires stawia na ubrania, które mają charakter bez nadmiaru.",
      mood: "NASTRÓJ",
      moodBody:
        "Czerń, szkło, metal, stare wnętrza i polski krajobraz.\n\nMiędzy ulicą a elegancją.\nMiędzy codziennością a szykiem.",
      storyEyebrow: "HISTORIA MARKI",
      storyTitle:
        "Nowa interpretacja polskiej elegancji.",
      story: [
        "Garçonmaires powstało z potrzeby stworzenia marki, która łączy jakość, współczesny streetwear i lokalną wrażliwość.",
        "Nie interesuje nas dosłowna nostalgia. Bardziej atmosfera: Warszawa, powściągliwość, kontrast, surowość i elegancja, która nie potrzebuje krzyku.",
        "To marka dla osób, które wybierają mniej — ale mocniej.",
      ],
    },
    contact: {
      title: "Kontakt",
      description:
        "Skontaktuj się z Garçonmaires w sprawie studia, współpracy hurtowej i prywatnych spotkań.",
      eyebrow: "Kontakt",
      heroTitle: "Kontakt ze studiem.",
      heroBody:
        "W sprawie prasy, sprzedaży hurtowej i pytań dotyczących kolekcji skontaktuj się bezpośrednio ze studiem Garçonmaires.",
      email: "E-mail",
      base: "Miasto",
      name: "Imię i nazwisko",
      subject: "Temat",
      message: "Wiadomość",
      send: "Wyślij wiadomość",
    },
    footer: {
      body:
        "Monochromatyczne krawiectwo dla nowoczesnej ulicznej sylwetki. Projektowe essentials, wyroby skórzane i precyzyjne dodatki dla powściągliwej garderoby.",
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
        "Stripe nie jest jeszcze skonfigurowany. Dodaj STRIPE_SECRET_KEY, aby włączyć płatności.",
      sessionError: "Nie udało się utworzyć sesji płatności.",
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
      eyebrow: "GARÇONMAIRES / POLISH STREETWEAR",
      title: "Polish elegance\nin streetwear form.",
      description:
        "Garçonmaires is a clothing brand built around quality, simplicity and a strong graphic symbol.\n\nIt connects contemporary streetwear with elegance that does not need excess.",
      primaryCta: "DISCOVER THE BRAND",
      secondaryCta: "DROP 01 COMING SOON",
      featuredEyebrow: "DROP 01",
      featuredTitle: "The first form\nof Garçonmaires is taking shape.",
      featuredDescription:
        "The first drop will be built around black, simplicity and the graphic symbol of the brand.\n\nProducts will be released once samples and the final collection form are completed.",
      viewAll: "View all products",
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
        "Orders for Poland are processed in PLN through Stripe Checkout with local payment methods.",
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
        "Payments are processed in PLN through Stripe Checkout for customers in Poland.",
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
        "A brand for those who choose less — but stronger.",
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
        "Stripe is not configured yet. Add STRIPE_SECRET_KEY to enable checkout.",
      sessionError: "Unable to create checkout session.",
    },
    languageName: "EN",
  },
} as const;
