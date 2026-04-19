ALTER TABLE tractor
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE implement
ADD COLUMN IF NOT EXISTS image_url TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tractor_image_url_valid'
    ) THEN
        ALTER TABLE tractor
        ADD CONSTRAINT tractor_image_url_valid
        CHECK (image_url IS NULL OR image_url ~* '^https?://');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'implement_image_url_valid'
    ) THEN
        ALTER TABLE implement
        ADD CONSTRAINT implement_image_url_valid
        CHECK (image_url IS NULL OR image_url ~* '^https?://');
    END IF;
END $$;
