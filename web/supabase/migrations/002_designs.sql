-- Cloud Design Persistence
-- Run this in Supabase SQL Editor

-- ── designs table ──────────────────────────────────────────────────
CREATE TABLE designs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users NOT NULL,
  name            text NOT NULL,
  description     text,
  grid_width      integer NOT NULL DEFAULT 50,
  grid_height     integer NOT NULL DEFAULT 50,
  grid_increment  text NOT NULL DEFAULT '1ft',
  ground_color    text NOT NULL DEFAULT '#5a8c3a',
  grade_nw        real NOT NULL DEFAULT 0,
  grade_ne        real NOT NULL DEFAULT 0,
  grade_sw        real NOT NULL DEFAULT 0,
  grade_se        real NOT NULL DEFAULT 0,
  project_id      uuid,  -- nullable FK, added when Projects feature ships
  thumbnail_url   text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own designs" ON designs
  FOR ALL USING (user_id = auth.uid());

-- ── design_versions table ──────────────────────────────────────────
CREATE TABLE design_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       uuid REFERENCES designs(id) ON DELETE CASCADE NOT NULL,
  version_number  integer NOT NULL DEFAULT 1,
  data            jsonb NOT NULL,  -- { grid, heightOverrides, placedObjects }
  auto_save       boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE design_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own design versions" ON design_versions
  FOR ALL USING (design_id IN (SELECT id FROM designs WHERE user_id = auth.uid()));

-- ── login_history table ────────────────────────────────────────────
CREATE TABLE login_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  login_at    timestamptz DEFAULT now(),
  ip_address  text,
  user_agent  text,
  provider    text
);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own login history" ON login_history
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own login history" ON login_history
  FOR INSERT WITH CHECK (user_id = auth.uid());
