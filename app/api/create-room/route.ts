import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { matchId } = await req.json()

  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `match-${matchId}`,
      properties: {
        exp: Math.round(Date.now() / 1000) + 60 * 60,
        enable_chat: false,
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    if (data.error === 'invalid-request-error' && data.info?.includes('already exists')) {
      return NextResponse.json({ url: `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN}.daily.co/match-${matchId}` })
    }
    return NextResponse.json({ error: data }, { status: 500 })
  }

  return NextResponse.json({ url: data.url })
}