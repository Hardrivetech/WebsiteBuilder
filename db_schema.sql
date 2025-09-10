-- Websites table
-- Each user can have multiple websites.
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) for the websites table
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own websites.
CREATE POLICY "Users can view their own websites"
ON websites FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create websites for themselves.
CREATE POLICY "Users can create their own websites"
ON websites FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own websites.
CREATE POLICY "Users can update their own websites"
ON websites FOR UPDATE
USING (auth.uid() = user_id);


-- Pages table
-- Each website can have multiple pages.
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL, -- e.g., 'about', 'contact'. '/' for homepage.
  content JSONB, -- Flexible block-based content for the page editor
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (website_id, slug)
);

-- Enable RLS for the pages table
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- We need a helper function to check ownership through the websites table
CREATE OR REPLACE FUNCTION is_page_owner(page_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM pages p
    JOIN websites w ON p.website_id = w.id
    WHERE p.id = page_id AND w.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Policy: Users can manage pages of websites they own.
CREATE POLICY "Users can manage pages for their own websites"
ON pages FOR ALL
USING (is_page_owner(id));