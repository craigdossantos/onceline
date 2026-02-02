import exifr from 'exifr'
import { supabase } from './supabase'

export interface PhotoMetadata {
  dateTaken?: string
  gpsLat?: number
  gpsLng?: number
  camera?: string
  width?: number
  height?: number
}

export async function extractPhotoMetadata(file: File): Promise<PhotoMetadata> {
  try {
    const exif = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'latitude', 'longitude', 'Model', 'ImageWidth', 'ImageHeight']
    })
    
    if (!exif) return {}
    
    return {
      dateTaken: exif.DateTimeOriginal?.toISOString?.() || undefined,
      gpsLat: exif.latitude,
      gpsLng: exif.longitude,
      camera: exif.Model,
      width: exif.ImageWidth,
      height: exif.ImageHeight,
    }
  } catch (error) {
    console.error('Failed to extract EXIF:', error)
    return {}
  }
}

export async function uploadEventPhoto(
  file: File,
  userId: string,
  eventId: string
): Promise<{ url: string; metadata: PhotoMetadata } | null> {
  try {
    // Extract metadata first
    const metadata = await extractPhotoMetadata(file)
    
    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}/${eventId}/${Date.now()}.${ext}`
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('event-photos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Upload error:', error)
      return null
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('event-photos')
      .getPublicUrl(data.path)
    
    return { url: publicUrl, metadata }
  } catch (error) {
    console.error('Photo upload failed:', error)
    return null
  }
}

export async function deleteEventPhoto(url: string): Promise<boolean> {
  try {
    // Extract path from URL
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(/\/event-photos\/(.+)$/)
    if (!pathMatch) return false
    
    const path = pathMatch[1]
    
    const { error } = await supabase.storage
      .from('event-photos')
      .remove([path])
    
    return !error
  } catch (error) {
    console.error('Photo delete failed:', error)
    return false
  }
}

// Resize image client-side before upload (max 2000px)
export async function resizeImage(file: File, maxSize = 2000): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    img.onload = () => {
      let { width, height } = img
      
      // Only resize if larger than maxSize
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
      }
      
      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        0.85
      )
    }
    
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}
