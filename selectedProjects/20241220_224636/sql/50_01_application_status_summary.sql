
    -- Auto-generated view for Summary view of job application statuses
    CREATE OR REPLACE VIEW public.app_20241220_224636_application_status_summary AS
    SELECT status as status, COUNT(id) as count
    FROM  public.app_20241220_224636_job_applications 
WHERE TRUE
GROUP BY status;

    -- Grant permissions
    GRANT SELECT ON public.app_20241220_224636_application_status_summary TO authenticated;
    GRANT SELECT ON public.app_20241220_224636_application_status_summary TO anon;
    