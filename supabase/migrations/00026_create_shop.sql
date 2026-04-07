-- Migration: 00026_create_shop.sql
-- Creates the shop feature: products, categories, variants, cart, orders,
-- discount codes, digital downloads, and QR-based collection verification.

-- ── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE shop_order_status AS ENUM (
  'pending',
  'paid',
  'ready_for_pickup',
  'collected',
  'cancelled',
  'refunded'
);

CREATE TYPE product_type AS ENUM ('physical', 'digital');

CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');

-- ── Product Categories ───────────────────────────────────────────────────────

CREATE TABLE product_categories (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name             text        NOT NULL,
  slug             text        NOT NULL,
  description      text,
  sort_order       integer     NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  CONSTRAINT product_categories_org_slug_unique UNIQUE (organisation_id, slug)
);

CREATE TRIGGER product_categories_updated_at
  BEFORE UPDATE ON product_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Products ─────────────────────────────────────────────────────────────────

CREATE TABLE products (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id          uuid          NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  category_id              uuid          REFERENCES product_categories(id) ON DELETE SET NULL,
  name                     text          NOT NULL,
  slug                     text          NOT NULL,
  description              text,
  product_type             product_type  NOT NULL DEFAULT 'physical',
  price_cents              integer       NOT NULL,
  compare_at_price_cents   integer,
  image_urls               text[]        NOT NULL DEFAULT '{}',
  digital_file_urls        text[],
  is_active                boolean       NOT NULL DEFAULT true,
  is_restricted            boolean       NOT NULL DEFAULT false,
  is_preorder              boolean       NOT NULL DEFAULT false,
  preorder_available_date  date,
  low_stock_threshold      integer       NOT NULL DEFAULT 5,
  sort_order               integer       NOT NULL DEFAULT 0,
  created_by               uuid          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at               timestamptz   DEFAULT now(),
  updated_at               timestamptz   DEFAULT now(),
  CONSTRAINT products_org_slug_unique UNIQUE (organisation_id, slug),
  CONSTRAINT products_price_positive CHECK (price_cents >= 0)
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Product Variants ─────────────────────────────────────────────────────────

CREATE TABLE product_variants (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size            text,
  colour          text,
  sku             text,
  stock_quantity  integer     NOT NULL DEFAULT 0,
  is_active       boolean     NOT NULL DEFAULT true,
  sort_order      integer     NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  CONSTRAINT product_variants_unique UNIQUE (product_id, size, colour)
);

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Product Access Rules ─────────────────────────────────────────────────────

CREATE TABLE product_access_rules (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  allowed_role    user_role,
  allowed_team_id uuid        REFERENCES teams(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),
  CONSTRAINT product_access_rules_has_condition CHECK (
    allowed_role IS NOT NULL OR allowed_team_id IS NOT NULL
  )
);

-- ── Cart Items ───────────────────────────────────────────────────────────────

CREATE TABLE cart_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organisation_id uuid        NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  product_id      uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id      uuid        NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity        integer     NOT NULL DEFAULT 1,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  CONSTRAINT cart_items_unique UNIQUE (profile_id, variant_id),
  CONSTRAINT cart_items_quantity_positive CHECK (quantity > 0)
);

CREATE TRIGGER cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Discount Codes ───────────────────────────────────────────────────────────

CREATE TABLE discount_codes (
  id                      uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id         uuid          NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  code                    text          NOT NULL,
  description             text,
  discount_type           discount_type NOT NULL,
  discount_value          integer       NOT NULL,
  min_order_cents         integer,
  max_discount_cents      integer,
  applies_to_product_id   uuid          REFERENCES products(id) ON DELETE CASCADE,
  applies_to_category_id  uuid          REFERENCES product_categories(id) ON DELETE CASCADE,
  max_uses                integer,
  max_uses_per_user       integer       DEFAULT 1,
  times_used              integer       NOT NULL DEFAULT 0,
  starts_at               timestamptz,
  expires_at              timestamptz,
  is_active               boolean       NOT NULL DEFAULT true,
  created_by              uuid          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at              timestamptz   DEFAULT now(),
  updated_at              timestamptz   DEFAULT now(),
  CONSTRAINT discount_codes_org_code_unique UNIQUE (organisation_id, code),
  CONSTRAINT discount_codes_value_positive CHECK (discount_value > 0)
);

CREATE TRIGGER discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Shop Orders ──────────────────────────────────────────────────────────────

CREATE TABLE shop_orders (
  id                          uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id             uuid               NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  profile_id                  uuid               NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_number                text               NOT NULL,
  status                      shop_order_status  NOT NULL DEFAULT 'pending',
  subtotal_cents              integer            NOT NULL,
  discount_cents              integer            NOT NULL DEFAULT 0,
  total_cents                 integer            NOT NULL,
  discount_code_id            uuid               REFERENCES discount_codes(id) ON DELETE SET NULL,
  stripe_checkout_session_id  text,
  stripe_payment_intent_id    text,
  collection_qr_token         uuid               NOT NULL DEFAULT gen_random_uuid(),
  notes                       text,
  collected_at                timestamptz,
  created_at                  timestamptz        DEFAULT now(),
  updated_at                  timestamptz        DEFAULT now()
);

CREATE TRIGGER shop_orders_updated_at
  BEFORE UPDATE ON shop_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Order Items ──────────────────────────────────────────────────────────────

CREATE TABLE order_items (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid         NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id       uuid         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id       uuid         REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name     text         NOT NULL,
  variant_label    text,
  product_type     product_type NOT NULL DEFAULT 'physical',
  quantity         integer      NOT NULL,
  unit_price_cents integer      NOT NULL,
  created_at       timestamptz  DEFAULT now()
);

-- ── Digital Downloads ────────────────────────────────────────────────────────

CREATE TABLE digital_downloads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id   uuid        NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  profile_id      uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id      uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  download_count  integer     NOT NULL DEFAULT 0,
  max_downloads   integer     NOT NULL DEFAULT 5,
  expires_at      timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- ── Helper Function: Generate Order Number ───────────────────────────────────

CREATE OR REPLACE FUNCTION generate_order_number(org_id uuid)
RETURNS text AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 5) AS integer)
  ), 0) + 1
  INTO next_num
  FROM shop_orders
  WHERE organisation_id = org_id;

  RETURN 'ORD-' || LPAD(next_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_downloads ENABLE ROW LEVEL SECURITY;

-- Product Categories: all org members can read active
CREATE POLICY "product_categories_select_active"
  ON product_categories FOR SELECT
  USING (organisation_id = auth_org_id() AND is_active = true);

CREATE POLICY "product_categories_select_admin"
  ON product_categories FOR SELECT
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "product_categories_insert_admin"
  ON product_categories FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "product_categories_update_admin"
  ON product_categories FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "product_categories_delete_admin"
  ON product_categories FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- Products: all org members can read active
CREATE POLICY "products_select_active"
  ON products FOR SELECT
  USING (organisation_id = auth_org_id() AND is_active = true);

CREATE POLICY "products_select_admin"
  ON products FOR SELECT
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- Product Variants: readable by org members via product
CREATE POLICY "product_variants_select"
  ON product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
        AND p.organisation_id = auth_org_id()
    )
  );

CREATE POLICY "product_variants_insert_admin"
  ON product_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
        AND is_admin_or_manager(p.organisation_id)
    )
  );

CREATE POLICY "product_variants_update_admin"
  ON product_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
        AND is_admin_or_manager(p.organisation_id)
    )
  );

CREATE POLICY "product_variants_delete_admin"
  ON product_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
        AND is_admin_or_manager(p.organisation_id)
    )
  );

-- Product Access Rules: admins can CRUD
CREATE POLICY "product_access_rules_select"
  ON product_access_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_access_rules.product_id
        AND p.organisation_id = auth_org_id()
    )
  );

CREATE POLICY "product_access_rules_insert_admin"
  ON product_access_rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_access_rules.product_id
        AND is_admin_or_manager(p.organisation_id)
    )
  );

CREATE POLICY "product_access_rules_update_admin"
  ON product_access_rules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_access_rules.product_id
        AND is_admin_or_manager(p.organisation_id)
    )
  );

CREATE POLICY "product_access_rules_delete_admin"
  ON product_access_rules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_access_rules.product_id
        AND is_admin_or_manager(p.organisation_id)
    )
  );

-- Cart Items: users can CRUD their own
CREATE POLICY "cart_items_select_own"
  ON cart_items FOR SELECT
  USING (profile_id = auth.uid() AND organisation_id = auth_org_id());

CREATE POLICY "cart_items_insert_own"
  ON cart_items FOR INSERT
  WITH CHECK (profile_id = auth.uid() AND organisation_id = auth_org_id());

CREATE POLICY "cart_items_update_own"
  ON cart_items FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "cart_items_delete_own"
  ON cart_items FOR DELETE
  USING (profile_id = auth.uid());

-- Discount Codes: org members can read active codes, admins can CRUD
CREATE POLICY "discount_codes_select_active"
  ON discount_codes FOR SELECT
  USING (organisation_id = auth_org_id() AND is_active = true);

CREATE POLICY "discount_codes_select_admin"
  ON discount_codes FOR SELECT
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "discount_codes_insert_admin"
  ON discount_codes FOR INSERT
  WITH CHECK (is_admin_or_manager(organisation_id));

CREATE POLICY "discount_codes_update_admin"
  ON discount_codes FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "discount_codes_delete_admin"
  ON discount_codes FOR DELETE
  USING (is_admin_or_manager(organisation_id));

-- Shop Orders: users can read their own, admins can read/update all
CREATE POLICY "shop_orders_select_own"
  ON shop_orders FOR SELECT
  USING (profile_id = auth.uid() AND organisation_id = auth_org_id());

CREATE POLICY "shop_orders_select_admin"
  ON shop_orders FOR SELECT
  USING (is_admin_or_manager(organisation_id));

CREATE POLICY "shop_orders_insert_own"
  ON shop_orders FOR INSERT
  WITH CHECK (profile_id = auth.uid() AND organisation_id = auth_org_id());

CREATE POLICY "shop_orders_update_admin"
  ON shop_orders FOR UPDATE
  USING (is_admin_or_manager(organisation_id));

-- Order Items: readable via order access
CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_orders o
      WHERE o.id = order_items.order_id
        AND o.profile_id = auth.uid()
    )
  );

CREATE POLICY "order_items_select_admin"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shop_orders o
      WHERE o.id = order_items.order_id
        AND is_admin_or_manager(o.organisation_id)
    )
  );

CREATE POLICY "order_items_insert_own"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_orders o
      WHERE o.id = order_items.order_id
        AND o.profile_id = auth.uid()
    )
  );

-- Digital Downloads: users can read their own
CREATE POLICY "digital_downloads_select_own"
  ON digital_downloads FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "digital_downloads_insert_own"
  ON digital_downloads FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "digital_downloads_update_own"
  ON digital_downloads FOR UPDATE
  USING (profile_id = auth.uid());

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_product_categories_org ON product_categories (organisation_id);
CREATE INDEX idx_products_org_active_cat ON products (organisation_id, is_active, category_id);
CREATE INDEX idx_products_slug ON products (organisation_id, slug);
CREATE INDEX idx_product_variants_product ON product_variants (product_id, is_active);
CREATE INDEX idx_product_access_rules_product ON product_access_rules (product_id);
CREATE INDEX idx_cart_items_profile_org ON cart_items (profile_id, organisation_id);
CREATE INDEX idx_discount_codes_org_code ON discount_codes (organisation_id, code);
CREATE INDEX idx_shop_orders_org_profile ON shop_orders (organisation_id, profile_id, status);
CREATE UNIQUE INDEX idx_shop_orders_order_number ON shop_orders (order_number);
CREATE UNIQUE INDEX idx_shop_orders_qr_token ON shop_orders (collection_qr_token);
CREATE INDEX idx_order_items_order ON order_items (order_id);
CREATE INDEX idx_digital_downloads_order_item ON digital_downloads (order_item_id, profile_id);

-- ── Storage Buckets ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-products', 'shop-products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-digital', 'shop-digital', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Shop products bucket (public read, org-scoped write)
CREATE POLICY "shop_products_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop-products');

CREATE POLICY "shop_products_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shop-products'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

CREATE POLICY "shop_products_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'shop-products'
    AND is_admin_or_manager(auth_org_id())
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

-- Shop digital bucket (private, org-scoped)
CREATE POLICY "shop_digital_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shop-digital'
    AND auth.uid() IS NOT NULL
    AND is_admin_or_manager(auth_org_id())
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

CREATE POLICY "shop_digital_read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'shop-digital'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

CREATE POLICY "shop_digital_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'shop-digital'
    AND is_admin_or_manager(auth_org_id())
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );
