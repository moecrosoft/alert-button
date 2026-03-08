-- =============================================================================
-- Non-urgent reports (matches Reports page "Non-Urgent" filter)
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================================
-- The app stores classification as: "Non-Urgent", "Not Urgent", or "non-urgent"
-- This query returns rows that show under the Non-Urgent tab.
-- =============================================================================

SELECT
  id,
  created_at,
  title,
  classification,
  confidence,
  summary,
  status,
  has_video,
  transcript,
  video_analysis
FROM reports
WHERE LOWER(TRIM(classification)) IN ('non-urgent', 'not urgent')
ORDER BY created_at DESC;
