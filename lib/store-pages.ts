import type { Locale } from "@/lib/i18n";

export type InfoSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type InfoPageContent = {
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  sections: InfoSection[];
};

export type InfoPageKey =
  | "shipping"
  | "returns"
  | "payments"
  | "faq"
  | "size-guide"
  | "terms"
  | "privacy"
  | "cookies";

const plLegalPendingSection: InfoSection = {
  title: "Status prawny: wersja robocza / pending",
  bullets: [
    "Dane sprzedawcy i forma prowadzenia działalności nie są jeszcze potwierdzone.",
    "Przed startem sprzedaży trzeba wybrać działalność nierejestrowaną albo JDG i uzupełnić finalne dane sprzedawcy.",
    "Nie traktuj tej strony jako finalnego regulaminu, polityki lub informacji handlowej.",
  ],
};

const enLegalPendingSection: InfoSection = {
  title: "Legal status: draft / pending",
  bullets: [
    "Seller details and business form are not confirmed yet.",
    "Before public sales, the business form must be chosen and final seller details must be completed.",
    "Do not treat this page as final legal, seller, or commercial information.",
  ],
};

export const storePages: Record<Locale, Record<InfoPageKey, InfoPageContent>> = {
  pl: {
    shipping: {
      title: "Dostawa",
      description:
        "Informacje o czasie realizacji, kosztach dostawy i wysyłce zamówień Garçonmaires.",
      eyebrow: "Dostawa",
      intro:
        "Każde zamówienie pakujemy starannie i wysyłamy z jasną informacją o statusie. Poniżej znajdziesz najważniejsze zasady dostawy.",
      sections: [
        plLegalPendingSection,
        {
          title: "Metody dostawy przygotowane do launchu",
          bullets: [
            "InPost Paczkomat: cena robocza 14,99 PLN, edytowalna w panelu admina.",
            "Kurier: cena robocza 17,99 PLN, edytowalna w panelu admina.",
            "Odbiór osobisty pozostaje placeholderem i jest domyślnie wyłączony.",
            "Próg darmowej dostawy jest konfigurowalny w panelu admina i przed startem powinien zostać potwierdzony.",
          ],
        },
        {
          title: "Czas realizacji",
          bullets: [
            "Zamówienia opłacone w dni robocze są zwykle przygotowywane w ciągu 1-3 dni roboczych.",
            "W czasie premiery kolekcji przygotowanie paczki może potrwać do 5 dni roboczych.",
            "Po nadaniu przesyłki wyślemy e-mail z potwierdzeniem wysyłki i numerem śledzenia, jeśli jest dostępny.",
          ],
        },
        {
          title: "Dostawa na terenie Polski",
          bullets: [
            "Zamówienia w Polsce wysyłamy za pośrednictwem wybranego partnera kurierskiego.",
            "Koszt dostawy jest widoczny w koszyku i podczas płatności.",
            "Po nadaniu przesyłka zwykle dociera w ciągu 1-2 dni roboczych.",
          ],
        },
        {
          title: "Dane do uzupełnienia przed startem",
          bullets: [
            "Finalny operator dostawy i warunki współpracy: [UZUPEŁNIĆ].",
            "Finalne ceny dostawy brutto i próg darmowej dostawy: [UZUPEŁNIĆ].",
            "Szacowane czasy doręczeń dla Paczkomatu i kuriera: [ZWERYFIKOWAĆ].",
            "Kontakt do obsługi problemów z doręczeniem: [UZUPEŁNIĆ].",
          ],
        },
        {
          title: "Wysyłka międzynarodowa",
          paragraphs: [
            "Na start obsługujemy przede wszystkim zamówienia z Polski. Wysyłkę międzynarodową planujemy uruchomić w kolejnych etapach rozwoju sklepu.",
          ],
        },
      ],
    },
    returns: {
      title: "Zwroty i reklamacje",
      description:
        "Warunki i procedura zwrotów oraz reklamacji dla zamówień złożonych w sklepie Garçonmaires.",
      eyebrow: "Zwroty i reklamacje",
      intro:
        "To robocza strona informacyjna. Przed startem sprzedaży wymaga uzupełnienia o finalny adres zwrotu, kontakt reklamacyjny i weryfikację prawną.",
      sections: [
        plLegalPendingSection,
        {
          title: "Dane do uzupełnienia przed startem",
          bullets: [
            "Adres zwrotu: [UZUPEŁNIĆ ADRES ZWROTU].",
            "Kontakt w sprawie zwrotów i reklamacji: [UZUPEŁNIĆ E-MAIL].",
            "Szczegóły formularza odstąpienia od umowy: [UZUPEŁNIĆ].",
            "Procedura reklamacyjna i termin odpowiedzi: [ZWERYFIKOWAĆ PRAWNIE].",
          ],
        },
        {
          title: "Termin zwrotu",
          bullets: [
            "Masz 14 dni od otrzymania zamówienia na zgłoszenie zwrotu.",
            "Po zgłoszeniu zwrotu odeślij produkt bez zbędnej zwłoki, najpóźniej w ciągu kolejnych 14 dni.",
          ],
        },
        {
          title: "Stan produktu",
          bullets: [
            "Produkt powinien wrócić w stanie pozwalającym na ponowną ocenę i sprzedaż, bez śladów używania wykraczających poza przymierzenie.",
            "Najlepiej odesłać go w oryginalnym opakowaniu, razem ze wszystkimi elementami dołączonymi do przesyłki.",
          ],
        },
        {
          title: "Reklamacje",
          bullets: [
            "Reklamację można zgłosić mailowo, podając numer zamówienia, opis problemu i zdjęcia produktu, jeśli są potrzebne do oceny zgłoszenia.",
            "Ta sekcja powinna zostać uzupełniona o finalne dane sprzedawcy, adres do korespondencji i aktualne zasady rozpatrywania reklamacji.",
          ],
        },
        {
          title: "Proces zwrotu",
          bullets: [
            "Aby rozpocząć zwrot, napisz na studio@garconmaires.com.",
            "W wiadomości podaj numer zamówienia i produkt, który chcesz zwrócić.",
            "Adres zwrotu i dalsze kroki wyślemy mailowo.",
          ],
        },
      ],
    },
    payments: {
      title: "Płatności",
      description:
        "Dostępne metody płatności i sposób rozliczania zamówień Garçonmaires.",
      eyebrow: "Płatności",
      intro:
        "Zamówienia rozliczamy w polskich złotych przez operatora przygotowanego pod polski rynek: BLIK, szybkie przelewy i karty.",
      sections: [
        {
          title: "Dostępne metody",
          bullets: [
            "BLIK",
            "Przelewy24",
            "Karty płatnicze i kredytowe",
          ],
        },
        {
          title: "Waluta",
          bullets: [
            "Wszystkie ceny w sklepie są podane w PLN.",
            "Pełną kwotę zamówienia, razem z dostawą, zobaczysz przed opłaceniem koszyka.",
          ],
        },
        {
          title: "Bezpieczeństwo",
          paragraphs: [
            "Dane płatnicze obsługuje zewnętrzny operator płatności. Garçonmaires nie przechowuje pełnych danych kart płatniczych.",
          ],
        },
      ],
    },
    faq: {
      title: "FAQ",
      description:
        "Najczęstsze pytania dotyczące rozmiarów, dostawy, płatności i zamówień Garçonmaires.",
      eyebrow: "FAQ",
      intro:
        "Najczęstsze pytania o rozmiary, dostawę, płatności i zwroty zebraliśmy w jednym miejscu.",
      sections: [
        {
          title: "Jak dobrać rozmiar?",
          paragraphs: [
            "Sprawdź tabelę rozmiarów przy produkcie. Jeśli wahasz się między rozmiarami, napisz na studio@garconmaires.com przed złożeniem zamówienia.",
          ],
        },
        {
          title: "Czy produkty są limitowane?",
          paragraphs: [
            "Tak. Pierwsze dropy Garçonmaires powstają w ograniczonych ilościach, więc dostępność rozmiarów może szybko się zmieniać.",
          ],
        },
        {
          title: "Kiedy otrzymam zamówienie?",
          paragraphs: [
            "Większość zamówień z Polski przygotowujemy w ciągu 1-3 dni roboczych. Po nadaniu przesyłka zwykle dociera w kolejne 1-2 dni robocze.",
          ],
        },
        {
          title: "Jak zgłosić zwrot?",
          paragraphs: [
            "Napisz na studio@garconmaires.com, podaj numer zamówienia i nazwę produktu, który chcesz zwrócić.",
          ],
        },
      ],
    },
    "size-guide": {
      title: "Tabela rozmiarów",
      description:
        "Przewodnik po rozmiarach Garçonmaires dla t-shirtów, longsleeve'ów i bluz.",
      eyebrow: "Tabela rozmiarów",
      intro:
        "Pierwsza kolekcja Garçonmaires opiera się na luźniejszych fasonach. Poniższe wskazówki pomogą wybrać właściwy rozmiar przed zakupem.",
      sections: [
        {
          title: "Ogólne dopasowanie",
          bullets: [
            "T-shirt ma pudełkowy krój i lekko opuszczone ramię.",
            "Longsleeve ma luźniejszy korpus i lekko wydłużony rękaw.",
            "Bluza bez kaptura i kangurka są cięższe, bardziej obszerne i mają wyraźnie streetwearowy charakter.",
          ],
        },
        {
          title: "Rekomendacja",
          bullets: [
            "Jeśli chcesz zachować zamierzony krój, wybierz swój zwykły rozmiar.",
            "Jeśli wolisz bardziej dopasowany efekt, rozważ rozmiar mniejszy przy bluzach i longsleeve'ach.",
            "Przy wątpliwościach skontaktuj się mailowo przed zakupem.",
          ],
        },
        {
          title: "Rozmiary dostępne w kolekcji",
          bullets: ["XS", "S", "M", "L", "XL"],
        },
      ],
    },
    terms: {
      title: "Regulamin",
      description:
        "Podstawowe warunki korzystania ze sklepu internetowego Garçonmaires.",
      eyebrow: "Regulamin",
      intro:
        "To robocza struktura regulaminu sklepu. Przed uruchomieniem sprzedaży uzupełnimy ją o pełne dane sprzedawcy i weryfikację prawną.",
      sections: [
        plLegalPendingSection,
        {
          title: "Dane sprzedawcy do uzupełnienia",
          bullets: [
            "Nazwa prawna sprzedawcy: [UZUPEŁNIĆ].",
            "NIP: [UZUPEŁNIĆ].",
            "REGON, jeśli dotyczy: [UZUPEŁNIĆ].",
            "Adres rejestrowy: [UZUPEŁNIĆ].",
            "Adres kontaktowy e-mail: [UZUPEŁNIĆ].",
            "Adres do zwrotów i reklamacji: [UZUPEŁNIĆ].",
          ],
        },
        {
          title: "Postanowienia ogólne",
          bullets: [
            "Sklep internetowy Garçonmaires służy do sprzedaży produktów odzieżowych marki Garçonmaires.",
            "Korzystając ze sklepu, klient powinien działać zgodnie z prawem i dobrymi obyczajami.",
          ],
        },
        {
          title: "Zamówienia",
          bullets: [
            "Zamówienie składasz przez wybór produktu, dodanie go do koszyka i opłacenie zamówienia.",
            "Potwierdzenie przyjęcia zamówienia wysyłamy mailowo.",
          ],
        },
        {
          title: "Płatności i dostawa",
          bullets: [
            "Operator płatności: Tpay / [ZWERYFIKOWAĆ FINALNE DANE OPERATORA].",
            "Operator dostawy: InPost lub inny wybrany przewoźnik / [UZUPEŁNIĆ].",
            "Koszt dostawy i przewidywany czas doręczenia powinny być widoczne przed złożeniem zamówienia.",
          ],
        },
        {
          title: "Zwroty i reklamacje",
          paragraphs: [
            "Szczegółowe zasady zwrotów i reklamacji powinny być spójne z osobnymi stronami informacyjnymi sklepu oraz aktualnymi przepisami prawa konsumenckiego.",
          ],
        },
      ],
    },
    privacy: {
      title: "Polityka prywatności",
      description:
        "Zasady przetwarzania danych osobowych w sklepie internetowym Garçonmaires.",
      eyebrow: "Polityka prywatności",
      intro:
        "To roboczy zakres polityki prywatności. Przed publikacją sklepu uzupełnimy go o pełne dane administratora i podstawy prawne przetwarzania.",
      sections: [
        plLegalPendingSection,
        {
          title: "Administrator danych do uzupełnienia",
          bullets: [
            "Nazwa administratora danych: [UZUPEŁNIĆ].",
            "Adres administratora: [UZUPEŁNIĆ].",
            "Kontakt w sprawie danych osobowych: [UZUPEŁNIĆ E-MAIL].",
            "Podstawy prawne przetwarzania i okresy przechowywania danych: [ZWERYFIKOWAĆ PRAWNIE].",
          ],
        },
        {
          title: "Jakie dane są zbierane",
          bullets: [
            "Dane kontaktowe podawane przy składaniu zamówienia.",
            "Dane adresowe potrzebne do wysyłki.",
            "Informacje techniczne związane z korzystaniem ze strony, jeśli sklep korzysta z analityki.",
          ],
        },
        {
          title: "Cel przetwarzania",
          bullets: [
            "Realizacja zamówienia.",
            "Obsługa płatności, wysyłki i zwrotów.",
            "Kontakt z klientem w sprawie zamówienia.",
          ],
        },
        {
          title: "Prawa użytkownika",
          bullets: [
            "Prawo dostępu do danych.",
            "Prawo do sprostowania lub usunięcia danych.",
            "Prawo do ograniczenia przetwarzania oraz wniesienia skargi do organu nadzorczego.",
          ],
        },
      ],
    },
    cookies: {
      title: "Polityka cookies",
      description:
        "Informacje o plikach cookies używanych przez sklep internetowy Garçonmaires.",
      eyebrow: "Polityka cookies",
      intro:
        "Sklep może używać plików cookies potrzebnych do działania strony oraz dodatkowych narzędzi analitycznych lub funkcjonalnych.",
      sections: [
        {
          title: "Niezbędne cookies",
          bullets: [
            "Utrzymanie koszyka zakupowego.",
            "Prawidłowe działanie sesji i przechodzenia między stronami.",
          ],
        },
        {
          title: "Analityka i narzędzia dodatkowe",
          paragraphs: [
            "Jeśli w sklepie zostaną wdrożone narzędzia analityczne lub marketingowe, polityka cookies powinna zostać rozszerzona o ich dokładny opis i sposób zarządzania zgodą użytkownika.",
          ],
        },
      ],
    },
  },
  en: {
    shipping: {
      title: "Shipping",
      description:
        "Shipping timelines, delivery costs, and order dispatch information for Garçonmaires.",
      eyebrow: "Shipping",
      intro:
        "Garçonmaires orders are prepared with careful packaging, clear communication, and a calm premium checkout experience in mind.",
      sections: [
        enLegalPendingSection,
        {
          title: "Processing time",
          bullets: [
            "Paid orders placed on business days are usually prepared within 1-3 business days.",
            "During collection launches, processing may extend up to 5 business days.",
            "Customers receive a shipping confirmation email once the order is dispatched.",
          ],
        },
        {
          title: "Delivery within Poland",
          bullets: [
            "Domestic delivery is fulfilled through a selected courier partner.",
            "Shipping cost is shown in the cart and during checkout.",
            "Estimated delivery after dispatch is usually 1-2 business days.",
          ],
        },
        {
          title: "International shipping",
          paragraphs: [
            "At this stage, the store is primarily configured for the Polish market. International shipping can be introduced in a later stage of the store rollout.",
          ],
        },
      ],
    },
    returns: {
      title: "Returns and Complaints",
      description:
        "Return and complaint handling for orders placed through the Garçonmaires store.",
      eyebrow: "Returns and Complaints",
      intro:
        "This is draft launch content. It must be completed with final seller, return address, and complaint contact details before public sales.",
      sections: [
        enLegalPendingSection,
        {
          title: "Launch placeholders",
          bullets: [
            "Return address: [COMPLETE BEFORE LAUNCH].",
            "Complaint contact: [COMPLETE BEFORE LAUNCH].",
            "Withdrawal form details: [COMPLETE BEFORE LAUNCH].",
            "Complaint response rules: [LEGAL REVIEW REQUIRED].",
          ],
        },
        {
          title: "Return window",
          bullets: [
            "Customers have 14 days from delivery to notify the brand about a return.",
            "Returned products should be sent back without undue delay and no later than 14 days after the return notice.",
          ],
        },
        {
          title: "Condition of returned products",
          bullets: [
            "Products should be returned in a condition that does not go beyond what is necessary to assess their nature, characteristics, and function.",
            "Whenever possible, products should be returned with original packaging and all items included in the shipment.",
          ],
        },
        {
          title: "Complaints",
          bullets: [
            "Complaint requests should include the order number, problem description, and product photos when needed.",
            "This section must be aligned with final seller details and applicable Polish consumer rules before launch.",
          ],
        },
        {
          title: "How to start a return",
          bullets: [
            "Contact studio@garconmaires.com to begin the process.",
            "Include the order number and the returned item in your message.",
            "Return address details and next steps are shared by email.",
          ],
        },
      ],
    },
    payments: {
      title: "Payments",
      description:
        "Available payment methods and payment handling for Garçonmaires orders.",
      eyebrow: "Payments",
      intro:
        "Garçonmaires processes orders in Polish zloty through a Polish-market payment provider with BLIK, fast transfers and cards.",
      sections: [
        {
          title: "Available methods",
          bullets: ["BLIK", "Przelewy24", "Credit and debit cards"],
        },
        {
          title: "Currency",
          bullets: [
            "All store prices are shown in PLN.",
            "The final total, including shipping, is shown before payment is completed.",
          ],
        },
        {
          title: "Security",
          paragraphs: [
            "Payment information is handled by an external payment operator. Garçonmaires does not store customers' full card details.",
          ],
        },
      ],
    },
    faq: {
      title: "FAQ",
      description:
        "Common questions about sizing, shipping, payments, and Garçonmaires orders.",
      eyebrow: "FAQ",
      intro:
        "The key information gathered in one place to keep the shopping experience simple and clear.",
      sections: [
        {
          title: "How should I choose my size?",
          paragraphs: [
            "Use the size guide available in the store. If you still have doubts, the best option is to write to studio@garconmaires.com before placing your order.",
          ],
        },
        {
          title: "Are products limited?",
          paragraphs: [
            "Yes. Early Garçonmaires drops are produced in limited quantities, so selected sizes may move quickly.",
          ],
        },
        {
          title: "When will I receive my order?",
          paragraphs: [
            "Most domestic orders are prepared within 1-3 business days and delivered within another 1-2 business days after dispatch.",
          ],
        },
        {
          title: "How do I request a return?",
          paragraphs: [
            "To start a return, email studio@garconmaires.com with your order number and the product you want to return.",
          ],
        },
      ],
    },
    "size-guide": {
      title: "Size Guide",
      description:
        "Garçonmaires sizing guidance for t-shirts, longsleeves, and sweatshirts.",
      eyebrow: "Size Guide",
      intro:
        "The first Garçonmaires collection is built around four core silhouettes. These notes help you choose the right size before ordering.",
      sections: [
        {
          title: "General fit",
          bullets: [
            "The t-shirt has a boxy cut with a slightly dropped shoulder.",
            "The longsleeve has an easy body with a longer sleeve line.",
            "The crew sweatshirt and kangaroo hoodie carry more volume and a stronger streetwear shape.",
          ],
        },
        {
          title: "Recommendation",
          bullets: [
            "Choose your usual size if you want to keep the intended fit.",
            "If you prefer a more compact silhouette, consider sizing down depending on the piece.",
            "If unsure, contact the studio before purchasing.",
          ],
        },
        {
          title: "Available sizes",
          bullets: ["XS", "S", "M", "L", "XL"],
        },
      ],
    },
    terms: {
      title: "Terms and Conditions",
      description:
        "Core store terms and conditions for the Garçonmaires online shop.",
      eyebrow: "Terms and Conditions",
      intro:
        "This page is a working store structure and should be completed with full seller information and reviewed legally before commercial launch.",
      sections: [
        enLegalPendingSection,
        {
          title: "Seller details to complete",
          bullets: [
            "Legal seller name: [COMPLETE BEFORE LAUNCH].",
            "Tax ID / NIP: [COMPLETE BEFORE LAUNCH].",
            "REGON, if applicable: [COMPLETE BEFORE LAUNCH].",
            "Registered address: [COMPLETE BEFORE LAUNCH].",
            "Contact email and return address: [COMPLETE BEFORE LAUNCH].",
          ],
        },
        {
          title: "General provisions",
          bullets: [
            "The Garçonmaires online store is used for the sale of Garçonmaires apparel products.",
            "Customers are expected to use the store in accordance with applicable law and good practice.",
          ],
        },
        {
          title: "Orders",
          bullets: [
            "An order is placed by selecting a product, adding it to the cart, and completing payment.",
            "Order confirmation is sent electronically.",
          ],
        },
        {
          title: "Payments and delivery",
          bullets: [
            "Payment operator: Tpay / [CONFIRM FINAL OPERATOR DETAILS].",
            "Delivery operator: InPost or selected courier / [COMPLETE BEFORE LAUNCH].",
            "Delivery costs and estimated delivery times must be shown before checkout completion.",
          ],
        },
        {
          title: "Returns and complaints",
          paragraphs: [
            "Detailed return and complaint handling should remain aligned with the dedicated store policy pages and current consumer protection rules.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy Policy",
      description:
        "How personal data is processed in the Garçonmaires online store.",
      eyebrow: "Privacy Policy",
      intro:
        "This page outlines the working privacy structure. Before launch, it should be completed with full controller details and the exact legal bases for processing.",
      sections: [
        enLegalPendingSection,
        {
          title: "Controller details to complete",
          bullets: [
            "Data controller legal name: [COMPLETE BEFORE LAUNCH].",
            "Controller address: [COMPLETE BEFORE LAUNCH].",
            "Privacy contact email: [COMPLETE BEFORE LAUNCH].",
            "Legal bases and retention periods: [LEGAL REVIEW REQUIRED].",
          ],
        },
        {
          title: "What data may be collected",
          bullets: [
            "Contact information provided during checkout.",
            "Address information required for shipping.",
            "Technical information related to site usage if analytics tools are enabled.",
          ],
        },
        {
          title: "Why data is processed",
          bullets: [
            "To fulfill orders.",
            "To handle payment and shipping.",
            "To contact customers regarding an order or return.",
          ],
        },
        {
          title: "User rights",
          bullets: [
            "Right of access to personal data.",
            "Right to correct or delete data.",
            "Right to restrict processing and submit a complaint to the relevant authority.",
          ],
        },
      ],
    },
    cookies: {
      title: "Cookies Policy",
      description:
        "Information about cookies used by the Garçonmaires online store.",
      eyebrow: "Cookies Policy",
      intro:
        "The store may use cookies necessary for the site to function, as well as additional analytics or functional tools when implemented.",
      sections: [
        {
          title: "Necessary cookies",
          bullets: [
            "Keeping the shopping cart active.",
            "Ensuring the correct flow between store pages.",
          ],
        },
        {
          title: "Analytics and additional tools",
          paragraphs: [
            "If analytics or marketing tools are introduced, this cookies policy should be extended with their exact description and the user's consent controls.",
          ],
        },
      ],
    },
  },
};

export const footerGroups: Record<
  Locale,
  {
    navigation: Array<{ href: string; label: string }>;
    help: Array<{ href: string; label: string }>;
    legal: Array<{ href: string; label: string }>;
    contactHeading: string;
  }
> = {
  pl: {
    navigation: [
      { href: "/collection", label: "Kolekcja" },
      { href: "/kontakt", label: "Kontakt" },
    ],
    help: [
      { href: "/dostawa", label: "Dostawa" },
      { href: "/zwroty-i-reklamacje", label: "Zwroty i reklamacje" },
      { href: "/payments", label: "Płatności" },
      { href: "/faq", label: "FAQ" },
      { href: "/size-guide", label: "Tabela rozmiarów" },
    ],
    legal: [
      { href: "/regulamin", label: "Regulamin" },
      { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
      { href: "/cookies", label: "Polityka cookies" },
    ],
    contactHeading: "Kontakt",
  },
  en: {
    navigation: [
      { href: "/collection", label: "Collection" },
      { href: "/contact", label: "Contact" },
    ],
    help: [
      { href: "/delivery", label: "Delivery" },
      { href: "/returns-complaints", label: "Returns and Complaints" },
      { href: "/payments", label: "Payments" },
      { href: "/faq", label: "FAQ" },
      { href: "/size-guide", label: "Size Guide" },
    ],
    legal: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/cookies", label: "Cookies Policy" },
    ],
    contactHeading: "Contact",
  },
};
