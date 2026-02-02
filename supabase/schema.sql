-- ============================================================================
-- Onceline Multi-Timeline Collaboration Schema
-- ============================================================================
-- Run this in Supabase SQL Editor to set up the complete schema
-- Supports: personal timelines, shared timelines, event linking, RLS, realtime
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Timeline member roles
CREATE TYPE timeline_role AS ENUM ('owner', 'editor', 'viewer');

-- Timeline visibility
CREATE TYPE timeline_visibility AS ENUM ('private', 'shared', 'public');

-- ============================================================================
-- HELPER FUNCTION: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: users (extends auth.users)
-- ============================================================================
-- Profile data for authenticated users

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- Trigger for updated_at
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- ============================================================================
-- TABLE: timelines
-- ============================================================================
-- Personal and shared timelines

CREATE TABLE timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',  -- Default blue
    icon TEXT DEFAULT '📅',
    visibility timeline_visibility DEFAULT 'private' NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,  -- User's primary personal timeline
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for creator lookups
CREATE INDEX idx_timelines_created_by ON timelines(created_by);

-- Trigger for updated_at
CREATE TRIGGER timelines_updated_at
    BEFORE UPDATE ON timelines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE timelines;

-- ============================================================================
-- TABLE: timeline_members
-- ============================================================================
-- Junction table for timeline access with roles

CREATE TABLE timeline_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role timeline_role NOT NULL DEFAULT 'viewer',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Each user can only be a member once per timeline
    UNIQUE(timeline_id, user_id)
);

-- Indexes for common queries
CREATE INDEX idx_timeline_members_timeline ON timeline_members(timeline_id);
CREATE INDEX idx_timeline_members_user ON timeline_members(user_id);
CREATE INDEX idx_timeline_members_role ON timeline_members(role);

-- Trigger for updated_at
CREATE TRIGGER timeline_members_updated_at
    BEFORE UPDATE ON timeline_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_members;

-- ============================================================================
-- TABLE: events
-- ============================================================================
-- Events belong to ONE canonical timeline

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Temporal data
    event_date DATE NOT NULL,
    event_time TIME,  -- NULL for all-day events
    end_date DATE,    -- For multi-day events
    end_time TIME,
    is_all_day BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    location TEXT,
    url TEXT,
    color TEXT,  -- Override timeline color
    icon TEXT,   -- Override timeline icon
    tags TEXT[], -- Array of tags for filtering
    metadata JSONB DEFAULT '{}',  -- Flexible extra data
    
    -- Ownership
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_events_timeline ON events(timeline_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_date_range ON events(event_date, end_date);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_tags ON events USING GIN(tags);

-- Trigger for updated_at
CREATE TRIGGER events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- ============================================================================
-- TABLE: event_links
-- ============================================================================
-- Links events to appear on additional timelines (not the canonical one)

CREATE TABLE event_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    
    -- Link metadata
    linked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT,  -- Optional note about why it's linked
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Each event can only be linked once to each timeline
    UNIQUE(event_id, timeline_id)
);

-- Indexes
CREATE INDEX idx_event_links_event ON event_links(event_id);
CREATE INDEX idx_event_links_timeline ON event_links(timeline_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE event_links;

-- ============================================================================
-- CONSTRAINT: Prevent linking to canonical timeline
-- ============================================================================

CREATE OR REPLACE FUNCTION check_event_link_not_canonical()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM events 
        WHERE id = NEW.event_id 
        AND timeline_id = NEW.timeline_id
    ) THEN
        RAISE EXCEPTION 'Cannot link event to its canonical timeline';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_links_not_canonical
    BEFORE INSERT OR UPDATE ON event_links
    FOR EACH ROW
    EXECUTE FUNCTION check_event_link_not_canonical();

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Check if user is a member of a timeline (any role)
CREATE OR REPLACE FUNCTION is_timeline_member(p_timeline_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM timeline_members
        WHERE timeline_id = p_timeline_id
        AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific role or higher on a timeline
-- Hierarchy: owner > editor > viewer
CREATE OR REPLACE FUNCTION has_timeline_role(
    p_timeline_id UUID, 
    p_user_id UUID, 
    p_min_role timeline_role
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role timeline_role;
BEGIN
    SELECT role INTO v_role
    FROM timeline_members
    WHERE timeline_id = p_timeline_id
    AND user_id = p_user_id;
    
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Role hierarchy check
    CASE p_min_role
        WHEN 'viewer' THEN
            RETURN TRUE;  -- Any role satisfies viewer
        WHEN 'editor' THEN
            RETURN v_role IN ('editor', 'owner');
        WHEN 'owner' THEN
            RETURN v_role = 'owner';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can view a timeline (member OR public)
CREATE OR REPLACE FUNCTION can_view_timeline(p_timeline_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM timelines t
        LEFT JOIN timeline_members tm ON t.id = tm.timeline_id AND tm.user_id = p_user_id
        WHERE t.id = p_timeline_id
        AND (t.visibility = 'public' OR tm.id IS NOT NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY: users
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read any profile (for collaboration features)
CREATE POLICY users_select ON users
    FOR SELECT
    USING (TRUE);

-- Users can only update their own profile
CREATE POLICY users_update ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY users_insert ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY users_delete ON users
    FOR DELETE
    USING (auth.uid() = id);

-- ============================================================================
-- ROW LEVEL SECURITY: timelines
-- ============================================================================

ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

-- Can view timeline if: public, OR user is a member
CREATE POLICY timelines_select ON timelines
    FOR SELECT
    USING (
        visibility = 'public'
        OR is_timeline_member(id, auth.uid())
    );

-- Only owners can update timeline metadata
CREATE POLICY timelines_update ON timelines
    FOR UPDATE
    USING (has_timeline_role(id, auth.uid(), 'owner'))
    WITH CHECK (has_timeline_role(id, auth.uid(), 'owner'));

-- Any authenticated user can create a timeline
CREATE POLICY timelines_insert ON timelines
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Only owners can delete timelines
CREATE POLICY timelines_delete ON timelines
    FOR DELETE
    USING (has_timeline_role(id, auth.uid(), 'owner'));

-- ============================================================================
-- ROW LEVEL SECURITY: timeline_members
-- ============================================================================

ALTER TABLE timeline_members ENABLE ROW LEVEL SECURITY;

-- Can see members if you're also a member (or timeline is public)
CREATE POLICY timeline_members_select ON timeline_members
    FOR SELECT
    USING (
        is_timeline_member(timeline_id, auth.uid())
        OR EXISTS (
            SELECT 1 FROM timelines 
            WHERE id = timeline_id 
            AND visibility = 'public'
        )
    );

-- Owners can add members, editors can invite viewers
CREATE POLICY timeline_members_insert ON timeline_members
    FOR INSERT
    WITH CHECK (
        -- Owner can add anyone
        has_timeline_role(timeline_id, auth.uid(), 'owner')
        OR 
        -- Editor can only add viewers
        (has_timeline_role(timeline_id, auth.uid(), 'editor') AND role = 'viewer')
    );

-- Only owners can update member roles
CREATE POLICY timeline_members_update ON timeline_members
    FOR UPDATE
    USING (has_timeline_role(timeline_id, auth.uid(), 'owner'))
    WITH CHECK (has_timeline_role(timeline_id, auth.uid(), 'owner'));

-- Owners can remove anyone; users can remove themselves
CREATE POLICY timeline_members_delete ON timeline_members
    FOR DELETE
    USING (
        has_timeline_role(timeline_id, auth.uid(), 'owner')
        OR user_id = auth.uid()
    );

-- ============================================================================
-- ROW LEVEL SECURITY: events
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Can view event if can view its timeline
CREATE POLICY events_select ON events
    FOR SELECT
    USING (can_view_timeline(timeline_id, auth.uid()));

-- Editors and owners can create events
CREATE POLICY events_insert ON events
    FOR INSERT
    WITH CHECK (
        has_timeline_role(timeline_id, auth.uid(), 'editor')
        AND created_by = auth.uid()
    );

-- Editors and owners can update events
CREATE POLICY events_update ON events
    FOR UPDATE
    USING (has_timeline_role(timeline_id, auth.uid(), 'editor'))
    WITH CHECK (has_timeline_role(timeline_id, auth.uid(), 'editor'));

-- Owners can delete any event; editors can delete their own
CREATE POLICY events_delete ON events
    FOR DELETE
    USING (
        has_timeline_role(timeline_id, auth.uid(), 'owner')
        OR (
            has_timeline_role(timeline_id, auth.uid(), 'editor')
            AND created_by = auth.uid()
        )
    );

-- ============================================================================
-- ROW LEVEL SECURITY: event_links
-- ============================================================================

ALTER TABLE event_links ENABLE ROW LEVEL SECURITY;

-- Can see link if can view the target timeline
CREATE POLICY event_links_select ON event_links
    FOR SELECT
    USING (can_view_timeline(timeline_id, auth.uid()));

-- Editors/owners of target timeline can create links
-- Must also be able to view the source event
CREATE POLICY event_links_insert ON event_links
    FOR INSERT
    WITH CHECK (
        has_timeline_role(timeline_id, auth.uid(), 'editor')
        AND EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = event_id
            AND can_view_timeline(e.timeline_id, auth.uid())
        )
    );

-- Editors/owners of target timeline can remove links
CREATE POLICY event_links_delete ON event_links
    FOR DELETE
    USING (has_timeline_role(timeline_id, auth.uid(), 'editor'));

-- ============================================================================
-- FUNCTION: Create user profile on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- FUNCTION: Create default personal timeline for new user
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_timeline_for_user()
RETURNS TRIGGER AS $$
DECLARE
    v_timeline_id UUID;
BEGIN
    -- Create the default timeline
    INSERT INTO timelines (name, description, is_default, created_by, visibility)
    VALUES (
        'My Timeline',
        'Your personal timeline',
        TRUE,
        NEW.id,
        'private'
    )
    RETURNING id INTO v_timeline_id;
    
    -- Add user as owner
    INSERT INTO timeline_members (timeline_id, user_id, role)
    VALUES (v_timeline_id, NEW.id, 'owner');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger after user profile is created
CREATE OR REPLACE TRIGGER on_user_created_timeline
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_timeline_for_user();

-- ============================================================================
-- FUNCTION: Auto-add creator as owner when timeline is created
-- ============================================================================

CREATE OR REPLACE FUNCTION add_timeline_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
    -- Only if created_by is set and not already a member
    IF NEW.created_by IS NOT NULL THEN
        INSERT INTO timeline_members (timeline_id, user_id, role)
        VALUES (NEW.id, NEW.created_by, 'owner')
        ON CONFLICT (timeline_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_timeline_created
    AFTER INSERT ON timelines
    FOR EACH ROW
    EXECUTE FUNCTION add_timeline_creator_as_owner();

-- ============================================================================
-- VIEW: Events with linked timelines (for querying)
-- ============================================================================

CREATE OR REPLACE VIEW events_with_timelines AS
SELECT 
    e.*,
    e.timeline_id AS canonical_timeline_id,
    e.timeline_id AS visible_on_timeline_id,
    FALSE AS is_linked
FROM events e
UNION ALL
SELECT 
    e.*,
    e.timeline_id AS canonical_timeline_id,
    el.timeline_id AS visible_on_timeline_id,
    TRUE AS is_linked
FROM events e
INNER JOIN event_links el ON e.id = el.event_id;

-- ============================================================================
-- FUNCTION: Get all events visible on a timeline (canonical + linked)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_timeline_events(
    p_timeline_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    timeline_id UUID,
    canonical_timeline_id UUID,
    is_linked BOOLEAN,
    title TEXT,
    description TEXT,
    event_date DATE,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    is_all_day BOOLEAN,
    location TEXT,
    url TEXT,
    color TEXT,
    icon TEXT,
    tags TEXT[],
    metadata JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        p_timeline_id AS timeline_id,
        e.timeline_id AS canonical_timeline_id,
        FALSE AS is_linked,
        e.title,
        e.description,
        e.event_date,
        e.event_time,
        e.end_date,
        e.end_time,
        e.is_all_day,
        e.location,
        e.url,
        e.color,
        e.icon,
        e.tags,
        e.metadata,
        e.created_by,
        e.created_at,
        e.updated_at
    FROM events e
    WHERE e.timeline_id = p_timeline_id
    AND (p_start_date IS NULL OR e.event_date >= p_start_date OR e.end_date >= p_start_date)
    AND (p_end_date IS NULL OR e.event_date <= p_end_date)
    
    UNION ALL
    
    SELECT 
        e.id,
        p_timeline_id AS timeline_id,
        e.timeline_id AS canonical_timeline_id,
        TRUE AS is_linked,
        e.title,
        e.description,
        e.event_date,
        e.event_time,
        e.end_date,
        e.end_time,
        e.is_all_day,
        e.location,
        e.url,
        e.color,
        e.icon,
        e.tags,
        e.metadata,
        e.created_by,
        e.created_at,
        e.updated_at
    FROM events e
    INNER JOIN event_links el ON e.id = el.event_id
    WHERE el.timeline_id = p_timeline_id
    AND (p_start_date IS NULL OR e.event_date >= p_start_date OR e.end_date >= p_start_date)
    AND (p_end_date IS NULL OR e.event_date <= p_end_date)
    
    ORDER BY event_date, event_time NULLS FIRST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get user's accessible timelines
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_timelines(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    color TEXT,
    icon TEXT,
    visibility timeline_visibility,
    is_default BOOLEAN,
    role timeline_role,
    member_count BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.description,
        t.color,
        t.icon,
        t.visibility,
        t.is_default,
        tm.role,
        (SELECT COUNT(*) FROM timeline_members WHERE timeline_id = t.id) AS member_count,
        t.created_at
    FROM timelines t
    INNER JOIN timeline_members tm ON t.id = tm.timeline_id
    WHERE tm.user_id = p_user_id
    ORDER BY t.is_default DESC, t.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS (for authenticated users via Supabase)
-- ============================================================================

-- These are typically handled by Supabase's default role setup
-- but included for completeness

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- Done! 🎉
-- ============================================================================
-- 
-- Summary of tables:
--   • users          - User profiles (extends auth.users)
--   • timelines      - Personal and shared timelines
--   • timeline_members - Who can access what timeline (with roles)
--   • events         - Events belong to ONE canonical timeline
--   • event_links    - Links to show events on additional timelines
--
-- Key features:
--   • RLS policies enforce access control at the database level
--   • Realtime enabled on all tables for live collaboration
--   • Helper functions for common queries
--   • Automatic user/timeline setup on signup
--   • Role hierarchy: owner > editor > viewer
--
-- Usage examples:
--   
--   -- Get all events for a timeline (including linked)
--   SELECT * FROM get_timeline_events('timeline-uuid');
--   
--   -- Get user's timelines with their role
--   SELECT * FROM get_user_timelines(auth.uid());
--   
--   -- Link an event to another timeline
--   INSERT INTO event_links (event_id, timeline_id, linked_by)
--   VALUES ('event-uuid', 'target-timeline-uuid', auth.uid());
--
-- ============================================================================
