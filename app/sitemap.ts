import type { MetadataRoute } from "next";

const baseUrl = "https://garconmaires.com";
const lastModified = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
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
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: {
          "pl-PL": `${baseUrl}/contact`,
          "en-US": `${baseUrl}/en/contact`,
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
          "pl-PL": `${baseUrl}/contact`,
          "en-US": `${baseUrl}/en/contact`,
        },
      },
    },
  ];
}
