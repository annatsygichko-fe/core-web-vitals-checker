# CoreVitals — Core Web Vitals Checker
Live demo: https://core-web-vitals-checker-six.vercel.app/

A web app that analyzes any public website with the **Google PageSpeed Insights API** and turns the results into a clear report: Core Web Vitals, performance score, SEO and accessibility audits, and prioritized recommendations.

## Features

- **Real data** from PageSpeed Insights API v5: Lighthouse lab data plus Chrome UX Report field data when available
- **Core Web Vitals**: LCP, INP, CLS, plus FCP, TTFB and TBT with official good / poor thresholds
- **Desktop and mobile** results from parallel requests
- **SEO and accessibility audits** with status filters and expandable fixing guidance
- **Priority recommendations** sorted by potential time savings
- **Analysis history** stored in `localStorage`, with a performance trend chart per website
- **Ukrainian / English** interface; Lighthouse texts are requested in the selected language
- **Light / dark theme**, responsive layout, keyboard navigation, `prefers-reduced-motion` support
- Error handling for unreachable pages, API quota limits, network errors, timeouts and cancellation (`AbortController`)
- Print-friendly report (Export PDF)

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · CSS custom properties · PageSpeed Insights REST API

## Getting started

Requirements: Node.js 20+.

```bash
npm install
npm run dev
```

The app opens at http://localhost:5173.

### API key (recommended)

The app works without a key, but anonymous requests share a small quota and often hit the limit.

1. Create a key in Google Cloud Console and enable **PageSpeed Insights API** ([guide](https://developers.google.com/speed/docs/insights/v5/get-started#APIKey)).
2. Copy `.env.example` to `.env` and paste the key:

   ```
   VITE_PSI_API_KEY=your-key
   ```

3. Restart `npm run dev`.

The key is used in the browser, so restrict it in Google Cloud Console: **API restrictions** → PageSpeed Insights API only, **Website restrictions** → your domains (for example `localhost:5173/*` and `your-app.vercel.app/*`).

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the dev server                |
| `npm run build`   | Type-check and build to `dist/`     |
| `npm run preview` | Preview the production build        |

## Project structure

```
src/
├── api/pagespeed.ts      # API request, response types, error classification
├── lib/
│   ├── report.ts         # Maps the raw API response to the app's report model
│   ├── metrics.ts        # Thresholds, statuses and value formatting
│   └── history.ts        # localStorage history and preferences
├── i18n/copy.ts          # UK / EN interface texts
├── components/           # Icon, ScoreRing, MetricCard, Sparkline, StatusBadge…
├── views/                # Landing, Dashboard, Performance, Audit, History, Loading
├── types.ts
├── App.tsx               # App state and analysis flow
└── index.css             # Design tokens and styles
```

## Deployment

Any static hosting works. On **Vercel** or **Netlify**: import the GitHub repository, keep the defaults (build command `npm run build`, output `dist`), and add `VITE_PSI_API_KEY` in the environment variables.

## Ideas for next steps

- Move the API key to a serverless function so it never reaches the browser
- Unit tests for `lib/report.ts` with recorded API responses (Vitest)
- Compare two websites side by side
- React Native version of the report
