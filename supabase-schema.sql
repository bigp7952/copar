-- Schema SQL pour Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('patisserie', 'institut', 'restaurant', 'autre')),
  email TEXT,
  phone TEXT,
  default_fee NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: payment_targets
CREATE TABLE IF NOT EXISTS payment_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: payment_parts
CREATE TABLE IF NOT EXISTS payment_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_target_id UUID NOT NULL REFERENCES payment_targets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  split_live NUMERIC NOT NULL DEFAULT 0,
  split_business NUMERIC NOT NULL DEFAULT 0,
  split_save NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  type TEXT NOT NULL CHECK (type IN ('personal', 'business')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'collaborator', 'client')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  currency TEXT NOT NULL DEFAULT 'FCFA',
  ratios JSONB NOT NULL DEFAULT '{"live": 0.4, "business": 0.4, "save": 0.2}'::jsonb,
  expense_categories TEXT[] NOT NULL DEFAULT ARRAY['Nourriture', 'Transport', 'Matériel', 'Loyer', 'Autre'],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: other_income (revenus non liés à des clients)
CREATE TABLE IF NOT EXISTS other_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  note TEXT,
  split_live NUMERIC NOT NULL DEFAULT 0,
  split_business NUMERIC NOT NULL DEFAULT 0,
  split_save NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_payment_targets_client_id ON payment_targets(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_parts_target_id ON payment_parts(payment_target_id);
CREATE INDEX IF NOT EXISTS idx_payment_parts_date ON payment_parts(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_client_id ON feedbacks(client_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_token ON feedbacks(token);
CREATE INDEX IF NOT EXISTS idx_other_income_date ON other_income(date);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_targets_updated_at BEFORE UPDATE ON payment_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedbacks_updated_at BEFORE UPDATE ON feedbacks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer automatiquement le statut d'un payment_target
CREATE OR REPLACE FUNCTION update_payment_target_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  target_total NUMERIC;
  new_status TEXT;
BEGIN
  -- Calculer le total payé
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payment_parts
  WHERE payment_target_id = COALESCE(NEW.payment_target_id, OLD.payment_target_id);

  -- Récupérer le montant total
  SELECT total_amount INTO target_total
  FROM payment_targets
  WHERE id = COALESCE(NEW.payment_target_id, OLD.payment_target_id);

  -- Déterminer le nouveau statut
  IF total_paid = 0 THEN
    new_status := 'pending';
  ELSIF total_paid >= target_total THEN
    new_status := 'paid';
  ELSE
    new_status := 'partial';
  END IF;

  -- Mettre à jour le statut
  UPDATE payment_targets
  SET status = new_status, updated_at = NOW()
  WHERE id = COALESCE(NEW.payment_target_id, OLD.payment_target_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le statut
CREATE TRIGGER update_status_on_payment_part
AFTER INSERT OR UPDATE OR DELETE ON payment_parts
FOR EACH ROW EXECUTE FUNCTION update_payment_target_status();

-- RLS (Row Level Security) - À activer selon tes besoins
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payment_targets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payment_parts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (exemple - à adapter selon tes besoins)
-- CREATE POLICY "Users can view own data" ON clients FOR SELECT USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can insert own data" ON clients FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- CREATE POLICY "Users can update own data" ON clients FOR UPDATE USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can delete own data" ON clients FOR DELETE USING (auth.uid()::text = user_id);

