import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SYSTEM_PROMPT = `You are a friendly, warm assistant helping someone build their life timeline. Your job is to:

1. Ask thoughtful questions about their life to help them remember and document important moments
2. Extract timeline events from their answers
3. Be conversational and empathetic - this is their life story

When you identify events from their responses, include them in your response as JSON.

Categories for events:
- birth: Birth, birthdays
- education: Schools, degrees, courses
- residence: Places lived, moves
- work: Jobs, careers, businesses
- travel: Trips, vacations, moves
- relationship: Family, friends, romantic
- milestone: Achievements, life moments
- memory: General memories, stories

If the user mentions dates, ages, years, or time periods, extract them. If they say "when I was 5" or "in 2010", capture that.

Respond with a JSON object in this exact format:
{
  "message": "Your conversational response here",
  "events": [
    {
      "title": "Event title",
      "description": "Optional longer description",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null if ongoing/point event",
      "date_precision": "year|month|day",
      "age_start": number or null,
      "age_end": number or null,
      "category": "one of the categories above",
      "tags": ["optional", "tags"]
    }
  ]
}

If no events are mentioned, return an empty events array.

Start by warmly greeting them and asking where they were born and when, to establish the beginning of their timeline.`

export async function POST(request: NextRequest) {
  try {
    // Lazy load OpenAI to avoid build-time errors
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { timeline_id, messages, events } = await request.json()
    
    // Build context about existing events
    const eventContext = events.length > 0
      ? `\n\nTimeline so far (${events.length} events):\n${events.map((e: any) => 
          `- ${e.title} (${e.start_date || 'date unknown'}) [${e.category}]`
        ).join('\n')}`
      : '\n\nThis is a new timeline with no events yet.'
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: SYSTEM_PROMPT + eventContext
        },
        ...messages
      ],
      response_format: { type: 'json_object' }
    })
    
    const responseText = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(responseText)
    
    // Insert events if any
    const insertedEvents = []
    if (parsed.events && parsed.events.length > 0) {
      for (const event of parsed.events) {
        const { data } = await supabase
          .from('events')
          .insert({
            timeline_id,
            title: event.title,
            description: event.description,
            start_date: event.start_date,
            end_date: event.end_date,
            date_precision: event.date_precision || 'day',
            age_start: event.age_start,
            age_end: event.age_end,
            category: event.category,
            tags: event.tags || [],
            source: 'chat'
          })
          .select()
          .single()
        
        if (data) insertedEvents.push(data)
      }
    }
    
    return NextResponse.json({
      message: parsed.message,
      events: insertedEvents
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat', message: 'Sorry, something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
