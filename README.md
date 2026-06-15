# Fixify Frontend

Angular 19 website care platform UI, structured from [Angular-BoilerPlate](https://github.com/Tanees244/Angular-BoilerPlate).

## Stack

- Angular 19 (standalone components, signals, OnPush)
- Tailwind CSS 4
- In-memory mock data (no backend required)

## Login

Visit **http://localhost:4200/auth** and choose your portal:

| Portal | Email | Password |
|--------|-------|----------|
| Customer | `sarah@acmecorp.com` | `customer123` |
| Admin | `admin@fixify.com` | `admin123` |

Customer and admin use separate login screens and route guards — each role only sees its own portal.

## Features

**Customer portal:** Dashboard, Performance, Security, SEO, Uptime, AI Insights, Tickets, Reports, Settings, **Add WordPress** flow

**Admin console:** Overview, All Websites, Customers, Tickets, Reports, Settings

## Development

```bash
npm install
npm start
```

Mock data lives in `src/app/core/data/mock-data.ts`.
