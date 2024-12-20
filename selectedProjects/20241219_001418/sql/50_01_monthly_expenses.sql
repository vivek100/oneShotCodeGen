
    -- Auto-generated view for Aggregates total expenses per month
    CREATE OR REPLACE VIEW public.app_20241219_001418_monthly_expenses AS
    SELECT DATE_TRUNC('month', e.created_at) as month, SUM(e.amount) as total_expenses
    FROM  public.app_20241219_001418_expenses  e
WHERE e.created_at IS NOT NULL
GROUP BY DATE_TRUNC('month', e.created_at);

    -- Grant permissions
    GRANT SELECT ON public.app_20241219_001418_monthly_expenses TO authenticated;
    GRANT SELECT ON public.app_20241219_001418_monthly_expenses TO anon;
    