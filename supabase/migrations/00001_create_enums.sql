-- Migration: 00001_create_enums.sql
-- Creates all application-wide enum types

CREATE TYPE sport_type AS ENUM (
  'rugby_league',
  'rugby_union',
  'cricket',
  'soccer',
  'netball',
  'basketball',
  'hockey',
  'afl',
  'touch_football',
  'volleyball',
  'other'
);

CREATE TYPE user_role AS ENUM (
  'admin',
  'manager',
  'coach',
  'player',
  'member',
  'guardian'
);

CREATE TYPE membership_type AS ENUM (
  'senior',
  'junior',
  'social',
  'life',
  'volunteer'
);

CREATE TYPE membership_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'pending'
);

CREATE TYPE fixture_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed',
  'bye'
);

CREATE TYPE payment_type AS ENUM (
  'membership_fee',
  'match_fee',
  'fine',
  'merchandise',
  'event',
  'other'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'overdue',
  'cancelled',
  'refunded'
);

CREATE TYPE document_category AS ENUM (
  'policy',
  'minutes',
  'report',
  'form',
  'constitution',
  'other'
);
