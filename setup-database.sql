-- ============================================
-- LinkSnap - Script SQL (versão simplificada)
-- Execute TUDO de uma vez no SQL Editor do Supabase
-- ============================================

-- 1) Criar a tabela
CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    clicks INTEGER DEFAULT 0
);

-- 2) Criar o índice
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);

-- 3) Habilitar segurança
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- 4) Criar as políticas de acesso (usando DROP IF EXISTS para evitar erro se já existirem)
DROP POLICY IF EXISTS "Allow public insert" ON links;
CREATE POLICY "Allow public insert" ON links
    FOR INSERT TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select" ON links;
CREATE POLICY "Allow public select" ON links
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow public update clicks" ON links;
CREATE POLICY "Allow public update clicks" ON links
    FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);
