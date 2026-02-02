-- Add chat_messages table for conversation history
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timeline_id UUID NOT NULL REFERENCES timelines(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_event_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for timeline lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_timeline ON chat_messages(timeline_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(timeline_id, created_at);

-- RLS - allow all for now (service role handles auth)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_messages_select ON chat_messages;
DROP POLICY IF EXISTS chat_messages_insert ON chat_messages;
DROP POLICY IF EXISTS chat_messages_delete ON chat_messages;
DROP POLICY IF EXISTS chat_messages_all ON chat_messages;
CREATE POLICY chat_messages_all ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Add missing columns to events table for chat-extracted events
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'start_date') THEN
        ALTER TABLE events ADD COLUMN start_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'date_precision') THEN
        ALTER TABLE events ADD COLUMN date_precision TEXT DEFAULT 'day';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'category') THEN
        ALTER TABLE events ADD COLUMN category TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'source') THEN
        ALTER TABLE events ADD COLUMN source TEXT DEFAULT 'manual';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'age_start') THEN
        ALTER TABLE events ADD COLUMN age_start INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'age_end') THEN
        ALTER TABLE events ADD COLUMN age_end INTEGER;
    END IF;
END $$;

-- Add user_id to timelines for simpler queries (no FK for now)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timelines' AND column_name = 'user_id') THEN
        ALTER TABLE timelines ADD COLUMN user_id UUID;
    END IF;
END $$;

-- RLS for events - allow all for now
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_all ON events;
CREATE POLICY events_all ON events FOR ALL USING (true) WITH CHECK (true);

-- RLS for timelines - allow all for now
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS timelines_all ON timelines;
CREATE POLICY timelines_all ON timelines FOR ALL USING (true) WITH CHECK (true);
