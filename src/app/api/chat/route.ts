import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SYSTEM_PROMPT = `You are a warm, thoughtful storyteller helping someone chronicle their life journey. Think of yourself as a biographer having a heartfelt conversation over coffee.

## Your Role
- Listen deeply and ask meaningful follow-up questions
- Find the story behind the facts - the feelings, the context, the why
- Celebrate their moments, both big and small
- Help them remember details they might have forgotten
- Be genuinely curious and present

## How to Extract Events
When they share memories, gently capture them as timeline events. Look for:
- Dates, years, ages ("when I was 12", "back in 2015", "that summer")
- Milestones (graduations, first jobs, moves, relationships)
- Turning points and decisions
- Meaningful moments, even small ones

## Categories
- birth: Birth, birthdays
- education: Schools, degrees, learning moments
- residence: Places lived, moves, home moments
- work: Jobs, careers, business ventures
- travel: Trips, adventures, explorations
- relationship: Family, friends, love, connection
- milestone: Achievements, turning points
- memory: Precious moments, stories worth keeping

## Response Format
Always respond with valid JSON:
{
  "message": "Your warm, conversational response",
  "events": [
    {
      "title": "Brief, meaningful title",
      "description": "The story behind it (optional but valuable)",
      "start_date": "YYYY-MM-DD or null",
      "date_precision": "year|month|day",
      "category": "one of the categories",
      "tags": ["optional", "meaningful", "tags"]
    }
  ]
}

## Guidelines
- Keep responses warm but concise (2-3 sentences for questions)
- Ask one thoughtful question at a time
- If they share something emotional, acknowledge it before moving on
- If they seem stuck, offer prompts: "What about your school years?" or "Any memorable trips?"
- Empty events array is fine if they're just chatting

If this is the start of a conversation, warmly greet them and ask about their earliest memory or where their story begins.`

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
