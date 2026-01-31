-- Onceline MVP Schema

-- Timelines table (one per user for MVP)
CREATE TABLE timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Life',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events on the timeline
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Date handling (flexible - can be just a year, or full date)
  start_date DATE,
  end_date DATE,
  date_precision TEXT DEFAULT 'day', -- 'year', 'month', 'day'
  
  -- For age-based events when exact date unknown
  age_start INT,
  age_end INT,
  
  -- Categorization
  category TEXT, -- 'birth', 'education', 'residence', 'work', 'travel', 'relationship', 'milestone', 'memory'
  tags TEXT[],
  
  -- Source tracking
  source TEXT DEFAULT 'chat', -- 'chat', 'manual', 'photo', 'import'
  
  -- For ordering when dates overlap
  sort_order INT DEFAULT 0,
  
  -- Privacy for future sharing feature
  is_private BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages for context
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_id UUID REFERENCES timelines(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,
  
  -- Track which events were created from this message
  created_event_ids UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_timeline ON events(timeline_id);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_chat_timeline ON chat_messages(timeline_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timelines_updated_at
  BEFORE UPDATE ON timelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
