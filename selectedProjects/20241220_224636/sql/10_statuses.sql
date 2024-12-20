CREATE TABLE IF NOT EXISTS public.app_20241220_224636_statuses (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
    status VARCHAR NOT NULL UNIQUE,
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

    -- Create trigger for app_20241220_224636_statuses
    DROP TRIGGER IF EXISTS update_statuses_updated_at ON public.app_20241220_224636_statuses;
    CREATE TRIGGER update_statuses_updated_at
        BEFORE UPDATE ON public.app_20241220_224636_statuses
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
CREATE UNIQUE INDEX IF NOT EXISTS idx_status_name ON public.app_20241220_224636_statuses (status);

-- Grant permissions
GRANT ALL ON public.app_20241220_224636_statuses TO authenticated;
GRANT SELECT ON public.app_20241220_224636_statuses TO anon;
