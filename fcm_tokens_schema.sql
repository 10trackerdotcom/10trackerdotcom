-- FCM Tokens and User Enrollment Tracking Schema
-- This schema tracks FCM tokens, user enrollment sources, and categories

-- Main FCM tokens table
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  user_id TEXT, -- Optional: link to your users table (Clerk user ID or email)
  device_info JSONB, -- Store device information (browser, OS, etc.)
  enrollment_source TEXT, -- URL or page where user enrolled (e.g., '/articles', '/home', '/exams')
  enrollment_category TEXT, -- Category based on enrollment source (e.g., 'articles', 'home', 'exams', 'practice')
  enrollment_timestamp TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE, -- Mark as inactive if token becomes invalid
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON fcm_tokens(token);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_category ON fcm_tokens(enrollment_category);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_source ON fcm_tokens(enrollment_source);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_active ON fcm_tokens(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_category_active ON fcm_tokens(enrollment_category, is_active) WHERE is_active = TRUE;

-- View for enrollment statistics by category
CREATE OR REPLACE VIEW fcm_enrollment_stats AS
SELECT 
  enrollment_category,
  COUNT(*) as total_enrolled,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_tokens,
  COUNT(*) FILTER (WHERE is_active = FALSE) as inactive_tokens,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
  MIN(enrollment_timestamp) as first_enrollment,
  MAX(enrollment_timestamp) as last_enrollment
FROM fcm_tokens
GROUP BY enrollment_category;

-- View for enrollment statistics by source URL
CREATE OR REPLACE VIEW fcm_enrollment_by_source AS
SELECT 
  enrollment_source,
  enrollment_category,
  COUNT(*) as total_enrolled,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_tokens,
  MIN(enrollment_timestamp) as first_enrollment,
  MAX(enrollment_timestamp) as last_enrollment
FROM fcm_tokens
GROUP BY enrollment_source, enrollment_category;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fcm_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_fcm_tokens_timestamp
  BEFORE UPDATE ON fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_fcm_tokens_updated_at();

-- Function to get active tokens for a category (for batch sending)
CREATE OR REPLACE FUNCTION get_active_tokens_by_category(
  category_name TEXT,
  batch_size INT DEFAULT 100,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  token TEXT,
  user_id TEXT,
  enrollment_source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fcm_tokens.token,
    fcm_tokens.user_id,
    fcm_tokens.enrollment_source
  FROM fcm_tokens
  WHERE fcm_tokens.is_active = TRUE
    AND (category_name IS NULL OR fcm_tokens.enrollment_category = category_name)
  ORDER BY fcm_tokens.enrollment_timestamp DESC
  LIMIT batch_size
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get all active tokens (for sending to everyone)
CREATE OR REPLACE FUNCTION get_all_active_tokens(
  batch_size INT DEFAULT 100,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  token TEXT,
  user_id TEXT,
  enrollment_category TEXT,
  enrollment_source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fcm_tokens.token,
    fcm_tokens.user_id,
    fcm_tokens.enrollment_category,
    fcm_tokens.enrollment_source
  FROM fcm_tokens
  WHERE fcm_tokens.is_active = TRUE
  ORDER BY fcm_tokens.enrollment_timestamp DESC
  LIMIT batch_size
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert for anyone (users can save their own tokens)
CREATE POLICY "Allow insert fcm tokens" ON fcm_tokens
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow users to update their own tokens
CREATE POLICY "Allow update own fcm tokens" ON fcm_tokens
  FOR UPDATE
  USING (true); -- You can restrict this based on user_id if needed

-- Policy: Allow select for authenticated users (for admin panel)
CREATE POLICY "Allow select fcm tokens" ON fcm_tokens
  FOR SELECT
  USING (true); -- You can restrict this to admin users only

-- Policy: Allow delete (for cleanup)
CREATE POLICY "Allow delete fcm tokens" ON fcm_tokens
  FOR DELETE
  USING (true); -- You can restrict this to admin users only

-- Comments for documentation
COMMENT ON TABLE fcm_tokens IS 'Stores FCM push notification tokens with enrollment tracking';
COMMENT ON COLUMN fcm_tokens.enrollment_source IS 'The URL or page path where user enrolled (e.g., /articles, /home)';
COMMENT ON COLUMN fcm_tokens.enrollment_category IS 'Categorized enrollment source (e.g., articles, home, exams, practice)';
COMMENT ON VIEW fcm_enrollment_stats IS 'Statistics of user enrollments grouped by category';
COMMENT ON VIEW fcm_enrollment_by_source IS 'Statistics of user enrollments grouped by source URL and category';
