import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-config';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/about', '/faq', '/privacy', '/terms'].map(path => ({ url: `${SITE_URL}${path}`, changeFrequency: 'monthly', priority: path ? 0.4 : 1 }));
}
