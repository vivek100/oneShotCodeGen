
    -- Create profiles table
    CREATE TABLE IF NOT EXISTS public.app_20241219_001418_profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id),
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Grant permissions
    GRANT ALL ON public.app_20241219_001418_profiles TO authenticated;
    GRANT SELECT ON public.app_20241219_001418_profiles TO anon;

    -- Create trigger for updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.app_20241219_001418_profiles;
    CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON public.app_20241219_001418_profiles
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    