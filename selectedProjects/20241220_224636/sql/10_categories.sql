CREATE TABLE IF NOT EXISTS public.app_20241220_224636_categories (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
    name VARCHAR NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID DEFAULT auth.uid()
);

    -- Create trigger function if it doesn't exist
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create trigger for app_20241220_224636_categories
    DROP TRIGGER IF EXISTS update_categories_updated_at ON public.app_20241220_224636_categories;
    CREATE TRIGGER update_categories_updated_at
        BEFORE UPDATE ON public.app_20241220_224636_categories
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_name ON public.app_20241220_224636_categories (name);

-- Grant permissions
GRANT ALL ON public.app_20241220_224636_categories TO authenticated;
GRANT SELECT ON public.app_20241220_224636_categories TO anon;
