# Infrastructure Setup Guide

This document covers the external service configuration required to run MyYard: Supabase (auth, database, storage), Google OAuth, and Vercel (deployment).

---

## 1. Supabase

### Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon Key** from Settings > API
3. The anon key must be the legacy `eyJ...` JWT format (the newer `sb_publishable_` format is not yet supported by `supabase-js`)

### Environment Variables

Create `web/.env.local`:

```
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

### Database Tables

Run these in Supabase SQL Editor (Dashboard > SQL Editor > New query).

#### Profiles table (auto-created on signup)

```sql
CREATE TABLE profiles (
  id    uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role  text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

#### Designs and versions (migration 002)

See `web/supabase/migrations/002_designs.sql` for the full SQL, which creates:

- **`designs`** -- design metadata (name, description, grid settings, grades)
- **`design_versions`** -- JSONB payloads (grid, heightOverrides, placedObjects)
- **`login_history`** -- authentication audit log

All tables have Row Level Security ensuring users can only access their own data.

#### Templates (for widget/template catalog)

```sql
CREATE TABLE templates (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind              text NOT NULL CHECK (kind IN ('preset', 'assembly')),
  name              text NOT NULL,
  description       text,
  category          text,
  tags              text[],
  visibility        text NOT NULL DEFAULT 'user' CHECK (visibility IN ('builtin', 'user', 'submitted')),
  created_by        uuid REFERENCES auth.users,
  thumbnail_url     text,
  submission_status text DEFAULT 'pending' CHECK (submission_status IN ('pending', 'approved', 'rejected')),
  data              jsonb NOT NULL,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read builtin templates" ON templates
  FOR SELECT USING (visibility = 'builtin');
CREATE POLICY "Users can CRUD own templates" ON templates
  FOR ALL USING (created_by = auth.uid());

CREATE TABLE template_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  uuid REFERENCES templates(id) ON DELETE CASCADE NOT NULL,
  url          text NOT NULL,
  is_primary   boolean DEFAULT false,
  sort_order   integer DEFAULT 0
);

ALTER TABLE template_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Readable if template is readable" ON template_images
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM templates
      WHERE visibility = 'builtin' OR created_by = auth.uid()
    )
  );
CREATE POLICY "Users can manage own template images" ON template_images
  FOR ALL USING (
    template_id IN (SELECT id FROM templates WHERE created_by = auth.uid())
  );
```

### Storage Buckets

Create these in Dashboard > Storage:

| Bucket | Access | Purpose |
|--------|--------|---------|
| `templates` | Public | Template/widget screenshot images |
| `widgets` | Public | Widget catalog images |

For each bucket, enable **public access** so `getPublicUrl()` works without auth tokens.

### Auth Providers

#### Email/Password

Enabled by default. Optionally configure:
- Dashboard > Authentication > Providers > Email
- Enable "Confirm email" for production (sends verification email on signup)

#### Google OAuth

See Section 2 below for Google Cloud setup. Once you have the Client ID and Secret:
1. Dashboard > Authentication > Providers > Google
2. Enable the provider
3. Paste **Client ID** and **Client Secret**
4. Note the **Callback URL** shown (e.g., `https://<project-id>.supabase.co/auth/v1/callback`) -- you'll need this for Google Cloud Console

---

## 2. Google OAuth (Cloud Console)

### Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Application type: **Web application**
6. Name: `MyYard` (or whatever you prefer)

### Configure Redirect URIs

Add these under **Authorized redirect URIs**:

```
https://<your-supabase-project-id>.supabase.co/auth/v1/callback
```

For local development, also add:
```
http://localhost:5173
```

### Configure Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. User Type: **External** (or Internal if using Google Workspace)
3. Fill in required fields:
   - App name: `MyYard`
   - User support email: your email
   - Developer contact: your email
4. Scopes: add `email`, `profile`, `openid`
5. Test users: add your Gmail address (required while in "Testing" status)

### Copy Credentials

Copy the **Client ID** and **Client Secret** into Supabase (see Auth Providers above).

---

## 3. Vercel

### Connect Repository

1. Go to [vercel.com](https://vercel.com) and import the GitHub repository
2. Framework Preset: **Vite**
3. Root Directory: `web`
4. Build Command: `npm run build` (runs `tsc -b && vite build`)
5. Output Directory: `dist`

### Environment Variables

Add in Vercel Dashboard > Settings > Environment Variables:

| Variable | Value | Environments |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://<project-id>.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...your-anon-key...` | Production, Preview, Development |

### Domain Configuration

If using a custom domain:
1. Add domain in Vercel Dashboard > Settings > Domains
2. Update Google OAuth redirect URIs to include the production domain
3. Update Supabase Auth settings:
   - Dashboard > Authentication > URL Configuration
   - Add the production URL to **Redirect URLs**

---

## 4. Database Schema Summary

| Table | Created By | Purpose |
|-------|-----------|---------|
| `auth.users` | Supabase (built-in) | User authentication |
| `profiles` | Trigger on signup | User role (user/admin) |
| `designs` | Migration 002 | Saved yard designs |
| `design_versions` | Migration 002 | Design data (grid, objects) as JSONB |
| `login_history` | Migration 002 | Auth event audit log |
| `templates` | Manual SQL | Widget presets and assemblies |
| `template_images` | Manual SQL | Template screenshots |

---

## 5. RLS Policy Summary

All tables use Row Level Security. Key rules:

- **Users own their data** -- CRUD restricted to `auth.uid()` matching `user_id` or `created_by`
- **Built-in templates are public** -- anyone can read templates with `visibility = 'builtin'`
- **Design versions cascade** -- access checked via parent `designs` table ownership
- **Admin role** -- stored in `profiles.role`, checked client-side via `AdminGuard`

---

## 6. Local Development

```bash
cd web
cp .env.local.example .env.local   # add your Supabase credentials
npm install
npm run dev                         # starts on http://localhost:5173
```

Verify setup:
- Login with email/password or Google OAuth
- Save a design (should persist to Supabase)
- Check Supabase Dashboard > Table Editor to confirm data
