export const homepageSeo = {
  pl: {
    title: "Garçonmaires | Polska marka streetwearowa z Warszawy",
    description:
      "Garçonmaires to polska marka budowana wokół czerni, prostego kroju i mocnego znaku. DROP 01 zaczyna się od języka, atmosfery i krótkiej serii.",
    keywords: [
      "Garçonmaires",
      "Garconmaires",
      "polska marka odzieżowa",
      "polski streetwear",
      "streetwear Warszawa",
      "czarna garderoba",
      "DROP 01",
      "moda Warszawa",
    ],
  },
  en: {
    title: "Garçonmaires | Polish streetwear from Warsaw",
    description:
      "Garçonmaires is a Polish fashion brand built around black, clean cuts, and a strong graphic mark. DROP 01 begins with language, atmosphere, and a short run.",
    keywords: [
      "Garçonmaires",
      "Garconmaires",
      "Polish fashion brand",
      "Polish streetwear",
      "Warsaw streetwear",
      "black wardrobe",
      "DROP 01",
      "Warsaw fashion",
    ],
  },
} as const;

export const homepageSeoTitle = homepageSeo.en.title;
export const homepageSeoDescription = homepageSeo.en.description;
export const homepageSeoKeywords = homepageSeo.en.keywords;

export const homepageOgImage = "/brand/about-post-ig.png";

export const homepageStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Garçonmaires",
      alternateName: "Garconmaires",
      url: "https://garconmaires.com",
      logo: "https://garconmaires.com/logo.png",
      sameAs: ["https://www.instagram.com/garconmaires"],
    },
    {
      "@type": "WebSite",
      name: "Garçonmaires",
      alternateName: "Garconmaires",
      url: "https://garconmaires.com",
    },
  ],
};
