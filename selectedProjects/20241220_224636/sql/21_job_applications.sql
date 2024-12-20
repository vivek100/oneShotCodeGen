CREATE TABLE IF NOT EXISTS public.app_20241220_224636_job_applications (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
    job_title VARCHAR NOT NULL,
    company_name VARCHAR NOT NULL,
    application_date DATE NOT NULL,
    status VARCHAR NOT NULL,
    category_id UUID NOT NULL,
    FOREIGN KEY (category_id) REFERENCES public.app_20241220_224636_categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id UUID NOT NULL,
    FOREIGN KEY (user_id) REFERENCES public.app_20241220_224636_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
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

    -- Create trigger for app_20241220_224636_job_applications
    DROP TRIGGER IF EXISTS update_job_applications_updated_at ON public.app_20241220_224636_job_applications;
    CREATE TRIGGER update_job_applications_updated_at
        BEFORE UPDATE ON public.app_20241220_224636_job_applications
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
CREATE INDEX IF NOT EXISTS idx_application_category ON public.app_20241220_224636_job_applications (category_id);
CREATE INDEX IF NOT EXISTS idx_application_user ON public.app_20241220_224636_job_applications (user_id);

-- Grant permissions
GRANT ALL ON public.app_20241220_224636_job_applications TO authenticated;
GRANT SELECT ON public.app_20241220_224636_job_applications TO anon;
