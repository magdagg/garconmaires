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
  title: "Status: do uzupełnienia przed publicznym checkoutem",
  bullets: [
    "To jest robocza wersja informacji prawnych dla preview/staging.",
    "Pierwszy drop jest planowany w modelu działalności nierejestrowanej; dane sprzedawcy, dane podatkowe, adres sprzedawcy i adres zwrotów są nadal do potwierdzenia przed publiczną sprzedażą.",
    "Do czasu finalnego review prawnego checkout pozostaje zablokowany, a strona nie publikuje zatwierdzonych danych sprzedawcy.",
  ],
};

const enLegalPendingSection: InfoSection = {
  title: "Status: to be completed before public checkout",
  bullets: [
    "This is a draft legal information set for preview/staging.",
    "The first drop is planned under Polish działalność nierejestrowana / unregistered activity; seller details, tax details, seller address and return address must still be confirmed before public sales.",
    "Until final legal review is completed, checkout remains blocked and the site does not publish approved seller details.",
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
        "Pierwszy drop Garçonmaires będzie realizowany manualnie, z wysyłką organizowaną po potwierdzeniu płatności. Finalne warunki dostawy zostaną uzupełnione przed publicznym checkoutem.",
      sections: [
        plLegalPendingSection,
        {
          title: "Model wysyłki na pierwszy drop",
          bullets: [
            "Planowany model dostawy na pierwszy drop: InPost Paczkomat oraz InPost Kurier, z obsługą manualną lub półmanualną.",
            "Finalny czas wysyłki, koszt dostawy i próg darmowej dostawy są do potwierdzenia przed publicznym checkoutem.",
            "W preview/staging nie należy traktować tych informacji jako finalnej oferty sprzedaży.",
          ],
        },
        {
          title: "Czas realizacji",
          bullets: [
            "Szacowany czas przygotowania paczki: 2-5 dni roboczych.",
            "Po nadaniu przesyłki klient otrzyma e-mail z informacją o wysyłce i numerem śledzenia, jeśli będzie dostępny.",
            "W czasie pierwszego dropu wysyłka może być realizowana partiami, zgodnie z finalnym komunikatem przy checkoutcie.",
          ],
        },
        {
          title: "Dostawa na terenie Polski",
          bullets: [
            "Na pierwszy drop sklep jest przygotowywany przede wszystkim pod wysyłkę na terenie Polski.",
            "Koszt dostawy i przewidywany czas wysyłki muszą być widoczne przed opłaceniem zamówienia.",
            "Dostawa międzynarodowa wymaga osobnej decyzji i nie jest zakładana jako domyślny model pierwszego dropu.",
          ],
        },
        {
          title: "Dane wymagane przed startem",
          bullets: [
            "Kontakt do obsługi dostaw: do potwierdzenia przed publicznym checkoutem.",
            "Kontakt do zwrotów i reklamacji: do potwierdzenia przed publicznym checkoutem.",
            "Adres do zwrotów: do uzupełnienia po potwierdzeniu danych sprzedawcy.",
          ],
        },
        {
          title: "Wysyłka międzynarodowa",
          paragraphs: [
            "Wysyłka poza Polskę nie jest domyślnym założeniem pierwszego dropu. Jeśli zostanie uruchomiona, jej koszt, czas i zakres krajów wymagają osobnej informacji przed złożeniem zamówienia.",
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
        "Zwroty i reklamacje dla pierwszego dropu są opisane roboczo. Finalne dane sprzedawcy, adres zwrotów i procedura wymagają potwierdzenia przed publicznym checkoutem.",
      sections: [
        plLegalPendingSection,
        {
          title: "Dane sprzedawcy i kontakt",
          bullets: [
            "Sprzedawca: do uzupełnienia po potwierdzeniu formy sprzedaży.",
            "Adres sprzedawcy: do uzupełnienia po potwierdzeniu danych sprzedawcy.",
            "Adres do zwrotów: do uzupełnienia przed publicznym checkoutem.",
            "Kontakt w sprawie zwrotów i reklamacji: do potwierdzenia przed publicznym checkoutem.",
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
            "Reklamację można zgłosić mailowo na studio@garconmaires.com, podając numer zamówienia, opis problemu i zdjęcia produktu, jeśli są potrzebne do oceny zgłoszenia.",
            "Odpowiedź na reklamację zostanie udzielona w terminie zgodnym z obowiązującymi przepisami po otrzymaniu kompletnego zgłoszenia.",
          ],
        },
        {
          title: "Proces zwrotu",
          bullets: [
            "Aby rozpocząć zwrot po publicznym uruchomieniu sprzedaży, użyj kanału kontaktu podanego w finalnej polityce zwrotów.",
            "W wiadomości podaj numer zamówienia i produkt, który chcesz zwrócić.",
            "Adres zwrotu zostanie podany dopiero po potwierdzeniu danych sprzedawcy i finalnym review prawnym.",
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
        "Płatności dla pierwszego dropu Garçonmaires są przygotowywane przez operatora Tpay. Konkretne metody płatności zostaną wymienione po finalnym potwierdzeniu konfiguracji operatora.",
      sections: [
        plLegalPendingSection,
        {
          title: "Operator płatności",
          bullets: [
            "Operator płatności: Tpay.",
            "Aktywne metody płatności: do potwierdzenia po finalnej konfiguracji Tpay.",
            "Płatność będzie możliwa dopiero po osobnym public launch pass i odblokowaniu checkoutu.",
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
            "Dane płatnicze obsługuje Tpay jako zewnętrzny operator płatności. Garçonmaires nie przechowuje pełnych danych kart płatniczych.",
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
        plLegalPendingSection,
        {
          title: "Kto sprzedaje produkty Garçonmaires?",
          paragraphs: [
            "Pierwszy drop jest planowany w modelu działalności nierejestrowanej. Dane sprzedawcy, kontakt i adresy są nadal pending i zostaną opublikowane dopiero po potwierdzeniu danych prawnych, przed publicznym checkoutem.",
          ],
        },
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
            "Finalny czas wysyłki, koszt dostawy i próg darmowej dostawy są do potwierdzenia przed publicznym checkoutem.",
          ],
        },
        {
          title: "Jak zgłosić zwrot?",
          paragraphs: [
            "Finalny kanał kontaktu oraz adres zwrotów zostaną uzupełnione po potwierdzeniu danych sprzedawcy. W preview/staging zwroty pozostają opisem roboczym.",
          ],
        },
        {
          title: "Jakie metody płatności będą dostępne?",
          paragraphs: [
            "Płatności będą obsługiwane przez Tpay, ale aktywne metody zostaną podane dopiero po finalnym potwierdzeniu konfiguracji operatora.",
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
        "Regulamin jest roboczą wersją zasad pierwszego dropu Garçonmaires. Przed publicznym checkoutem wymaga uzupełnienia realnych danych sprzedawcy, decyzji o formie sprzedaży i finalnego review prawnego.",
      sections: [
        plLegalPendingSection,
        {
          title: "Sprzedawca",
          bullets: [
            "Sprzedawca: do uzupełnienia po potwierdzeniu formy sprzedaży.",
            "Forma sprzedaży: działalność nierejestrowana planowana dla pierwszego dropu.",
            "Adres sprzedawcy: do uzupełnienia po potwierdzeniu danych sprzedawcy.",
            "E-mail kontaktowy: do potwierdzenia przed publicznym checkoutem.",
            "E-mail reklamacje/zwroty: do potwierdzenia przed publicznym checkoutem.",
            "Adres do zwrotów: do uzupełnienia po potwierdzeniu danych sprzedawcy.",
            "NIP/REGON: do uzupełnienia, jeśli będzie wymagane dla wybranej formy sprzedaży.",
            "Wersja dokumentów: do uzupełnienia po finalnym review prawnym.",
          ],
        },
        {
          title: "Postanowienia ogólne",
          bullets: [
            "Sklep internetowy Garçonmaires służy do sprzedaży produktów marki Garçonmaires w ramach limitowanego pierwszego dropu.",
            "Korzystając ze sklepu, klient powinien działać zgodnie z prawem i dobrymi obyczajami.",
            "Sprzedaż będzie uruchomiona dopiero po osobnym public launch pass; do tego czasu checkout pozostaje zablokowany.",
          ],
        },
        {
          title: "Zamówienia",
          bullets: [
            "Zamówienie składasz przez wybór produktu, dodanie go do koszyka i opłacenie zamówienia.",
            "Potwierdzenie przyjęcia zamówienia wysyłamy mailowo.",
            "Sprzedawca może kontaktować się z klientem pod adresem e-mail podanym przy zamówieniu, jeśli będzie to potrzebne do realizacji zamówienia, płatności, wysyłki, zwrotu lub reklamacji.",
          ],
        },
        {
          title: "Płatności i dostawa",
          bullets: [
            "Operator płatności: Tpay.",
            "Aktywne metody płatności: do potwierdzenia po finalnej konfiguracji Tpay.",
            "Model dostawy pierwszego dropu: do potwierdzenia przed publicznym checkoutem.",
            "Cena dostawy: do potwierdzenia przed publicznym checkoutem.",
            "Próg darmowej dostawy: do potwierdzenia przed publicznym checkoutem.",
            "Szacowany czas wysyłki: do potwierdzenia przed publicznym checkoutem.",
            "Koszt dostawy i przewidywany czas doręczenia powinny być widoczne przed złożeniem zamówienia.",
          ],
        },
        {
          title: "Zwroty i reklamacje",
          paragraphs: [
            "Szczegółowe zasady zwrotów i reklamacji są opisane na osobnej stronie. Przed publicznym checkoutem powinny zostać sprawdzone prawnie i spójne z finalnymi danymi sprzedawcy.",
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
        "Polityka prywatności jest roboczym opisem przetwarzania danych dla pierwszego dropu Garçonmaires. Finalny administrator danych i dane kontaktowe wymagają potwierdzenia przed publicznym checkoutem.",
      sections: [
        plLegalPendingSection,
        {
          title: "Administrator danych",
          bullets: [
            "Administrator danych: do uzupełnienia po potwierdzeniu formy sprzedaży.",
            "Adres administratora: do uzupełnienia po potwierdzeniu danych sprzedawcy.",
            "Kontakt w sprawie danych osobowych: do potwierdzenia przed publicznym checkoutem.",
            "Wersja dokumentów: do uzupełnienia po finalnym review prawnym.",
          ],
        },
        {
          title: "Jakie dane są zbierane",
          bullets: [
            "Dane kontaktowe podawane przy składaniu zamówienia.",
            "Dane adresowe potrzebne do wysyłki.",
            "Dane potrzebne do obsługi płatności przez Tpay.",
            "Informacje techniczne niezbędne do działania strony, koszyka i bezpieczeństwa sesji.",
          ],
        },
        {
          title: "Cel przetwarzania",
          bullets: [
            "Realizacja zamówienia.",
            "Obsługa płatności, wysyłki i zwrotów.",
            "Kontakt z klientem w sprawie zamówienia.",
            "Obsługa reklamacji i obowiązków prawnych sprzedawcy.",
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
        {
          title: "Analityka i marketing",
          paragraphs: [
            "Na tym etapie strona nie deklaruje działania zewnętrznych narzędzi analitycznych ani marketingowych. Jeśli zostaną wdrożone, polityka prywatności i zgoda cookies zostaną zaktualizowane przed ich uruchomieniem.",
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
        "Na etapie pierwszego dropu strona korzysta z cookies niezbędnych do działania serwisu, koszyka i zapamiętania preferencji cookies. Zewnętrzne narzędzia analityczne lub marketingowe nie są deklarowane jako aktywne.",
      sections: [
        {
          title: "Niezbędne cookies",
          bullets: [
            "Utrzymanie koszyka zakupowego.",
            "Prawidłowe działanie sesji i przechodzenia między stronami.",
            "Zapamiętanie decyzji użytkownika dotyczącej cookies.",
          ],
        },
        {
          title: "Analityka i marketing",
          paragraphs: [
            "Jeśli w przyszłości zostaną wdrożone narzędzia analityczne lub marketingowe, zostaną opisane w tej polityce i uruchomione wyłącznie zgodnie z wymaganym mechanizmem zgody.",
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
        "The first Garçonmaires drop is being prepared for manual fulfillment, with shipping arranged after payment confirmation. Final shipping terms must be completed before public checkout.",
      sections: [
        enLegalPendingSection,
        {
          title: "First drop fulfillment model",
          bullets: [
            "Planned first-drop delivery model: InPost Parcel Locker and InPost Courier, handled manually or semi-manually.",
            "Final dispatch timing, delivery cost and free-shipping threshold must be confirmed before public checkout.",
            "Preview/staging information should not be treated as a final public sales offer.",
          ],
        },
        {
          title: "Processing time",
          bullets: [
            "Estimated dispatch time: 2-5 business days.",
            "After dispatch, the customer receives a shipping email with tracking details when available.",
            "During the first drop, orders may be dispatched in batches according to the final checkout communication.",
          ],
        },
        {
          title: "Delivery within Poland",
          bullets: [
            "The first drop is primarily prepared for delivery within Poland.",
            "Shipping cost and estimated dispatch timing must be visible before payment.",
            "International shipping is not assumed as the default first-drop model and requires a separate decision.",
          ],
        },
        {
          title: "Details required before launch",
          bullets: [
            "Shipping support contact: to be confirmed before public checkout.",
            "Returns and complaints contact: to be confirmed before public checkout.",
            "Return address: to be completed after seller details are confirmed.",
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
        "Returns and complaints for the first Garçonmaires drop are described as a draft. Final seller details, return address and procedure must be confirmed before public checkout.",
      sections: [
        enLegalPendingSection,
        {
          title: "Seller and contact details",
          bullets: [
            "Seller: to be completed after the sales model is confirmed.",
            "Seller address: to be completed after seller details are confirmed.",
            "Return address: to be completed before public checkout.",
            "Returns and complaints contact: to be confirmed before public checkout.",
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
            "Complaint requests should be sent to studio@garconmaires.com and include the order number, problem description, and product photos when needed.",
            "The response will be provided within the timeframe required by applicable law after the complete complaint request is received.",
          ],
        },
        {
          title: "How to start a return",
          bullets: [
            "After public sales are launched, use the contact channel listed in the final returns policy.",
            "Include the order number and the returned item in your message.",
            "The return address will be published only after seller details and final legal review are complete.",
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
        "Payments for the first Garçonmaires drop are being prepared through Tpay. Specific active payment methods will be listed after the final operator configuration is confirmed.",
      sections: [
        enLegalPendingSection,
        {
          title: "Payment operator",
          bullets: [
            "Payment operator: Tpay.",
            "Active payment methods: to be confirmed after final Tpay configuration.",
            "Payments will become available only after a separate public launch pass and checkout unlock.",
          ],
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
            "Payment information is handled by Tpay as an external payment operator. Garçonmaires does not store customers' full card details.",
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
        enLegalPendingSection,
        {
          title: "Who sells Garçonmaires products?",
          paragraphs: [
            "The first drop is planned under Polish działalność nierejestrowana / unregistered activity. Seller details, contact and addresses are still pending and will be published only after legal confirmation, before public checkout.",
          ],
        },
        {
          title: "How should I choose my size?",
          paragraphs: [
            "Use the size guide available in the store. If you still have doubts, write to studio@garconmaires.com before placing your order.",
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
            "Final dispatch timing, delivery cost and free-shipping threshold must be confirmed before public checkout.",
          ],
        },
        {
          title: "How do I request a return?",
          paragraphs: [
            "The final contact channel and return address will be completed after seller details are confirmed. In preview/staging, returns remain a draft policy.",
          ],
        },
        {
          title: "Which payment methods will be available?",
          paragraphs: [
            "Payments will be handled by Tpay, but active payment methods will be listed only after the final operator configuration is confirmed.",
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
        "These terms are a draft for the first Garçonmaires drop. Final seller details, the sales model decision and legal review are required before public checkout.",
      sections: [
        enLegalPendingSection,
        {
          title: "Seller",
          bullets: [
            "Seller: to be completed after the sales model is confirmed.",
            "Sales model: Polish działalność nierejestrowana / unregistered activity planned for the first drop.",
            "Seller address: to be completed after seller details are confirmed.",
            "Contact email: to be confirmed before public checkout.",
            "Returns and complaints email: to be confirmed before public checkout.",
            "Return address: to be completed after seller details are confirmed.",
            "NIP/REGON: to be completed if required for the selected sales model.",
            "Document version: to be completed after final legal review.",
          ],
        },
        {
          title: "General provisions",
          bullets: [
            "The Garçonmaires online store is used for the sale of Garçonmaires products within a limited first drop.",
            "Customers are expected to use the store in accordance with applicable law and good practice.",
            "Sales will be opened only after a separate public launch pass; until then checkout remains blocked.",
          ],
        },
        {
          title: "Orders",
          bullets: [
            "An order is placed by selecting a product, adding it to the cart, and completing payment.",
            "Order confirmation is sent electronically.",
            "The seller may contact the customer using the order email address when needed to handle the order, payment, shipping, return, or complaint.",
          ],
        },
        {
          title: "Payments and delivery",
          bullets: [
            "Payment operator: Tpay.",
            "Active payment methods: to be confirmed after final Tpay configuration.",
            "First-drop delivery model: to be confirmed before public checkout.",
            "Delivery price: to be confirmed before public checkout.",
            "Free shipping threshold: to be confirmed before public checkout.",
            "Estimated dispatch time: to be confirmed before public checkout.",
            "Delivery costs and estimated delivery times must be shown before checkout completion.",
          ],
        },
        {
          title: "Returns and complaints",
          paragraphs: [
            "Detailed return and complaint handling is described on the dedicated policy page. Before public checkout, it should be legally reviewed and aligned with the final seller details.",
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
        "This policy is a draft description of personal data processing for the first Garçonmaires drop. The final data controller and contact details must be confirmed before public checkout.",
      sections: [
        enLegalPendingSection,
        {
          title: "Data controller",
          bullets: [
            "Data controller: to be completed after the sales model is confirmed.",
            "Controller address: to be completed after seller details are confirmed.",
            "Privacy contact email: to be confirmed before public checkout.",
            "Document version: to be completed after final legal review.",
          ],
        },
        {
          title: "What data may be collected",
          bullets: [
            "Contact information provided during checkout.",
            "Address information required for shipping.",
            "Data required to handle payment through Tpay.",
            "Technical information necessary for site operation, cart handling, and session security.",
          ],
        },
        {
          title: "Why data is processed",
          bullets: [
            "To fulfill orders.",
            "To handle payment and shipping.",
            "To contact customers regarding an order or return.",
            "To handle complaints and the seller's legal obligations.",
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
        {
          title: "Analytics and marketing",
          paragraphs: [
            "At this stage, the site does not declare active external analytics or marketing tools. If such tools are introduced, this privacy policy and the cookie consent mechanism will be updated before activation.",
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
        "At the first-drop stage, the site uses cookies necessary for site operation, cart handling, and remembering cookie preferences. External analytics or marketing tools are not declared as active.",
      sections: [
        {
          title: "Necessary cookies",
          bullets: [
            "Keeping the shopping cart active.",
            "Ensuring the correct flow between store pages.",
            "Remembering the user's cookie preference decision.",
          ],
        },
        {
          title: "Analytics and additional tools",
          paragraphs: [
            "If analytics or marketing tools are introduced in the future, they will be described in this policy and activated only according to the required consent mechanism.",
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
