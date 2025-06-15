import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.NEXT_OPENAI_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Improved typing with better structure
type ConfessionWithProfile = {
  id: string
  content: string
  upvotes: number
  downvotes: number
  net_score: number
  created_at: string
  user_profiles: {
    anonymous_username: string
    toxicity_score: number
  } | null
}

type ToxicUser = {
  anonymous_username: string
  toxicity_score: number
  total_upvotes: number
  total_downvotes: number
}

type MonthlyStats = {
  totalConfessions: number
  totalVotes: number
  avgToxicity: number
  topConfessions: ConfessionWithProfile[]
  topToxicUsers: ToxicUser[]
}

// Input validation schema
const isValidMonthYear = (month: any, year: any): boolean => {
  return (
    typeof month === 'number' &&
    typeof year === 'number' &&
    month >= 1 && month <= 12 &&
    year >= 2000 && year <= 2100
  )
}

// Helper to get month date range
const getMonthDateRange = (year: number, month: number) => {
  const startDate = new Date(`${year}-${month.toString().padStart(2, '0')}-01T00:00:00.000Z`)

  // Get last day of the month
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}T23:59:59.999Z`)

  return { startDate, endDate }
}

// Database operations with better error handling
const fetchMonthlyData = async (startDate: Date, endDate: Date): Promise<MonthlyStats> => {
  try {
    console.log('Searching for confessions between:', {
      start: startDate,
      end: endDate
    })
    const [confessionsResult, usersResult, testResult] = await Promise.all([
      supabase
        .from('confessions')
        .select(`
          id,
          content,
          upvotes,
          downvotes,
          net_score,
          created_at,
          user_profiles(anonymous_username, toxicity_score)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('net_score', { ascending: false }),

      supabase
        .from('user_profiles')
        .select('anonymous_username, toxicity_score, total_upvotes, total_downvotes')
        .gt('toxicity_score', 0) // Only users with some toxicity
        .order('toxicity_score', { ascending: false }),

      supabase
        .from('confessions')
        .select(`
          id,
          content,
          upvotes,
          downvotes,
          net_score,
          created_at
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
    ])

    console.log('Query result:', confessionsResult)
    console.log('Query result:', usersResult)
    console.log('Query result:', testResult)
    console.log('Found confessions:', confessionsResult.data?.length)

    if (confessionsResult.error) {
      throw new Error(`Database error (confessions): ${confessionsResult.error.message}`)
    }

    if (usersResult.error) {
      throw new Error(`Database error (users): ${usersResult.error.message}`)
    }

    const confessions = (confessionsResult.data || []).map(confession => ({
      ...confession,
      user_profiles: confession.user_profiles?.[0] || null
    })) as ConfessionWithProfile[]

    const users = (usersResult.data || []) as ToxicUser[]

    if (confessions.length === 0) {
      throw new Error('No confessions found for this time period')
    }

    const totalVotes = confessions.reduce((sum, conf) => sum + conf.upvotes + conf.downvotes, 0)
    const avgToxicity = users.length > 0
      ? users.reduce((sum, user) => sum + user.toxicity_score, 0) / users.length
      : 0

    return {
      totalConfessions: confessions.length,
      totalVotes,
      avgToxicity,
      topConfessions: confessions.slice(0, 5),
      topToxicUsers: users.slice(0, 3)
    }
  } catch (error) {
    console.error('Database fetch error:', error)
    throw error
  }
}

// AI summary generation with better prompt engineering
const generateAISummary = async (stats: MonthlyStats, monthName: string, year: number): Promise<string> => {
  const confessionsSummary = stats.topConfessions.map((conf, idx) => {
    const author = (Array.isArray(conf.user_profiles) ? conf.user_profiles[0]?.anonymous_username : conf.user_profiles?.anonymous_username) ?? 'Anonymous'
    const preview = conf.content.length > 100
      ? conf.content.substring(0, 100) + '...'
      : conf.content
    return `${idx + 1}. "${preview}" (${conf.net_score} net votes, by ${author})`
  }).join('\n')

  const topUsersSummary = stats.topToxicUsers.length > 0
    ? stats.topToxicUsers.map((user, idx) =>
      `${idx + 1}. ${user.anonymous_username} - ${user.toxicity_score} toxicity points`
    ).join('\n')
    : 'No particularly toxic users this month 😇'

  const prompt = `Create an engaging monthly recap for "${monthName} ${year}" for an anonymous confession app:

📊 MONTHLY STATS:
- ${stats.totalConfessions} confessions shared
- ${stats.totalVotes} votes cast by the community
- Average toxicity level: ${Math.round(stats.avgToxicity)}/100

🔥 TOP CONFESSIONS OF THE MONTH:
${confessionsSummary}

😈 MOST CONTROVERSIAL USERS:
${topUsersSummary}

Requirements:
- Write 250-350 words in an engaging, slightly sarcastic tone
- Highlight interesting patterns or trends you notice
- Reference standout confessions tastefully (no direct quotes of sensitive content)
- Acknowledge toxic users playfully but not cruelly
- Use relevant emojis throughout
- End with anticipation for next month
- Keep it entertaining but respectful

Focus on community dynamics, voting patterns, and the overall "vibe" of the month.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // More cost-effective than gpt-3.5-turbo
      messages: [
        {
          role: "system",
          content: "You are a witty community manager creating monthly recaps for an anonymous confession platform. Your tone should be engaging and slightly irreverent, but never cruel or harmful. Focus on community trends and interesting patterns rather than individual drama."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7, // Slightly lower for more consistent quality
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    })

    const summary = completion.choices[0]?.message?.content?.trim()

    if (!summary) {
      throw new Error('OpenAI returned empty response')
    }

    return summary
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate AI summary')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Input validation
    const body = await request.json()
    const { month, year } = body

    if (!isValidMonthYear(month, year)) {
      return NextResponse.json({
        error: 'Invalid month or year. Month must be 1-12, year must be reasonable.'
      }, { status: 400 })
    }

    // Get date range
    const { startDate, endDate } = getMonthDateRange(year, month)

    // Check if requesting future month
    if (startDate > new Date()) {
      return NextResponse.json({
        error: 'Cannot generate summary for future months'
      }, { status: 400 })
    }

    // Fetch data
    const stats = await fetchMonthlyData(startDate, endDate)

    // Generate AI summary
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' })
    const aiSummary = await generateAISummary(stats, monthName, year)

    // Return comprehensive response
    return NextResponse.json({
      success: true,
      data: {
        month,
        year,
        monthName,
        summary: aiSummary,
        stats: {
          totalConfessions: stats.totalConfessions,
          totalVotes: stats.totalVotes,
          averageToxicity: Math.round(stats.avgToxicity * 10) / 10, // One decimal place
          topConfessionsCount: stats.topConfessions.length,
          topToxicUsersCount: stats.topToxicUsers.length
        },
        generatedAt: new Date().toISOString(),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    })

  } catch (error: any) {
    console.error('Monthly summary generation error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })

    // Return appropriate error responses
    if (error.message.includes('No confessions found')) {
      return NextResponse.json({
        error: 'No data available for the requested month',
        details: error.message
      }, { status: 404 })
    }

    if (error.message.includes('Database error')) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: 'Please try again later'
      }, { status: 503 })
    }

    if (error.message.includes('OpenAI') || error.message.includes('AI summary')) {
      return NextResponse.json({
        error: 'AI summary generation failed',
        details: 'Please try again later'
      }, { status: 503 })
    }

    // Generic error
    return NextResponse.json({
      error: 'Internal server error',
      details: 'An unexpected error occurred'
    }, { status: 500 })
  }
}
