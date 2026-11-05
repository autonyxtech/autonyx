import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://autonyx.tech/', changeFrequency: 'monthly', priority: 1 },
    { url: 'https://autonyx.tech/contact/', changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://autonyx.tech/privacy-policy/', changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://autonyx.tech/terms/', changeFrequency: 'yearly', priority: 0.3 },
  ];
}
