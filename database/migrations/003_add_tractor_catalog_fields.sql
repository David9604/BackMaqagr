ALTER TABLE tractor
ADD COLUMN IF NOT EXISTS model_year INTEGER;

ALTER TABLE tractor
ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION;

UPDATE tractor
SET model_year = COALESCE(model_year, EXTRACT(YEAR FROM registration_date)::INTEGER);

UPDATE tractor
SET price = COALESCE(
    price,
    CASE
        WHEN brand = 'John Deere' AND model = '5075E' THEN 65000
        WHEN brand = 'Massey Ferguson' AND model = '4709' THEN 72000
        WHEN brand = 'New Holland' AND model = 'TT3.55' THEN 54000
        ELSE NULL
    END
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tractor_model_year_valid'
    ) THEN
        ALTER TABLE tractor
        ADD CONSTRAINT tractor_model_year_valid
        CHECK (model_year IS NULL OR model_year BETWEEN 1900 AND 2100);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'tractor_price_valid'
    ) THEN
        ALTER TABLE tractor
        ADD CONSTRAINT tractor_price_valid
        CHECK (price IS NULL OR price > 0);
    END IF;
END $$;
