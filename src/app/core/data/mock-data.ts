import {
  Customer,
  Insight,
  Process,
  Site,
  SubscriptionPlan,
  Ticket,
} from '../models/fixify.models';

export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '$0/mo',
    color: '#6b88ad',
    features: ['1 website', 'Weekly health scan', 'Basic uptime monitoring', 'Email alerts'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 10,
    priceLabel: '$10/mo',
    color: '#1d6fe0',
    features: ['Up to 3 websites', 'Daily scans', 'Security & SEO checks', 'AI insights (limited)', 'Ticket support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 20,
    priceLabel: '$20/mo',
    color: '#059669',
    features: [
      'Unlimited websites',
      'Real-time monitoring',
      'Full AI insights',
      'Priority ticket support',
      'Automated processes',
      'Monthly reports',
    ],
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@acmecorp.com',
    company: 'Acme Corp',
    plan: 'pro',
    status: 'active',
    approvalStatus: 'approved',
    joined: 'Jan 2024',
    avatar: 'SJ',
    phone: '+1 555-0101',
  },
  {
    id: 2,
    name: 'Marcus Chen',
    email: 'marcus@techblog.io',
    company: 'TechBlog Media',
    plan: 'free',
    status: 'active',
    approvalStatus: 'approved',
    joined: 'Mar 2024',
    avatar: 'MC',
    phone: '+1 555-0182',
  },
  {
    id: 3,
    name: 'Priya Sharma',
    email: 'priya@shopfront.co',
    company: 'ShopFront Inc',
    plan: 'standard',
    status: 'warning',
    approvalStatus: 'approved',
    joined: 'Feb 2024',
    avatar: 'PS',
    phone: '+1 555-0143',
  },
  {
    id: 4,
    name: 'Jordan Miles',
    email: 'jordan@myblog.net',
    company: 'Miles Digital',
    plan: 'pro',
    status: 'active',
    approvalStatus: 'approved',
    joined: 'Dec 2023',
    avatar: 'JM',
    phone: '+1 555-0167',
  },
  {
    id: 5,
    name: 'Elena Rivera',
    email: 'elena@brightleaf.io',
    company: 'BrightLeaf Studio',
    plan: 'pro',
    status: 'pending',
    approvalStatus: 'pending',
    joined: 'Jun 2025',
    avatar: 'ER',
    phone: '+1 555-0221',
  },
  {
    id: 6,
    name: 'Tom Banks',
    email: 'tom@localcafe.com',
    company: 'Local Cafe Co',
    plan: 'free',
    status: 'pending',
    approvalStatus: 'pending',
    joined: 'Jun 2025',
    avatar: 'TB',
    phone: '+1 555-0234',
  },
  {
    id: 7,
    name: 'Nina Patel',
    email: 'nina@craftworks.dev',
    company: 'CraftWorks',
    plan: 'standard',
    status: 'pending',
    approvalStatus: 'pending',
    joined: 'Jun 2025',
    avatar: 'NP',
    phone: '+1 555-0245',
  },
];

export const MOCK_SITES: Site[] = [
  { id: 1, name: 'acme.com', fa: 'A', health: 91, perf: 88, sec: 95, seo: 84, up: 99.97, st: 'ok', plan: 'Pro', issues: 2, scan: '2m ago', lcp: '1.8s', fid: '12ms', cls: '0.04', custId: 1, type: 'custom', platform: 'custom' },
  { id: 2, name: 'acmeshop.com', fa: 'AS', health: 78, perf: 74, sec: 82, seo: 71, up: 99.5, st: 'warn', plan: 'Pro', issues: 5, scan: '15m ago', lcp: '2.6s', fid: '45ms', cls: '0.12', custId: 1, type: 'cms', platform: 'shopify' },
  { id: 3, name: 'techblog.io', fa: 'T', health: 67, perf: 61, sec: 72, seo: 78, up: 98.42, st: 'warn', plan: 'Free', issues: 7, scan: '8m ago', lcp: '3.2s', fid: '87ms', cls: '0.19', custId: 2, type: 'cms', platform: 'wordpress' },
  { id: 4, name: 'shopfront.co', fa: 'S', health: 43, perf: 38, sec: 55, seo: 52, up: 97.11, st: 'bad', plan: 'Standard', issues: 14, scan: '5m ago', lcp: '5.7s', fid: '210ms', cls: '0.41', custId: 3, type: 'cms', platform: 'wordpress' },
  { id: 5, name: 'myblog.net', fa: 'M', health: 96, perf: 94, sec: 98, seo: 91, up: 100, st: 'ok', plan: 'Pro', issues: 0, scan: '1m ago', lcp: '1.2s', fid: '8ms', cls: '0.01', custId: 4, type: 'cms', platform: 'wix' },
];

export const MOCK_TICKETS: Ticket[] = [
  { id: 'FX-041', title: 'Slow page load on /checkout', site: 'shopfront.co', custId: 3, type: 'Performance', pri: 'critical', status: 'open', who: 'Alex K.', ago: '2h', desc: 'Checkout page takes 5.7s to load on mobile. Customers abandoning cart at high rate. Likely caused by unoptimized hero image and render-blocking scripts.' },
  { id: 'FX-040', title: 'Missing meta description on 3 pages', site: 'techblog.io', custId: 2, type: 'SEO', pri: 'medium', status: 'inprogress', who: 'Priya S.', ago: '5h', desc: 'Pages /blog, /about, and /contact are missing meta descriptions. This is hurting CTR in search results.' },
  { id: 'FX-039', title: 'Outdated jQuery (CVE-2024-112)', site: 'shopfront.co', custId: 3, type: 'Security', pri: 'high', status: 'open', who: 'Alex K.', ago: '1d', desc: 'jQuery 1.12.4 has a known XSS vulnerability. Needs immediate update to 3.7.1.' },
  { id: 'FX-038', title: 'SSL certificate expires in 14 days', site: 'techblog.io', custId: 2, type: 'Security', pri: 'high', status: 'inprogress', who: 'Jordan M.', ago: '2d', desc: 'SSL cert from Lets Encrypt expires on Sept 12. Auto-renew appears broken - manual renewal required.' },
  { id: 'FX-037', title: '404 errors on /old-blog links', site: 'acme.com', custId: 1, type: 'SEO', pri: 'low', status: 'resolved', who: 'Priya S.', ago: '3d', desc: '32 internal links pointing to old blog structure returning 404. Redirects have been added.' },
  { id: 'FX-036', title: 'Images missing alt attributes (8)', site: 'shopfront.co', custId: 3, type: 'SEO', pri: 'medium', status: 'testing', who: 'Jordan M.', ago: '4d', desc: '8 product images missing alt text, affecting accessibility score and SEO.' },
  { id: 'FX-035', title: 'Core Web Vitals: LCP regression', site: 'techblog.io', custId: 2, type: 'Performance', pri: 'high', status: 'open', who: 'Alex K.', ago: '5d', desc: 'LCP increased from 1.9s to 3.2s after recent WooCommerce plugin update.' },
  { id: 'FX-034', title: 'Broken contact form on /contact', site: 'acme.com', custId: 1, type: 'Bug', pri: 'high', status: 'inprogress', who: 'Sam R.', ago: '6d', desc: 'Contact form returns 500 error after submission. Email notifications not sending.' },
];

export const MOCK_INSIGHTS: Insight[] = [
  { id: 1, sev: 'critical', cat: 'Security', title: 'Plugin Vulnerability Detected', body: 'WooCommerce 8.3.1 has a known SQL injection flaw (CVE-2024-4823). Immediate update required to prevent data exposure.', site: 'shopfront.co', action: 'Update Now', time: 'Just now' },
  { id: 2, sev: 'high', cat: 'Performance', title: 'LCP Regression on /home', body: 'Largest Contentful Paint increased by 1.4s since last scan. Root cause: new hero image (2.3MB unoptimized). Recommend WebP conversion + lazy loading.', site: 'techblog.io', action: 'View Details', time: '12m ago' },
  { id: 3, sev: 'medium', cat: 'SEO', title: 'Crawl Budget Waste Detected', body: '27 low-value pages are consuming crawl budget. Adding noindex to /tag/ archives could improve indexing of core content by ~34%.', site: 'techblog.io', action: 'Review Pages', time: '1h ago' },
  { id: 4, sev: 'info', cat: 'Uptime', title: 'Response Time Improved', body: 'Average TTFB improved by 210ms following the Cloudflare cache rule update. Performance score improved by +4 points.', site: 'acme.com', action: 'See Report', time: '3h ago' },
  { id: 5, sev: 'medium', cat: 'Security', title: 'WordPress Core Out of Date', body: 'WordPress 6.3.2 installed. Latest stable is 6.5.4 — includes 3 security patches targeting XSS and privilege escalation.', site: 'shopfront.co', action: 'Schedule Update', time: '6h ago' },
];

export const MOCK_PROCESSES: Process[] = [
  { id: 1, name: 'Monthly Plugin Updates', desc: 'Automatically update all WordPress plugins on the 1st of each month', trigger: 'monthly', triggerDetail: '1st of month at 2:00 AM', sites: ['techblog.io', 'shopfront.co'], actions: ['Check plugin versions', 'Update all plugins', 'Run health check', 'Send report'], enabled: true, lastRun: 'Jun 1, 2025', nextRun: 'Jul 1, 2025', runs: 6, success: 5, custId: 1 },
  { id: 2, name: 'Weekly Security Scan', desc: 'Run a full security audit every Monday and alert on critical issues', trigger: 'weekly', triggerDetail: 'Every Monday at 4:00 AM', sites: ['acme.com', 'acmeshop.com'], actions: ['Scan for vulnerabilities', 'Check SSL expiry', 'Verify security headers', 'Alert if critical found'], enabled: true, lastRun: 'Jun 10, 2025', nextRun: 'Jun 17, 2025', runs: 24, success: 23, custId: 1 },
  { id: 3, name: 'Monthly Performance Report', desc: 'Generate and email a full performance report at month end', trigger: 'monthly', triggerDetail: 'Last day of month at 6:00 AM', sites: ['all'], actions: ['Run Lighthouse audit', 'Compile Core Web Vitals', 'Generate PDF report', 'Email to customer'], enabled: false, lastRun: 'May 31, 2025', nextRun: 'Jun 30, 2025', runs: 4, success: 4, custId: 1 },
];

export function cloneMockData<T>(data: T): T {
  return structuredClone(data);
}
