
    -- Auto-generated view for Aggregates total expenses by category
    CREATE OR REPLACE VIEW public.app_20241219_001418_category_totals AS
    SELECT c.name as category_name, SUM(e.amount) as total_amount
    FROM  public.app_20241219_001418_expenses  e JOIN  public.app_20241219_001418_categories  c ON e.category_id = c.id
WHERE c.name IS NOT NULL
GROUP BY c.name;

    -- Grant permissions
    GRANT SELECT ON public.app_20241219_001418_category_totals TO authenticated;
    GRANT SELECT ON public.app_20241219_001418_category_totals TO anon;
    