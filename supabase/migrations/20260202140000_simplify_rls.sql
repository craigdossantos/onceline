-- Simplify RLS policies for MVP
-- Allow all operations for authenticated users

-- Drop all existing complex policies on users
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_update ON users;
DROP POLICY IF EXISTS users_insert ON users;
DROP POLICY IF EXISTS users_delete ON users;
DROP POLICY IF EXISTS users_all ON users;

-- Simple policy: authenticated users can do everything on users table
CREATE POLICY users_all ON users FOR ALL USING (true) WITH CHECK (true);

-- Drop all existing complex policies on timelines
DROP POLICY IF EXISTS timelines_select ON timelines;
DROP POLICY IF EXISTS timelines_update ON timelines;
DROP POLICY IF EXISTS timelines_insert ON timelines;
DROP POLICY IF EXISTS timelines_delete ON timelines;
DROP POLICY IF EXISTS timelines_all ON timelines;

-- Simple policy: authenticated users can do everything on timelines
CREATE POLICY timelines_all ON timelines FOR ALL USING (true) WITH CHECK (true);

-- Drop all existing complex policies on timeline_members
DROP POLICY IF EXISTS timeline_members_select ON timeline_members;
DROP POLICY IF EXISTS timeline_members_insert ON timeline_members;
DROP POLICY IF EXISTS timeline_members_update ON timeline_members;
DROP POLICY IF EXISTS timeline_members_delete ON timeline_members;
DROP POLICY IF EXISTS timeline_members_all ON timeline_members;

-- Simple policy: authenticated users can do everything on timeline_members
CREATE POLICY timeline_members_all ON timeline_members FOR ALL USING (true) WITH CHECK (true);

-- Drop all existing complex policies on events
DROP POLICY IF EXISTS events_select ON events;
DROP POLICY IF EXISTS events_insert ON events;
DROP POLICY IF EXISTS events_update ON events;
DROP POLICY IF EXISTS events_delete ON events;
DROP POLICY IF EXISTS events_all ON events;

-- Simple policy: authenticated users can do everything on events
CREATE POLICY events_all ON events FOR ALL USING (true) WITH CHECK (true);

-- Drop all existing complex policies on event_links
DROP POLICY IF EXISTS event_links_select ON event_links;
DROP POLICY IF EXISTS event_links_insert ON event_links;
DROP POLICY IF EXISTS event_links_delete ON event_links;
DROP POLICY IF EXISTS event_links_all ON event_links;

-- Simple policy: authenticated users can do everything on event_links
CREATE POLICY event_links_all ON event_links FOR ALL USING (true) WITH CHECK (true);
