# EscrowFlow

> Secure service payments through milestone-based escrow.

EscrowFlow is a web platform that protects both clients and service providers during service transactions. Funds are held securely in escrow and released progressively as milestones are completed and approved — reducing payment fraud and building trust in Nigeria's service economy.

Built for the **Nomba Hackathon 2026**.

## Features

- **Milestone-based escrow** — funds are released stage by stage as work is approved
- **Dual roles** — one account acts as both a client and a service provider
- **Dispute resolution** — pause releases and raise disputes when work stalls
- **Real-time tracking** — live dashboards for clients and providers
- **Dark / light mode** — follows system preference, with a manual toggle
- **Mobile responsive** — built to work across phone and desktop

## Tech Stack

- [Vite](https://vite.dev) + [React](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) (CSS-first config)
- [React Router](https://reactrouter.com)
- [Lucide](https://lucide.dev) icons

## Getting Started

Requires **Node.js 20.19+** (or 22.12+).

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# build for production
npm run build
```

The dev server runs at http://localhost:5173.

## Project Structure

```
src/
├── main.tsx            # entry — wraps <App/> in <BrowserRouter>
├── App.tsx             # route definitions
├── index.css           # Tailwind config + theme tokens
├── data/
│   └── content.ts      # page copy + shared types
├── hooks/
│   └── useTheme.ts      # dark / light mode logic
├── components/         # Navbar, Hero, Features, Pricing, FAQ, etc.
└── pages/
    └── LandingPage.tsx  # composes the landing page
```

## Roadmap

- [ ] Authentication with client / provider roles
- [ ] Project creation and milestone setup
- [ ] Dedicated project funding
- [ ] Escrow tracking and automatic milestone release
- [ ] Client and provider dashboards
- [ ] Notifications

## Team
Built by **Escrowflow** for the Nomba Hackathon 2026.