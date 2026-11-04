import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/wallet/', '/profile/', '/my-bets/'],
    },
    sitemap: 'https://www.riggedwin.site/sitemap.xml',
  }
}