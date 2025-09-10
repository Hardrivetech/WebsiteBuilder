-- Delete table if it exists
DROP TABLE IF EXISTS sites;

-- Create a table to store site information
CREATE TABLE sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  createdAt INTEGER DEFAULT (strftime('%s', 'now'))
);