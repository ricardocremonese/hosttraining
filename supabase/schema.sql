-- =============================================
-- HOST Training - Schema do Banco de Dados
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- ===================
-- TABELA: products
-- ===================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category TEXT DEFAULT 'lifestyle',
  gender TEXT DEFAULT 'men',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2),
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  colors JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  sport TEXT,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TABELA: orders
-- ===================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE,
  items JSONB DEFAULT '[]'::jsonb,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_cpf TEXT,
  customer_birthday DATE,
  shipping_address JSONB,
  subtotal NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TABELA: categories
-- ===================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  display_order INTEGER DEFAULT 0,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TABELA: banners
-- ===================
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  button_text TEXT DEFAULT 'Compre Agora',
  button_link TEXT DEFAULT '/products',
  media_type TEXT DEFAULT 'image',
  media_url TEXT,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TABELA: editorials
-- ===================
CREATE TABLE IF NOT EXISTS editorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag TEXT,
  title TEXT,
  description TEXT,
  button_text TEXT DEFAULT 'Comprar',
  button_link TEXT DEFAULT '/products',
  image_url TEXT,
  reverse_layout BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TABELA: featured_categories
-- ===================
CREATE TABLE IF NOT EXISTS featured_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  image_url TEXT,
  link TEXT DEFAULT '/products',
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TABELA: integrations_config
-- ===================
CREATE TABLE IF NOT EXISTS integrations_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- Dados iniciais
INSERT INTO integrations_config (provider, category, enabled, config) VALUES
  ('mercadopago', 'payment', false, '{"public_key":"","access_token":""}'),
  ('stripe', 'payment', false, '{"public_key":"","secret_key":""}'),
  ('correios', 'shipping', false, '{"cep_origem":"","contrato":"","senha":""}'),
  ('melhorenvio', 'shipping', false, '{"token":"","cep_origem":""}'),
  ('onlog', 'shipping', false, '{"api_key":"","cnpj":""}'),
  ('resend', 'email', false, '{"api_key":"","from_email":"","from_name":"HOST Training"}'),
  ('openai', 'ai', false, '{"api_key":"","model":"gpt-4o-mini"}'),
  ('anthropic', 'ai', false, '{"api_key":"","model":"claude-sonnet-4-20250514"}')
ON CONFLICT (provider) DO NOTHING;

-- ===================
-- TABELA: coupons
-- ===================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'percentage',
  value NUMERIC(10,2) NOT NULL DEFAULT 0,
  free_shipping BOOLEAN DEFAULT false,
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  campaign_id UUID,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TABELA: campaigns
-- ===================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'promotion',
  subject TEXT,
  body_html TEXT,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  coupon_id UUID,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TABELA: abandoned_carts
-- ===================
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC(10,2) DEFAULT 0,
  followup_20min BOOLEAN DEFAULT false,
  followup_1day BOOLEAN DEFAULT false,
  followup_3days BOOLEAN DEFAULT false,
  recovered BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TABELA: product_views (rastreamento de visitas)
-- ===================
CREATE TABLE IF NOT EXISTS product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  product_name TEXT,
  session_id TEXT,
  created_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- TABELA: downsells
-- ===================
CREATE TABLE IF NOT EXISTS downsells (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_product_id UUID,
  trigger_category TEXT,
  trigger_min_price NUMERIC(10,2) DEFAULT 0,
  offer_product_id UUID NOT NULL,
  offer_title TEXT,
  offer_description TEXT,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  display_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_date TIMESTAMPTZ DEFAULT now(),
  updated_date TIMESTAMPTZ DEFAULT now()
);

-- ===================
-- INDEXES
-- ===================
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_cpf ON orders(customer_cpf);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_editorials_active ON editorials(active);
CREATE INDEX IF NOT EXISTS idx_editorials_display_order ON editorials(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_categories_active ON featured_categories(active);
CREATE INDEX IF NOT EXISTS idx_featured_categories_display_order ON featured_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovered ON abandoned_carts(recovered);
CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_created ON product_views(created_date);
CREATE INDEX IF NOT EXISTS idx_downsells_active ON downsells(active);

-- ===================
-- RLS (Row Level Security)
-- Habilitando com policies abertas para leitura pública
-- e escrita pública (ajuste conforme sua necessidade de auth)
-- ===================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE editorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE downsells ENABLE ROW LEVEL SECURITY;

-- Products: leitura pública, escrita pública
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update" ON products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "products_delete" ON products FOR DELETE USING (true);

-- Orders: leitura pública, escrita pública
CREATE POLICY "orders_select" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "orders_delete" ON orders FOR DELETE USING (true);

-- Categories: leitura pública, escrita pública
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (true);

-- Banners: leitura pública, escrita pública
CREATE POLICY "banners_select" ON banners FOR SELECT USING (true);
CREATE POLICY "banners_insert" ON banners FOR INSERT WITH CHECK (true);
CREATE POLICY "banners_update" ON banners FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "banners_delete" ON banners FOR DELETE USING (true);

-- Featured Categories: leitura pública, escrita pública
CREATE POLICY "featured_categories_select" ON featured_categories FOR SELECT USING (true);
CREATE POLICY "featured_categories_insert" ON featured_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "featured_categories_update" ON featured_categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "featured_categories_delete" ON featured_categories FOR DELETE USING (true);

-- Integrations Config: leitura e escrita pública
CREATE POLICY "integrations_config_select" ON integrations_config FOR SELECT USING (true);
CREATE POLICY "integrations_config_insert" ON integrations_config FOR INSERT WITH CHECK (true);
CREATE POLICY "integrations_config_update" ON integrations_config FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "integrations_config_delete" ON integrations_config FOR DELETE USING (true);

-- Coupons
CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (true);
CREATE POLICY "coupons_insert" ON coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "coupons_update" ON coupons FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "coupons_delete" ON coupons FOR DELETE USING (true);

-- Campaigns
CREATE POLICY "campaigns_select" ON campaigns FOR SELECT USING (true);
CREATE POLICY "campaigns_insert" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "campaigns_update" ON campaigns FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "campaigns_delete" ON campaigns FOR DELETE USING (true);

-- Abandoned Carts
CREATE POLICY "abandoned_carts_select" ON abandoned_carts FOR SELECT USING (true);
CREATE POLICY "abandoned_carts_insert" ON abandoned_carts FOR INSERT WITH CHECK (true);
CREATE POLICY "abandoned_carts_update" ON abandoned_carts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "abandoned_carts_delete" ON abandoned_carts FOR DELETE USING (true);

-- Product Views
CREATE POLICY "product_views_all" ON product_views FOR ALL USING (true) WITH CHECK (true);

-- Downsells
CREATE POLICY "downsells_all" ON downsells FOR ALL USING (true) WITH CHECK (true);

-- Editorials: leitura pública, escrita pública
CREATE POLICY "editorials_select" ON editorials FOR SELECT USING (true);
CREATE POLICY "editorials_insert" ON editorials FOR INSERT WITH CHECK (true);
CREATE POLICY "editorials_update" ON editorials FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "editorials_delete" ON editorials FOR DELETE USING (true);

-- ===================
-- Storage bucket para uploads de imagens/vídeos
-- ===================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para upload público no bucket media
CREATE POLICY "media_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
CREATE POLICY "media_select" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media_delete" ON storage.objects FOR DELETE USING (bucket_id = 'media');
