-- Migration : champs personnalisés du formulaire d'inscription
-- Remplace la colonne JSON `custom_fields` sur la table `associations`
-- par une table dédiée `association_custom_fields`.
--
-- Endpoints attendus côté backend après migration :
--   GET    /admin/association/:id/custom-fields            → { data: { fields: CustomField[] } }
--   POST   /admin/association/:id/custom-fields            → { data: { field: CustomField } }
--   PUT    /admin/association/:id/custom-fields/:fieldId   → { data: { field: CustomField } }
--   DELETE /admin/association/:id/custom-fields/:fieldId   → { message: string }
--   PATCH  /admin/association/:id/custom-fields/reorder    → body: { ids: string[] }
--
--   GET public (formulaire) : /associations/inscription/:slug
--   → doit toujours retourner customFields: CustomField[] dans la réponse de l'association

-- ── 1. Création de la table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS association_custom_fields (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id  UUID         NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
  label           VARCHAR(255) NOT NULL,
  type            VARCHAR(50)  NOT NULL
                    CHECK (type IN ('text','email','tel','date','textarea','select','checkbox')),
  required        BOOLEAN      NOT NULL DEFAULT false,
  placeholder     VARCHAR(255),
  options         JSONB,        -- utilisé uniquement pour type = 'select', ex: ["Option A","Option B"]
  sort_order      INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_acf_association_order
  ON association_custom_fields (association_id, sort_order);

-- ── 2. Migration des données existantes ──────────────────────────────────
-- Suppose que la colonne s'appelle `custom_fields` (JSONB) sur la table `associations`.
-- Chaque ligne du tableau JSON correspond à un CustomField :
--   { id, label, type, required, placeholder?, options?: string[] }

INSERT INTO association_custom_fields
  (id, association_id, label, type, required, placeholder, options, sort_order)
SELECT
  CASE
    WHEN (f->>'id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN (f->>'id')::UUID
    ELSE gen_random_uuid()
  END,
  a.id,
  f->>'label',
  f->>'type',
  COALESCE((f->>'required')::BOOLEAN, false),
  NULLIF(f->>'placeholder', ''),
  CASE
    WHEN f->'options' IS NOT NULL AND jsonb_typeof(f->'options') = 'array'
      AND jsonb_array_length(f->'options') > 0
    THEN f->'options'
    ELSE NULL
  END,
  (ord - 1)::INT
FROM associations a,
     jsonb_array_elements(a.custom_fields) WITH ORDINALITY t(f, ord)
WHERE a.custom_fields IS NOT NULL
  AND jsonb_typeof(a.custom_fields) = 'array'
  AND jsonb_array_length(a.custom_fields) > 0
ON CONFLICT (id) DO NOTHING;

-- ── 3. Suppression de l'ancienne colonne ─────────────────────────────────
-- À exécuter APRÈS avoir vérifié que la migration est correcte
-- et que le backend lit depuis association_custom_fields.

-- ALTER TABLE associations DROP COLUMN IF EXISTS custom_fields;
