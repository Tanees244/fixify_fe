import { Platform } from '../models/fixify.models';

export const PLATFORMS: Platform[] = [
  { id: 'wordpress', label: 'WordPress', color: '#3858e9', bg: '#eef0fd', desc: 'Plugins, themes, WP core updates & WP health checks' },
  { id: 'shopify', label: 'Shopify', color: '#96bf48', bg: '#f0f7e6', desc: 'App monitoring, theme checks & storefront performance' },
  { id: 'wix', label: 'Wix', color: '#faad00', bg: '#fffbe6', desc: 'Site health, performance, SEO & uptime monitoring' },
  { id: 'squarespace', label: 'Squarespace', color: '#111', bg: '#f2f2f2', desc: 'Performance, SEO signals & uptime checks' },
  { id: 'webflow', label: 'Webflow', color: '#4353ff', bg: '#eef0ff', desc: 'CMS performance, publish health & interaction audits' },
  { id: 'magento', label: 'Magento', color: '#f46f25', bg: '#fff4ee', desc: 'Extension security, server health & storefront speed' },
  { id: 'custom', label: 'Custom / Other', color: '#6b88ad', bg: '#e2efff', desc: 'Performance, security headers, uptime & SEO' },
];

export const AI_SUGGESTIONS = [
  'Why is my LCP high?',
  'Top 3 quick wins',
  'Security risks summary',
  'Compare my 4 sites',
];

export const AI_RESPONSES: Record<string, string> = {
  'Why is my LCP high?':
    'Your LCP (Largest Contentful Paint) is high primarily due to two issues: (1) Your hero image on the homepage is 2.3MB and not using next-gen formats like WebP/AVIF. Converting it could save ~1.8MB. (2) There are 3 render-blocking scripts in <head> delaying paint by ~0.9s. I recommend deferring non-critical JS and enabling lazy loading. Estimated improvement: LCP from 3.2s → 1.6s.',
  'Top 3 quick wins':
    'Here are your top 3 highest-impact, lowest-effort fixes:\n\n1. Compress & convert hero images to WebP — saves 1.8MB, improves LCP by ~1.6s (1 hour)\n2. Add meta descriptions to 3 missing pages — improves CTR by ~18% (15 min)\n3. Update WordPress core to 6.5.4 — patches 3 security vulnerabilities (5 min)\n\nCombined, these could raise your overall health score from 67 to 84.',
  'Security risks summary':
    'Critical: WooCommerce SQL injection (CVE-2024-4823) on shopfront.co — update immediately.\nHigh: jQuery 1.12.4 XSS vulnerability — update to 3.7.1.\nHigh: SSL cert on techblog.io expires in 14 days — renew now.\nMedium: X-Frame-Options header missing on 2 sites.\nMedium: Content Security Policy not configured.\n\nOverall security posture: 72/100. 3 sites need immediate attention.',
  'Compare my 4 sites':
    'Site Health Comparison:\n\n🟢 myblog.net — 96/100 — Excellent, no issues\n🟢 acme.com — 91/100 — Good, 2 minor issues\n🟡 acmeshop.com — 78/100 — 5 issues need attention\n🔴 shopfront.co — 43/100 — Critical, 14 issues, needs immediate action\n\nFocus: shopfront.co requires urgent attention. Performance (38) and Security (55) are both below acceptable thresholds.',
};

export const PROCESS_ACTIONS = [
  'Update WordPress plugins',
  'Update WordPress core',
  'Run security scan',
  'Check SSL certificate',
  'Generate performance report',
  'Clear website cache',
  'Run Lighthouse audit',
  'Check uptime endpoints',
  'Backup website files',
  'Send health report email',
  'Check for malware',
  'Monitor Core Web Vitals',
];

export const CUSTOMER_NAV = [
  { id: 'dashboard', icon: 'dash', label: 'Dashboard' },
  { id: 'performance', icon: 'zap', label: 'Performance' },
  { id: 'security', icon: 'shield', label: 'Security', count: '2', countClass: 'r' },
  { id: 'seo', icon: 'search', label: 'SEO' },
  { id: 'uptime', icon: 'activity', label: 'Uptime' },
  { id: 'ai', icon: 'sparkles', label: 'AI Insights', count: '5', countClass: 'p' },
  { id: 'tickets', icon: 'clip', label: 'Tickets', count: '7', countClass: 'r' },
  { id: 'reports', icon: 'file', label: 'Reports' },
  { id: 'settings', icon: 'cog', label: 'Settings' },
];

export const ADMIN_NAV = [
  { id: 'admin-dash', icon: 'dash', label: 'Overview' },
  { id: 'admin-sites', icon: 'globe', label: 'All Websites' },
  { id: 'admin-users', icon: 'users', label: 'Customers' },
  { id: 'admin-subs', icon: 'layers', label: 'Subscriptions' },
  { id: 'admin-tickets', icon: 'clip', label: 'All Tickets' },
  { id: 'admin-reports', icon: 'file', label: 'Reports' },
  { id: 'admin-settings', icon: 'cog', label: 'Settings' },
];

export const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  performance: 'Performance',
  security: 'Security',
  seo: 'SEO',
  uptime: 'Uptime & Availability',
  ai: 'AI Insights',
  tickets: 'Tickets',
  reports: 'Reports',
  settings: 'Settings',
  'admin-dash': 'Admin Overview',
  'admin-sites': 'All Websites',
  'admin-users': 'Customers',
  'admin-subs': 'Subscriptions',
  'admin-onboard': 'Onboard Customer',
  'admin-tickets': 'All Tickets',
  'admin-reports': 'Reports',
  'admin-settings': 'Admin Settings',
};
