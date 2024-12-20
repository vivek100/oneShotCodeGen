CREATE TABLE IF NOT EXISTS public.app_20241219_001418_expenses (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL UNIQUE,
    amount DOUBLE PRECISION NOT NULL,
    category_id UUID NOT NULL,
    FOREIGN KEY (category_id) REFERENCES public.app_20241219_001418_categories(id) ON DELETE CASCADE ON UPDATE CASCADE,
    user_id UUID NOT NULL,
    FOREIGN KEY (user_id) REFERENCES public.app_20241219_001418_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID DEFAULT auth.uid(),
    CHECK (amount >= 0)
);

    -- Create trigger function if it doesn't exist
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Create trigger for app_20241219_001418_expenses
    DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.app_20241219_001418_expenses;
    CREATE TRIGGER update_expenses_updated_at
        BEFORE UPDATE ON public.app_20241219_001418_expenses
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
CREATE INDEX IF NOT EXISTS idx_expense_category ON public.app_20241219_001418_expenses (category_id);
CREATE INDEX IF NOT EXISTS idx_expense_user ON public.app_20241219_001418_expenses (user_id);

-- Grant permissions
GRANT ALL ON public.app_20241219_001418_expenses TO authenticated;
GRANT SELECT ON public.app_20241219_001418_expenses TO anon;
