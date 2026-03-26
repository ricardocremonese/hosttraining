// Supabase-based client
// All data is persisted in Supabase PostgreSQL

import { supabase } from '@/lib/supabase';

const tableMap = {
  Product: 'products',
  Order: 'orders',
  Category: 'categories',
  Banner: 'banners',
  Editorial: 'editorials',
  FeaturedCategory: 'featured_categories',
  Integration: 'integrations_config',
  Coupon: 'coupons',
  Campaign: 'campaigns',
  AbandonedCart: 'abandoned_carts',
  ProductView: 'product_views',
  Downsell: 'downsells',
  MarketingSpend: 'marketing_spend',
};

const createEntityAPI = (entityName) => {
  const table = tableMap[entityName];

  return {
    list: async (sortField, limit) => {
      let query = supabase.from(table).select('*');

      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = desc ? sortField.slice(1) : sortField;
        query = query.order(field, { ascending: !desc });
      }

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    filter: async (filters, sortField, limit) => {
      let query = supabase.from(table).select('*');

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = desc ? sortField.slice(1) : sortField;
        query = query.order(field, { ascending: !desc });
      }

      if (limit) query = query.limit(limit);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    create: async (data) => {
      const payload = {
        ...data,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return result;
    },

    update: async (id, data) => {
      const payload = {
        ...data,
        updated_date: new Date().toISOString(),
      };

      const { data: result, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
  };
};

export const base44 = {
  entities: {
    Product: createEntityAPI('Product'),
    Order: createEntityAPI('Order'),
    Category: createEntityAPI('Category'),
    Banner: createEntityAPI('Banner'),
    Editorial: createEntityAPI('Editorial'),
    FeaturedCategory: createEntityAPI('FeaturedCategory'),
    Integration: createEntityAPI('Integration'),
    Coupon: createEntityAPI('Coupon'),
    Campaign: createEntityAPI('Campaign'),
    AbandonedCart: createEntityAPI('AbandonedCart'),
    ProductView: createEntityAPI('ProductView'),
    Downsell: createEntityAPI('Downsell'),
    MarketingSpend: createEntityAPI('MarketingSpend'),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error } = await supabase.storage
          .from('media')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        return { file_url: publicUrl };
      },
    },
  },
  auth: {
    me: () => Promise.resolve({ id: 'local-user', name: 'Admin', email: 'admin@local', role: 'admin' }),
    logout: () => { /* no-op */ },
    redirectToLogin: () => { /* no-op */ },
  },
};
