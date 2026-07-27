import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Wallet, TrendingUp, Zap, Globe, Lock, ArrowRight,
  LineChart, Layers, Star, ChevronDown, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/auth-store';
import { fetchMarketData, fetchGlobalStats } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';
import type { CoinGeckoMarket } from '@/lib/types';

const supportedNetworks = [
  { name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { name: 'Base', symbol: 'BASE', color: '#0052FF' },
  { name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
  { name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0' },
  { name: 'Optimism', symbol: 'OP', color: '#FF0420' },
  { name: 'BNB Chain', symbol: 'BNB', color: '#F0B90B' },
  { name: 'Avalanche', symbol: 'AVAX', color: '#E84142' },
  { name: 'Solana', symbol: 'SOL', color: '#14F195' },
  { name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
];

const features = [
  {
    icon: Wallet,
    title: 'Multi-Wallet Management',
    description: 'Connect and manage wallets across 9+ blockchains from a single unified dashboard.',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Portfolio Tracking',
    description: 'Live price feeds powered by CoinGecko with automatic balance synchronization.',
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'Row-level security, JWT authentication, and audit logs keep your data protected.',
  },
  {
    icon: Layers,
    title: 'NFT Portfolio',
    description: 'Track your NFT collections with floor prices, metadata, and collection analytics.',
  },
  {
    icon: LineChart,
    title: 'Advanced Analytics',
    description: 'Deep insights into asset performance, allocation, and historical trends.',
  },
  {
    icon: Zap,
    title: 'Staking Rewards',
    description: 'Monitor staking positions and rewards across multiple protocols.',
  },
];

const securityFeatures = [
  { icon: Lock, title: 'Row Level Security', description: 'Every query is scoped to your account at the database level.' },
  { icon: Shield, title: 'JWT Authentication', description: 'Secure session management with automatic token refresh.' },
  { icon: Globe, title: 'Wallet Sign-In', description: 'Authenticate with MetaMask cryptographic signatures.' },
  { icon: Star, title: 'Audit Logs', description: 'Complete audit trail of all administrative actions.' },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [marketData, setMarketData] = useState<CoinGeckoMarket[]>([]);
  const [globalStats, setGlobalStats] = useState<{
    totalMarketCap: number;
    totalVolume: number;
    marketCapChange: number;
    activeCoins: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { question: 'What is Web3SecureSystem?', answer: 'Web3SecureSystem is an enterprise-grade Web3 asset management platform that lets you track, analyze, and optimize your crypto portfolio across multiple blockchains from a single dashboard.' },
    { question: 'Which wallets are supported?', answer: 'We support MetaMask, WalletConnect, Coinbase Wallet, Trust Wallet, Rabby, and OKX Wallet. You can connect multiple wallets across different chains.' },
    { question: 'Is my data secure?', answer: 'Yes. We use Supabase Row Level Security, JWT authentication, and cryptographic wallet signatures. Your private keys never leave your wallet — we only read public on-chain data.' },
    { question: 'Which blockchains are supported?', answer: 'Ethereum, Base, Polygon, Arbitrum, Optimism, BNB Smart Chain, Avalanche, Solana, and Bitcoin (read-only). More chains are added regularly.' },
    { question: 'Do I need to pay to use Web3SecureSystem?', answer: 'Web3SecureSystem offers a free tier with full portfolio tracking. Premium features may be available in the future.' },
    { question: 'How are prices updated?', answer: 'Price data is fetched live from the CoinGecko API. Your portfolio value updates automatically as market prices change.' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const [markets, global] = await Promise.all([
          fetchMarketData(10, 1),
          fetchGlobalStats(),
        ]);
        setMarketData(markets);
        setGlobalStats({
          totalMarketCap: global.data.total_market_cap.usd,
          totalVolume: global.data.total_volume.usd,
          marketCapChange: global.data.market_cap_change_percentage_24h_usd,
          activeCoins: global.data.active_cryptocurrencies,
        });
      } catch {
        // API may rate-limit; we still render the page
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute left-1/2 top-20 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary-500/10 blur-[150px]" />
        <div className="absolute right-0 top-40 h-[300px] w-[400px] rounded-full bg-primary-700/10 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Badge variant="default" className="mb-6 px-4 py-1.5 text-sm">
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Enterprise-Grade Web3 Asset Management
            </Badge>
            <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              Manage Your Digital Assets
              <span className="block gradient-text">with Confidence</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              The enterprise-grade platform for tracking, analyzing, and
              optimizing your crypto portfolio across 9+ blockchains — all
              powered by live blockchain data.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="gradient"
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
                className="group"
              >
                {user ? 'Go to Dashboard' : 'Get Started Free'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            </div>
          </motion.div>

          {/* Global Market Stats */}
          {globalStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {[
                { label: 'Total Market Cap', value: formatCurrency(globalStats.totalMarketCap, { compact: true }) },
                { label: '24h Volume', value: formatCurrency(globalStats.totalVolume, { compact: true }) },
                { label: '24h Change', value: formatPercent(globalStats.marketCapChange), positive: globalStats.marketCapChange >= 0 },
                { label: 'Active Coins', value: formatNumber(globalStats.activeCoins, true) },
              ].map((stat) => (
                <Card key={stat.label} className="glass p-4 text-center">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`mt-1 text-lg font-bold ${stat.positive === false ? 'text-destructive' : stat.positive === true ? 'text-success' : ''}`}>
                    {stat.value}
                  </p>
                </Card>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Live Market Overview */}
      <section id="market" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Live Market Overview</h2>
            <p className="mt-2 text-muted-foreground">Real-time cryptocurrency prices powered by CoinGecko</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : marketData.length > 0 ? (
            <Card className="glass overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground">#</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground">Asset</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground">Price</th>
                      <th className="hidden px-6 py-4 text-right text-xs font-medium text-muted-foreground sm:table-cell">24h Change</th>
                      <th className="hidden px-6 py-4 text-right text-xs font-medium text-muted-foreground md:table-cell">Market Cap</th>
                      <th className="hidden px-6 py-4 text-right text-xs font-medium text-muted-foreground lg:table-cell">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.map((coin, i) => (
                      <tr key={coin.id} className="border-b border-border/50 transition-colors hover:bg-white/5">
                        <td className="px-6 py-4 text-sm text-muted-foreground">{i + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={coin.image} alt={coin.name} className="h-8 w-8 rounded-full" loading="lazy" />
                            <div>
                              <p className="font-medium">{coin.name}</p>
                              <p className="text-xs text-muted-foreground">{coin.symbol.toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(coin.current_price)}</td>
                        <td className="hidden px-6 py-4 text-right sm:table-cell">
                          <span className={coin.price_change_percentage_24h >= 0 ? 'text-success' : 'text-destructive'}>
                            {formatPercent(coin.price_change_percentage_24h)}
                          </span>
                        </td>
                        <td className="hidden px-6 py-4 text-right text-muted-foreground md:table-cell">
                          {formatCurrency(coin.market_cap, { compact: true })}
                        </td>
                        <td className="hidden px-6 py-4 text-right text-muted-foreground lg:table-cell">
                          {formatCurrency(coin.total_volume, { compact: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="glass p-12 text-center text-muted-foreground">
              Market data is temporarily unavailable. Please try again later.
            </Card>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge variant="default" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Everything You Need to Manage Your Portfolio</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              A comprehensive suite of tools for tracking, analyzing, and
              optimizing your digital assets across multiple blockchains.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass group h-full p-6 transition-all hover:border-primary/30 hover:glow">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:scale-110 group-hover:bg-primary/20">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Networks */}
      <section id="networks" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge variant="default" className="mb-4">Networks</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Supported Blockchains</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Track assets across all major blockchains from a single dashboard.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-9">
            {supportedNetworks.map((network, i) => (
              <motion.div
                key={network.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group flex flex-col items-center gap-3"
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card transition-all group-hover:scale-110 group-hover:border-primary/40"
                  style={{ boxShadow: `0 0 20px -5px ${network.color}40` }}
                >
                  <span className="text-xl font-bold" style={{ color: network.color }}>
                    {network.symbol[0]}
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{network.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="default" className="mb-4">Security</Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">Enterprise-Grade Security</h2>
              <p className="mt-4 text-muted-foreground">
                Your security is our top priority. We use industry-leading
                practices to keep your data and assets safe.
              </p>
              <div className="mt-8 space-y-6">
                {securityFeatures.map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{feature.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Card className="glass relative overflow-hidden p-8">
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-700">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">Security Status</p>
                      <p className="text-xs text-success">All systems protected</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {[
                      { label: 'Row Level Security', status: 'Active' },
                      { label: 'JWT Authentication', status: 'Active' },
                      { label: 'Audit Logging', status: 'Active' },
                      { label: 'Input Validation', status: 'Active' },
                      { label: 'CSRF Protection', status: 'Active' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <Badge variant="success">{item.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* NFT Showcase */}
      <section id="nft" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge variant="default" className="mb-4">NFTs</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Track Your NFT Portfolio</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              View your NFT collections with floor prices, metadata, and
              collection-level analytics.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Bored Ape Yacht Club', floor: '12.5 ETH', items: '10,000' },
              { name: 'Azuki', floor: '5.8 ETH', items: '10,000' },
              { name: 'Pudgy Penguins', floor: '8.2 ETH', items: '8,888' },
              { name: 'Doodles', floor: '1.4 ETH', items: '10,000' },
            ].map((nft, i) => (
              <motion.div
                key={nft.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass group overflow-hidden transition-all hover:border-primary/30">
                  <div className="aspect-square bg-gradient-to-br from-primary-500/20 via-secondary to-primary-700/20">
                    <div className="flex h-full items-center justify-center">
                      <Layers className="h-16 w-16 text-primary/40 transition-all group-hover:scale-110" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{nft.name}</h3>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Floor: <span className="text-foreground">{nft.floor}</span></span>
                      <span className="text-muted-foreground">{nft.items} items</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary-500/10 via-card to-primary-700/10 p-12 text-center"
          >
            <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full bg-primary-700/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold sm:text-4xl">Ready to Take Control of Your Portfolio?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                Join thousands of users managing their digital assets with Web3SecureSystem.
                Get started in minutes — it's free.
              </p>
              <Button
                size="lg"
                variant="gradient"
                className="mt-8 group"
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
              >
                {user ? 'Go to Dashboard' : 'Start Free Today'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge variant="default" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card key={i} className="glass overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </motion.div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card className="glass p-8 text-center">
            <h3 className="text-xl font-bold">Stay Updated</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get the latest updates on new features, supported chains, and market insights.
            </p>
            <form
              className="mx-auto mt-6 flex max-w-md gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.querySelector('input') as HTMLInputElement;
                await supabase.from('newsletter_subscribers').insert({ email: input.value });
                input.value = '';
                form.dataset.submitted = 'true';
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="h-10 w-full rounded-lg border border-input bg-secondary/50 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <Button type="submit" variant="gradient">Subscribe</Button>
            </form>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
