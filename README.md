# Web3SecureSystem — Web3 Crypto Asset Management Platform

An enterprise-grade Web3 crypto asset management platform built with React, Vite, TypeScript, and Supabase.

## Features

- **Authentication**: Email/password, Google OAuth, MetaMask wallet sign-in
- **Wallet Integration**: MetaMask, WalletConnect, Coinbase, Trust, Rabby, OKX
- **Multi-Chain Support**: Ethereum, Base, Polygon, Arbitrum, Optimism, BNB, Avalanche, Solana, Bitcoin
- **Live Market Data**: Real-time prices powered by CoinGecko API
- **Portfolio Tracking**: Token holdings, NFT collections, staking positions, transaction history
- **Watchlist**: Track assets you're interested in
- **Admin Panel**: Full CMS with user management, blog, FAQ, testimonials, announcements, settings, audit logs
- **Security**: Row Level Security, JWT auth, protected admin routes, audit logging

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Data**: CoinGecko API for live crypto prices
- **Web3**: wagmi, viem, RainbowKit, ethers.js

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

The Supabase URL and anon key are pre-configured in the environment.

## Database

The database schema is managed via Supabase migrations. All tables have Row Level Security (RLS) enabled with owner-scoped and admin-scoped policies.

### Key Tables

- `profiles` — Extended user data (linked to auth.users)
- `wallets` — Connected wallet addresses
- `crypto_assets` — Token catalog from CoinGecko
- `wallet_balances` — Token balances per wallet
- `user_assets` — Aggregated holdings per user
- `transactions` — On-chain transaction history
- `nfts` / `nft_collections` — NFT holdings
- `staking` — Staking positions
- `watchlists` / `watchlist_items` — User watchlists
- `notifications` — User notifications
- `blog_posts` / `faqs` / `testimonials` / `announcements` — CMS content
- `settings` — Site-wide configuration
- `audit_logs` — Admin action audit trail
- `analytics_events` — Platform analytics

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components (Button, Card, Input, etc.)
│   └── layout/       # Navbar, Footer, ProtectedRoute
├── lib/
│   ├── api.ts        # CoinGecko API client
│   ├── supabase.ts   # Supabase client
│   ├── types.ts      # TypeScript types
│   └── utils.ts      # Utility functions
├── store/
│   └── auth-store.ts # Zustand auth store
├── pages/
│   ├── auth/         # Login, Signup, Forgot Password
│   ├── dashboard/    # User dashboard pages
│   └── admin/        # Admin panel pages
└── App.tsx           # Router and route definitions
```

## Deployment

### Vercel

```bash
npm run build
# Deploy the dist/ folder
```

### Netlify

```bash
npm run build
# Deploy the dist/ folder
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview"]
```

## License

© 2026 Web3SecureSystem. All rights reserved.

# web3securesystem
