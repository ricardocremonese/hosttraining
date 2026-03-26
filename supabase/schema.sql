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
