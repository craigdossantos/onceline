import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Import a Google Photos image to our storage
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('google_photos_token')?.value
  
  if (!accessToken) {
    return NextResponse.json({ error: 'Not connected to Google Photos' }, { status: 401 })
  }
  
  const body = await request.json()
  const { photoId, eventId, userId } = body
  
  if (!photoId || !eventId || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  
  try {
    // Get the photo details from Google Photos
    const photoResponse = await fetch(
      `https://photoslibrary.googleapis.com/v1/mediaItems/${photoId}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    )
    
    if (!photoResponse.ok) {
      throw new Error('Failed to get photo from Google Photos')
    }
    
    const photoData = await photoResponse.json()
    
    // Download the full-size image
    const imageUrl = `${photoData.baseUrl}=w2000-h2000`
    const imageResponse = await fetch(imageUrl)
    
    if (!imageResponse.ok) {
      throw new Error('Failed to download image')
    }
    
    const imageBlob = await imageResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()
    
    // Upload to Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const filename = `${userId}/${eventId}/${Date.now()}.jpg`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('event-photos')
      .upload(filename, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error('Failed to upload to storage')
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('event-photos')
      .getPublicUrl(uploadData.path)
    
    // Extract metadata
    const metadata = {
      dateTaken: photoData.mediaMetadata?.creationTime,
      width: parseInt(photoData.mediaMetadata?.width || '0'),
      height: parseInt(photoData.mediaMetadata?.height || '0'),
      source: 'google_photos',
      originalId: photoId,
    }
    
    // Update the event with the photo
    const { error: updateError } = await supabase
      .from('events')
      .update({
        image_url: publicUrl,
        image_metadata: metadata,
      })
      .eq('id', eventId)
    
    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error('Failed to update event')
    }
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      metadata,
    })
    
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    )
  }
}
