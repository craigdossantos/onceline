# Photo Features - Design Doc
*2026-02-02*

## Overview
Add photos to life events - from device uploads, Google Photos, or web fallback.

---

## Phase 1: MVP Photo Upload (Today)

### Features
1. **Upload from device** - tap event card → add photo
2. **EXIF extraction** - auto-detect date, GPS location from photo metadata
3. **Photo display** - show on event cards and detail view
4. **Storage** - Supabase Storage bucket

### Database Changes
```sql
-- Add to events table
ALTER TABLE events ADD COLUMN image_url TEXT;
ALTER TABLE events ADD COLUMN image_metadata JSONB;
-- metadata: { exif_date, gps_lat, gps_lng, camera, etc }
```

### Supabase Storage
- Bucket: `event-photos`
- Path: `{user_id}/{event_id}/{filename}`
- Public URLs for display
- RLS: users can only access their own photos

### Client Implementation
```typescript
// Use exifr for metadata extraction
import exifr from 'exifr';

const extractMetadata = async (file: File) => {
  const exif = await exifr.parse(file);
  return {
    dateTaken: exif?.DateTimeOriginal,
    gpsLat: exif?.latitude,
    gpsLng: exif?.longitude,
    camera: exif?.Model,
  };
};
```

### UI Changes
1. **EventDetail.tsx** - Add photo upload button + display
2. **TimelineView.tsx** - Show thumbnail on event cards
3. **ChatBar.tsx** - Allow photo attachment in chat (AI extracts event from photo)

### Smart Date Detection
When user uploads photo:
1. Extract EXIF date
2. If creating new event → pre-fill date from EXIF
3. If existing event has no date → suggest EXIF date
4. Show: "This photo was taken on June 15, 2018 - use this date?"

---

## Phase 2: Google Photos Integration

### OAuth Flow
1. User clicks "Connect Google Photos"
2. Redirect to Google OAuth consent screen
3. Request scopes:
   - `https://www.googleapis.com/auth/photoslibrary.readonly`
4. Store refresh token in Supabase (encrypted)
5. Use access token to fetch photos

### API Endpoints

#### GET /api/photos/google/connect
Initiates OAuth flow, redirects to Google.

#### GET /api/photos/google/callback
Handles OAuth callback, stores tokens.

#### GET /api/photos/google/albums
Lists user's albums.
```json
{
  "albums": [
    { "id": "abc", "title": "2018 Graduation", "coverUrl": "...", "itemCount": 45 }
  ]
}
```

#### GET /api/photos/google/search
Search photos by date range or content.
```json
// Request
{ "startDate": "2018-01-01", "endDate": "2018-12-31" }

// Response
{
  "photos": [
    { "id": "xyz", "url": "...", "dateTaken": "2018-06-15", "location": {...} }
  ]
}
```

### Smart Suggestions
When user creates an event:
1. Query Google Photos for that date range (±7 days)
2. Show carousel: "Found 12 photos from around this time"
3. User picks one → we copy to Supabase Storage (don't hotlink Google URLs)

### Database
```sql
-- Store Google Photos connection
CREATE TABLE user_photo_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  provider TEXT NOT NULL, -- 'google_photos'
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Phase 3: Web Image Fallback

### Use Cases
- User mentions school but has no photo → show school building
- User mentions city → show landmark
- User mentions event type → show relevant stock image

### Implementation Options

#### Option A: Unsplash API (Recommended for MVP)
- Free for most uses
- High quality photos
- Simple API: `GET /search/photos?query=stanford+university`

#### Option B: Google Custom Search
- More comprehensive
- Requires billing setup
- Can find specific places/buildings

#### Option C: AI-Generated Contextual Images
- Use DALL-E or Midjourney API
- Generate period-appropriate images
- "Generate a 1990s graduation scene"

### UI Flow
1. Event has no photo
2. Show subtle prompt: "Add a photo to this memory"
3. Options: "Upload" | "Search web" | "Browse Google Photos"
4. Web search shows results, user picks one
5. We store copy in our storage (respect licensing)

---

## Phase 4: Photo-First Event Creation

### Flow
1. User uploads photo (or selects from Google Photos)
2. We extract: EXIF date, location, faces (optional)
3. AI analyzes image + metadata
4. AI asks: "This looks like a graduation photo from June 2018 in Palo Alto. What was this moment?"
5. User describes → event created with photo attached

### AI Prompt
```
Analyze this photo and its metadata:
- Date taken: {exif_date}
- Location: {gps_coords} ({reverse_geocoded})
- Detected: {faces_count} people

Based on visual elements and context, suggest:
1. What type of event this might be
2. A title for this memory
3. Follow-up questions to ask the user
```

---

## Technical Considerations

### Image Optimization
- Resize on upload (max 2000px)
- Generate thumbnails (400px for cards)
- Use WebP format
- Lazy load in timeline

### Privacy
- Photos stored per-user, RLS enforced
- Google Photos: read-only access, user can disconnect anytime
- Web images: clearly mark as "stock" vs personal
- EXIF GPS data: ask before using ("Use photo location?")

### Storage Costs
- Supabase Storage: $0.021/GB/month
- Estimate: 500KB average per photo
- 1000 photos = 500MB = ~$0.01/month per user

---

## Implementation Order

1. **Today**: MVP upload + EXIF + display
2. **This week**: Photo-first chat flow ("upload a photo to add a memory")
3. **Next week**: Google Photos OAuth + browse
4. **Later**: Web fallback, AI analysis, smart suggestions

---

## Dependencies to Add
```bash
pnpm add exifr  # EXIF extraction (lightweight, 47KB)
```

## Environment Variables
```
# For Google Photos (Phase 2)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_PHOTOS_REDIRECT_URI=

# For Unsplash (Phase 3)
UNSPLASH_ACCESS_KEY=
```
