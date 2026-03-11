ALTER TABLE terrain
ADD COLUMN IF NOT EXISTS user_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'terrain_user_id_fkey'
    ) THEN
        ALTER TABLE terrain
        ADD CONSTRAINT terrain_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_terrain_user_id
ON terrain(user_id);
