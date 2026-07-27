export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'support' | 'user';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'deleted';

export const ROLE_HIERARCHY: UserRole[] = ['super_admin', 'admin', 'moderator', 'support', 'user'];

export function hasRoleAccess(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY.indexOf(userRole) <= ROLE_HIERARCHY.indexOf(requiredRole);
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  two_factor_enabled: boolean;
  preferences: Record<string, unknown>;
  phone: string | null;
  last_login_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Blockchain {
  id: string;
  name: string;
  chain_id: number | null;
  slug: string;
  symbol: string;
  logo_url: string | null;
  rpc_url: string | null;
  explorer_url: string | null;
  is_active: boolean;
  is_testnet: boolean;
  sort_order: number;
}

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  chain_id: number | null;
  blockchain_id: string | null;
  provider: string;
  label: string | null;
  ens_name: string | null;
  is_primary: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CryptoAsset {
  id: string;
  coingecko_id: string;
  symbol: string;
  name: string;
  logo_url: string | null;
  contract_address: string | null;
  chain_id: number | null;
  blockchain_id: string | null;
  current_price: number;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  atl: number | null;
  last_updated: string;
}

export interface WalletBalance {
  id: string;
  wallet_id: string;
  asset_id: string | null;
  balance: number;
  usd_value: number;
  last_synced_at: string;
  asset?: CryptoAsset;
}

export interface UserAsset {
  id: string;
  user_id: string;
  asset_id: string;
  total_balance: number;
  total_usd_value: number;
  avg_cost_basis: number | null;
  asset?: CryptoAsset;
}

export interface NftCollection {
  id: string;
  contract_address: string;
  chain_id: number | null;
  name: string;
  description: string | null;
  image_url: string | null;
  floor_price: number | null;
  total_supply: number | null;
  external_url: string | null;
}

export interface NFT {
  id: string;
  collection_id: string | null;
  wallet_id: string | null;
  user_id: string;
  token_id: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
  metadata: Record<string, unknown> | null;
  floor_price: number | null;
  last_price: number | null;
  collection?: NftCollection;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;
  tx_hash: string;
  chain_id: number | null;
  asset_id: string | null;
  type: string;
  direction: string | null;
  amount: number | null;
  usd_value: number | null;
  fee: number | null;
  status: string;
  counterparty_address: string | null;
  block_number: number | null;
  timestamp: string;
  asset?: CryptoAsset;
}

export interface StakingPosition {
  id: string;
  user_id: string;
  wallet_id: string | null;
  asset_id: string | null;
  protocol: string;
  staked_amount: number;
  rewards_earned: number;
  apy: number | null;
  lock_until: string | null;
  status: string;
  asset?: CryptoAsset;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  items?: WatchlistItem[];
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  asset_id: string;
  asset?: CryptoAsset;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  author_name: string | null;
  category: string | null;
  tags: string[];
  status: string;
  featured: boolean;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Faq {
  id: string;
  category_id: string | null;
  question: string;
  answer: string;
  sort_order: number;
  is_published: boolean;
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_role: string | null;
  author_avatar_url: string | null;
  content: string;
  rating: number;
  is_published: boolean;
  sort_order: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  is_public: boolean;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  target_user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ImpersonationSession {
  id: string;
  admin_id: string;
  target_user_id: string;
  reason: string | null;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface RolePermission {
  role: string;
  permission: string;
  description: string | null;
}

export interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  atl: number;
}
