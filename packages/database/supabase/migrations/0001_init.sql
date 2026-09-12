-- NexusDrive: migrasi Supabase (target instance Supabase PostgreSQL).
-- Sumber kebenaran skema aplikasi = prisma/schema.prisma (untuk dev lokal / docker).
-- File ini untuk deployment Supabase sesuai spesifikasi master (bagian 5),
-- termasuk RLS yang bergantung pada auth.users / auth.uid() milik Supabase.
-- Catatan: tabel `users` pada skema publik di bawah adalah tabel profil aplikasi;
-- bila memakai Supabase Auth penuh, ganti FK profiles.id menjadi auth.users(id).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TYPE cloud_provider_enum AS ENUM ('google_drive', 'dropbox', 'onedrive', 'mega', 'pcloud');
CREATE TYPE account_status_enum AS ENUM ('active', 'expired', 'revoked', 'error');
CREATE TYPE transfer_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE sync_direction_enum AS ENUM ('one_way', 'two_way', 'mirror');

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE public.connected_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider cloud_provider_enum NOT NULL,
    account_email TEXT NOT NULL,
    account_name TEXT,
    provider_meta JSONB,
    status account_status_enum DEFAULT 'active' NOT NULL,
    total_space_bytes BIGINT DEFAULT 0 NOT NULL,
    used_space_bytes BIGINT DEFAULT 0 NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_user_provider_account UNIQUE(user_id, provider, account_email)
);

CREATE TABLE public.credential_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    encrypted_access_token TEXT,
    encrypted_refresh_token TEXT,
    encrypted_api_key TEXT,
    token_expires_at TIMESTAMPTZ,
    encryption_key_version INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_account_vault UNIQUE(account_id)
);

CREATE TABLE public.file_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider cloud_provider_enum NOT NULL,
    provider_file_id TEXT NOT NULL,
    provider_parent_id TEXT,
    name TEXT NOT NULL,
    extension TEXT,
    mime_type TEXT,
    size_bytes BIGINT DEFAULT 0 NOT NULL,
    is_folder BOOLEAN DEFAULT FALSE NOT NULL,
    path_hierarchy TEXT NOT NULL,
    web_view_link TEXT,
    thumbnail_r2_key TEXT,
    ai_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    embedding VECTOR(1536),
    provider_modified_at TIMESTAMPTZ,
    last_indexed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_account_file UNIQUE(account_id, provider_file_id)
);

CREATE INDEX file_items_user_name_idx ON public.file_items (user_id, name);
CREATE INDEX file_items_user_folder_idx ON public.file_items (user_id, is_folder);

CREATE TABLE public.transfer_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    source_file_id TEXT NOT NULL,
    source_file_name TEXT NOT NULL,
    source_file_size BIGINT NOT NULL,
    target_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    target_folder_id TEXT NOT NULL,
    status transfer_status_enum DEFAULT 'pending' NOT NULL,
    progress_percentage INT DEFAULT 0 NOT NULL,
    bytes_transferred BIGINT DEFAULT 0 NOT NULL,
    error_message TEXT,
    bullmq_job_id TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE public.sync_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    source_folder_id TEXT NOT NULL,
    target_account_id UUID NOT NULL REFERENCES public.connected_accounts(id) ON DELETE CASCADE,
    target_folder_id TEXT NOT NULL,
    sync_direction sync_direction_enum DEFAULT 'one_way' NOT NULL,
    cron_expression TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read and update their own profile"
    ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users access own connected accounts"
    ON public.connected_accounts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own files cache"
    ON public.file_items FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own transfer jobs"
    ON public.transfer_jobs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users access own sync schedules"
    ON public.sync_schedules FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Strict isolated vault policy"
    ON public.credential_vault FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.connected_accounts ca
        WHERE ca.id = credential_vault.account_id AND ca.user_id = auth.uid()
    ));

-- Index vector HNSW dibuat pada Fase 7 (semantic search).
