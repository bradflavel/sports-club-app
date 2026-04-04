-- Migration: 00007_create_payments.sql
-- Creates the payments table

CREATE TABLE payments (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid           NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  member_id       uuid           NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  payment_type    payment_type   NOT NULL,
  payment_status  payment_status NOT NULL DEFAULT 'pending',
  amount_cents    integer        NOT NULL CHECK (amount_cents > 0),
  currency        text           NOT NULL DEFAULT 'AUD',
  description     text,
  due_date        date,
  paid_at         timestamptz,
  receipt_url     text,
  stripe_payment_intent_id text,
  notes           text,
  created_by      uuid           REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      timestamptz    DEFAULT now(),
  updated_at      timestamptz    DEFAULT now()
);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
