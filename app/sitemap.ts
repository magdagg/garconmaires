import type { MetadataRoute } from "next";
import { getPublicCatalogState } from "@/lib/store/public-catalog";

const baseUrl = "https://garconmaires.com";
const lastModified = new Date();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getPublicCatalogState();
  const productEntries: MetadataRoute.Sitemap = catalog.products.map((product) => ({
    url: `${baseUrl}/produkt/${product.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.6,
    alternates: {
      languages: {
        "pl-PL": `${baseUrl}/produkt/${product.slug}`,
        "en-US": `${baseUrl}/en/product/${product.slug}`,
      },
    },
  }));

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/`,
          "en-US": `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/kolekcja`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/kolekcja`,
          "en-US": `${baseUrl}/en/collection`,
        },
      },
    },
    {
      url: `${baseUrl}/kontakt`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/kontakt`,
          "en-US": `${baseUrl}/en/contact`,
        },
      },
    },
    {
      url: `${baseUrl}/regulamin`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/regulamin`,
          "en-US": `${baseUrl}/en/terms`,
        },
      },
    },
    {
      url: `${baseUrl}/polityka-prywatnosci`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/polityka-prywatnosci`,
          "en-US": `${baseUrl}/en/privacy-policy`,
        },
      },
    },
    {
      url: `${baseUrl}/zwroty-i-reklamacje`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/zwroty-i-reklamacje`,
          "en-US": `${baseUrl}/en/returns-complaints`,
        },
      },
    },
    {
      url: `${baseUrl}/dostawa`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/dostawa`,
          "en-US": `${baseUrl}/en/delivery`,
        },
      },
    },
    {
      url: `${baseUrl}/en`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/`,
          "en-US": `${baseUrl}/en`,
        },
      },
    },
    {
      url: `${baseUrl}/en/collection`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/kolekcja`,
          "en-US": `${baseUrl}/en/collection`,
        },
      },
    },
    {
      url: `${baseUrl}/en/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/kontakt`,
          "en-US": `${baseUrl}/en/contact`,
        },
      },
    },
    ...productEntries,
  ];
}
