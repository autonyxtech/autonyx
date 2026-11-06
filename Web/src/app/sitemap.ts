import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://autonyxtech.in/', changeFrequency: 'monthly', priority: 1 },
    { url: 'https://autonyxtech.in/contact/', changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://autonyxtech.in/privacy-policy/', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://autonyxtech.in/terms/', changeFrequency: 'yearly', priority: 0.3 },
  ];
}
