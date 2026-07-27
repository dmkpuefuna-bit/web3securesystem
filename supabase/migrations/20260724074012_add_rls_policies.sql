/*
# Add RLS Policies for All Tables

## Overview
This migration adds Row Level Security policies to all tables created in the core schema migration.
Since admin policies reference the profiles table (which now exists), this can run safely.

## Policy Categories
1. **Public read** (anon + authenticated): blockchains, crypto_assets, blog_posts, faqs, testimonials, announcements, settings (public only), roles, permissions, role_permissions, nft_collections
2. **Owner-scoped** (authenticated, auth.uid() = user_id): profiles, wallets, wallet_balances, user_assets, nfts, transactions, staking, watchlists, watchlist_items, notifications, support_tickets, support_messages
3. **Admin-scoped** (authenticated, role = 'admin'): all management tables get admin CRUD
4. **Open insert**: newsletter_subscribers, audit_logs, analytics_events
*/

-- ============================================================
-- ROLES
-- ============================================================
DROP POLICY IF EXISTS "read_roles_all" ON roles;
CREATE POLICY "read_roles_all" ON roles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_roles" ON roles;
CREATE POLICY "admin_manage_roles" ON roles FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- PERMISSIONS
-- ============================================================
DROP POLICY IF EXISTS "read_permissions_all" ON permissions;
CREATE POLICY "read_permissions_all" ON permissions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_permissions" ON permissions;
CREATE POLICY "admin_manage_permissions" ON permissions FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- ROLE_PERMISSIONS
-- ============================================================
DROP POLICY IF EXISTS "read_role_permissions_all" ON role_permissions;
CREATE POLICY "read_role_permissions_all" ON role_permissions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_role_permissions" ON role_permissions;
CREATE POLICY "admin_manage_role_permissions" ON role_permissions FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- PROFILES
-- ============================================================
DROP POLICY IF EXISTS "read_own_profile" ON profiles;
CREATE POLICY "read_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_profiles" ON profiles;
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- BLOCKCHAINS
-- ============================================================
DROP POLICY IF EXISTS "read_blockchains_all" ON blockchains;
CREATE POLICY "read_blockchains_all" ON blockchains FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_blockchains" ON blockchains;
CREATE POLICY "admin_manage_blockchains" ON blockchains FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- WALLETS
-- ============================================================
DROP POLICY IF EXISTS "select_own_wallets" ON wallets;
CREATE POLICY "select_own_wallets" ON wallets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_wallets" ON wallets;
CREATE POLICY "admin_select_wallets" ON wallets FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "insert_own_wallets" ON wallets;
CREATE POLICY "insert_own_wallets" ON wallets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_wallets" ON wallets;
CREATE POLICY "update_own_wallets" ON wallets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wallets" ON wallets;
CREATE POLICY "delete_own_wallets" ON wallets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- CRYPTO_ASSETS
-- ============================================================
DROP POLICY IF EXISTS "read_crypto_assets_all" ON crypto_assets;
CREATE POLICY "read_crypto_assets_all" ON crypto_assets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_crypto_assets" ON crypto_assets;
CREATE POLICY "admin_manage_crypto_assets" ON crypto_assets FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- WALLET_BALANCES
-- ============================================================
DROP POLICY IF EXISTS "select_own_wallet_balances" ON wallet_balances;
CREATE POLICY "select_own_wallet_balances" ON wallet_balances FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_select_wallet_balances" ON wallet_balances;
CREATE POLICY "admin_select_wallet_balances" ON wallet_balances FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "insert_own_wallet_balances" ON wallet_balances;
CREATE POLICY "insert_own_wallet_balances" ON wallet_balances FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_wallet_balances" ON wallet_balances;
CREATE POLICY "update_own_wallet_balances" ON wallet_balances FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_wallet_balances" ON wallet_balances;
CREATE POLICY "delete_own_wallet_balances" ON wallet_balances FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid())
  );

-- ============================================================
-- USER_ASSETS
-- ============================================================
DROP POLICY IF EXISTS "select_own_user_assets" ON user_assets;
CREATE POLICY "select_own_user_assets" ON user_assets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_user_assets" ON user_assets;
CREATE POLICY "admin_select_user_assets" ON user_assets FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "insert_own_user_assets" ON user_assets;
CREATE POLICY "insert_own_user_assets" ON user_assets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_assets" ON user_assets;
CREATE POLICY "update_own_user_assets" ON user_assets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_assets" ON user_assets;
CREATE POLICY "delete_own_user_assets" ON user_assets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- NFT_COLLECTIONS
-- ============================================================
DROP POLICY IF EXISTS "read_nft_collections_all" ON nft_collections;
CREATE POLICY "read_nft_collections_all" ON nft_collections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_nft_collections" ON nft_collections;
CREATE POLICY "admin_manage_nft_collections" ON nft_collections FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- NFTS
-- ============================================================
DROP POLICY IF EXISTS "select_own_nfts" ON nfts;
CREATE POLICY "select_own_nfts" ON nfts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_nfts" ON nfts;
CREATE POLICY "admin_select_nfts" ON nfts FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "insert_own_nfts" ON nfts;
CREATE POLICY "insert_own_nfts" ON nfts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_nfts" ON nfts;
CREATE POLICY "update_own_nfts" ON nfts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_nfts" ON nfts;
CREATE POLICY "delete_own_nfts" ON nfts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_transactions" ON transactions;
CREATE POLICY "admin_select_transactions" ON transactions FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- STAKING
-- ============================================================
DROP POLICY IF EXISTS "select_own_staking" ON staking;
CREATE POLICY "select_own_staking" ON staking FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_staking" ON staking;
CREATE POLICY "admin_select_staking" ON staking FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "insert_own_staking" ON staking;
CREATE POLICY "insert_own_staking" ON staking FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_staking" ON staking;
CREATE POLICY "update_own_staking" ON staking FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_staking" ON staking;
CREATE POLICY "delete_own_staking" ON staking FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- WATCHLISTS
-- ============================================================
DROP POLICY IF EXISTS "select_own_watchlists" ON watchlists;
CREATE POLICY "select_own_watchlists" ON watchlists FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_watchlists" ON watchlists;
CREATE POLICY "insert_own_watchlists" ON watchlists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_watchlists" ON watchlists;
CREATE POLICY "update_own_watchlists" ON watchlists FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_watchlists" ON watchlists;
CREATE POLICY "delete_own_watchlists" ON watchlists FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- WATCHLIST_ITEMS
-- ============================================================
DROP POLICY IF EXISTS "select_own_watchlist_items" ON watchlist_items;
CREATE POLICY "select_own_watchlist_items" ON watchlist_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_watchlist_items" ON watchlist_items;
CREATE POLICY "insert_own_watchlist_items" ON watchlist_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_watchlist_items" ON watchlist_items;
CREATE POLICY "delete_own_watchlist_items" ON watchlist_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid())
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SUPPORT_TICKETS
-- ============================================================
DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_tickets" ON support_tickets;
CREATE POLICY "admin_select_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "update_own_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_tickets" ON support_tickets;
CREATE POLICY "admin_update_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- SUPPORT_MESSAGES
-- ============================================================
DROP POLICY IF EXISTS "select_own_ticket_messages" ON support_messages;
CREATE POLICY "select_own_ticket_messages" ON support_messages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR
      public.is_admin()))
  );

DROP POLICY IF EXISTS "insert_own_ticket_messages" ON support_messages;
CREATE POLICY "insert_own_ticket_messages" ON support_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- BLOG_POSTS
-- ============================================================
DROP POLICY IF EXISTS "read_published_blog" ON blog_posts;
CREATE POLICY "read_published_blog" ON blog_posts FOR SELECT
  TO anon, authenticated USING (status = 'published');

DROP POLICY IF EXISTS "admin_manage_blog" ON blog_posts;
CREATE POLICY "admin_manage_blog" ON blog_posts FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- FAQ_CATEGORIES
-- ============================================================
DROP POLICY IF EXISTS "read_faq_categories_all" ON faq_categories;
CREATE POLICY "read_faq_categories_all" ON faq_categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_faq_categories" ON faq_categories;
CREATE POLICY "admin_manage_faq_categories" ON faq_categories FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- FAQS
-- ============================================================
DROP POLICY IF EXISTS "read_published_faqs" ON faqs;
CREATE POLICY "read_published_faqs" ON faqs FOR SELECT
  TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admin_manage_faqs" ON faqs;
CREATE POLICY "admin_manage_faqs" ON faqs FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- TESTIMONIALS
-- ============================================================
DROP POLICY IF EXISTS "read_published_testimonials" ON testimonials;
CREATE POLICY "read_published_testimonials" ON testimonials FOR SELECT
  TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "admin_manage_testimonials" ON testimonials;
CREATE POLICY "admin_manage_testimonials" ON testimonials FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
DROP POLICY IF EXISTS "read_active_announcements" ON announcements;
CREATE POLICY "read_active_announcements" ON announcements FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_manage_announcements" ON announcements;
CREATE POLICY "admin_manage_announcements" ON announcements FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- NEWSLETTER_SUBSCRIBERS
-- ============================================================
DROP POLICY IF EXISTS "subscribe_newsletter" ON newsletter_subscribers;
CREATE POLICY "subscribe_newsletter" ON newsletter_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "unsubscribe_newsletter" ON newsletter_subscribers;
CREATE POLICY "unsubscribe_newsletter" ON newsletter_subscribers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_newsletter" ON newsletter_subscribers;
CREATE POLICY "admin_read_newsletter" ON newsletter_subscribers FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );

-- ============================================================
-- SETTINGS
-- ============================================================
DROP POLICY IF EXISTS "read_public_settings" ON settings;
CREATE POLICY "read_public_settings" ON settings FOR SELECT
  TO anon, authenticated USING (is_public = true);

DROP POLICY IF EXISTS "admin_manage_settings" ON settings;
CREATE POLICY "admin_manage_settings" ON settings FOR ALL
  TO authenticated USING (
    public.is_admin()
  ) WITH CHECK (
    public.is_admin()
  );

-- ============================================================
-- AUDIT_LOGS
-- ============================================================
DROP POLICY IF EXISTS "admin_read_audit_logs" ON audit_logs;
CREATE POLICY "admin_read_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "insert_audit_logs" ON audit_logs;
CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================================
-- ANALYTICS_EVENTS
-- ============================================================
DROP POLICY IF EXISTS "insert_analytics_events" ON analytics_events;
CREATE POLICY "insert_analytics_events" ON analytics_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_analytics" ON analytics_events;
CREATE POLICY "admin_read_analytics" ON analytics_events FOR SELECT
  TO authenticated USING (
    public.is_admin()
  );
