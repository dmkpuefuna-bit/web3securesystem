/*
# Create All Tables for Web3 Asset Management Platform

Creates all database tables. RLS enabled on all tables.
Policies are added in a separate migration after all tables exist.

Note: chain_id is nullable to support non-EVM chains (Solana, Bitcoin) which don't have an EVM chain_id.
*/

-- ============================================================
-- ROLES & PERMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  username text UNIQUE,
  avatar_url text,
  bio text,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  two_factor_enabled boolean NOT NULL DEFAULT false,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- ============================================================
-- BLOCKCHAINS
-- ============================================================

CREATE TABLE IF NOT EXISTS blockchains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  chain_id int UNIQUE,
  slug text UNIQUE NOT NULL,
  symbol text NOT NULL,
  logo_url text,
  rpc_url text,
  explorer_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_testnet boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE blockchains ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- WALLETS
-- ============================================================

CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  address text NOT NULL,
  chain_id int REFERENCES blockchains(chain_id) ON DELETE SET NULL,
  blockchain_id uuid REFERENCES blockchains(id) ON DELETE SET NULL,
  provider text NOT NULL,
  label text,
  ens_name text,
  is_primary boolean NOT NULL DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, address)
);
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);

-- ============================================================
-- CRYPTO ASSETS
-- ============================================================

CREATE TABLE IF NOT EXISTS crypto_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coingecko_id text UNIQUE NOT NULL,
  symbol text NOT NULL,
  name text NOT NULL,
  logo_url text,
  contract_address text,
  chain_id int,
  blockchain_id uuid REFERENCES blockchains(id) ON DELETE SET NULL,
  current_price numeric NOT NULL DEFAULT 0,
  market_cap numeric,
  market_cap_rank int,
  total_volume numeric,
  price_change_24h numeric,
  price_change_percentage_24h numeric,
  price_change_percentage_7d numeric,
  circulating_supply numeric,
  total_supply numeric,
  ath numeric,
  ath_change_percentage numeric,
  atl numeric,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE crypto_assets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_crypto_assets_symbol ON crypto_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_assets_coingecko ON crypto_assets(coingecko_id);

-- ============================================================
-- WALLET BALANCES
-- ============================================================

CREATE TABLE IF NOT EXISTS wallet_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES crypto_assets(id) ON DELETE SET NULL,
  balance numeric NOT NULL DEFAULT 0,
  usd_value numeric NOT NULL DEFAULT 0,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_id, asset_id)
);
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_wallet_balances_wallet_id ON wallet_balances(wallet_id);

-- ============================================================
-- USER ASSETS
-- ============================================================

CREATE TABLE IF NOT EXISTS user_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES crypto_assets(id) ON DELETE CASCADE,
  total_balance numeric NOT NULL DEFAULT 0,
  total_usd_value numeric NOT NULL DEFAULT 0,
  avg_cost_basis numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_id)
);
ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_user_assets_user_id ON user_assets(user_id);

-- ============================================================
-- NFT COLLECTIONS & NFTs
-- ============================================================

CREATE TABLE IF NOT EXISTS nft_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address text NOT NULL,
  chain_id int,
  blockchain_id uuid REFERENCES blockchains(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  image_url text,
  floor_price numeric,
  total_supply int,
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_address, chain_id)
);
ALTER TABLE nft_collections ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS nfts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES nft_collections(id) ON DELETE SET NULL,
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id text NOT NULL,
  name text,
  description text,
  image_url text,
  metadata jsonb,
  floor_price numeric,
  last_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (wallet_id, token_id)
);
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_nfts_user_id ON nfts(user_id);
CREATE INDEX IF NOT EXISTS idx_nfts_wallet_id ON nfts(wallet_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tx_hash text NOT NULL,
  chain_id int,
  blockchain_id uuid REFERENCES blockchains(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES crypto_assets(id) ON DELETE SET NULL,
  type text NOT NULL,
  direction text,
  amount numeric,
  usd_value numeric,
  fee numeric,
  status text NOT NULL DEFAULT 'confirmed',
  counterparty_address text,
  block_number bigint,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);

-- ============================================================
-- STAKING
-- ============================================================

CREATE TABLE IF NOT EXISTS staking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid REFERENCES wallets(id) ON DELETE SET NULL,
  asset_id uuid REFERENCES crypto_assets(id) ON DELETE SET NULL,
  protocol text NOT NULL,
  staked_amount numeric NOT NULL DEFAULT 0,
  rewards_earned numeric NOT NULL DEFAULT 0,
  apy numeric,
  lock_until timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE staking ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_staking_user_id ON staking(user_id);

-- ============================================================
-- WATCHLISTS
-- ============================================================

CREATE TABLE IF NOT EXISTS watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Watchlist',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id uuid NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES crypto_assets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (watchlist_id, asset_id)
);
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  category text,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);

-- ============================================================
-- BLOG
-- ============================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  category text,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'published',
  featured boolean NOT NULL DEFAULT false,
  views int NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);

-- ============================================================
-- FAQ
-- ============================================================

CREATE TABLE IF NOT EXISTS faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES faq_categories(id) ON DELETE SET NULL,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TESTIMONIALS
-- ============================================================

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_role text,
  author_avatar_url text,
  content text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- NEWSLETTER
-- ============================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text NOT NULL DEFAULT 'general',
  is_public boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- ANALYTICS EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_url text,
  referrer text,
  user_agent text,
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = TG_TABLE_SCHEMA
      AND table_name = TG_TABLE_NAME
      AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'roles','profiles','blockchains','wallets','crypto_assets','wallet_balances',
    'user_assets','nft_collections','nfts','transactions','staking','watchlists',
    'support_tickets','blog_posts','faqs','testimonials','announcements',
    'newsletter_subscribers','settings','audit_logs'
  ] LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
      EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, role, status)
  VALUES (NEW.id, NEW.email, 'user', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO roles (name, description, is_system) VALUES
  ('admin', 'Full administrative access', true),
  ('user', 'Standard user access', true),
  ('moderator', 'Moderation access for support and content', true)
ON CONFLICT (name) DO NOTHING;

-- Solana and Bitcoin have NULL chain_id (non-EVM chains)
INSERT INTO blockchains (name, chain_id, slug, symbol, explorer_url, is_active, sort_order) VALUES
  ('Ethereum', 1, 'ethereum', 'ETH', 'https://etherscan.io', true, 1),
  ('Base', 8453, 'base', 'ETH', 'https://basescan.org', true, 2),
  ('Polygon', 137, 'polygon', 'MATIC', 'https://polygonscan.com', true, 3),
  ('Arbitrum', 42161, 'arbitrum', 'ETH', 'https://arbiscan.io', true, 4),
  ('Optimism', 10, 'optimism', 'ETH', 'https://optimistic.etherscan.io', true, 5),
  ('BNB Smart Chain', 56, 'bnb', 'BNB', 'https://bscscan.com', true, 6),
  ('Avalanche', 43114, 'avalanche', 'AVAX', 'https://snowtrace.io', true, 7),
  ('Solana', NULL, 'solana', 'SOL', 'https://solscan.io', true, 8),
  ('Bitcoin', NULL, 'bitcoin', 'BTC', 'https://blockchain.com', true, 9)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO settings (key, value, category, is_public) VALUES
  ('site_name', '"NexVault"', 'general', true),
  ('site_tagline', '"Enterprise Web3 Asset Management"', 'general', true),
  ('site_description', '"A professional-grade platform for managing, tracking, and analyzing your crypto portfolio across multiple blockchains."', 'general', true),
  ('primary_color', '"#3b82f6"', 'appearance', true),
  ('support_email', '"support@nexvault.io"', 'contact', true),
  ('social_links', '{"twitter":"https://twitter.com","discord":"https://discord.com","telegram":"https://telegram.com","github":"https://github.com"}', 'social', true),
  ('footer_text', '"© 2026 NexVault. All rights reserved."', 'general', true),
  ('hero_title', '"Manage Your Digital Assets with Confidence"', 'homepage', true),
  ('hero_subtitle', '"The enterprise-grade platform for tracking, analyzing, and optimizing your crypto portfolio across 9+ blockchains."', 'homepage', true)
ON CONFLICT (key) DO NOTHING;
