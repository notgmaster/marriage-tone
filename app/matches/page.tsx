'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

type MatchProfile = {
  match_id: string
  profile: {
    clerk_user_id: string
    name: string
    age: number
    photo_url: string
    bio: string
  }
}

export default function Matches() {
  const { user } = useUser()
  const [matches, setMatches] = useState<MatchProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function loadMatches() {
      setLoading(true)

      const { data: matchRows } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`)

      if (!matchRows || matchRows.length === 0) {
        setMatches([])
        setLoading(false)
        return
      }

      const otherIds = matchRows.map((m) =>
        m.user1_id === user!.id ? m.user2_id : m.user1_id
      )

      const { data: profiles } = await supabase
        .from('profiles')
        .select('clerk_user_id, name, age, photo_url, bio')
        .in('clerk_user_id', otherIds)

      const combined: MatchProfile[] = (profiles || []).map((p) => {
        const match = matchRows.find(
          (m) => m.user1_id === p.clerk_user_id || m.user2_id === p.clerk_user_id
        )
        return {
          match_id: match!.id,
          profile: p,
        }
      })

      setMatches(combined)
      setLoading(false)
    }

    loadMatches()
  }, [user])

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-5">
  <Link href="/discover" className="text-sm font-medium text-[#3B0A0A]/60 hover:text-[#3B0A0A] transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
    Discover
  </Link>
  <Link href="/likes" className="text-sm font-medium text-[#3B0A0A]/60 hover:text-[#3B0A0A] transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
    Likes
  </Link>
  <h1 className="text-xl font-bold text-[#3B0A0A]" style={{ fontFamily: 'var(--font-display)' }}>
    Matches
  </h1>
  <Link href="/matches" className="text-sm font-medium text-[#3B0A0A]/60 hover:text-[#3B0A0A] transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
    Chat
  </Link>
</div>      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-lg mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-10 h-10 rounded-full border-4 border-[#3B0A0A]/20 border-t-[#3B0A0A] animate-spin mx-auto mb-4"></div>
              <p className="text-[#3B0A0A]/60" style={{ fontFamily: 'var(--font-body)' }}>
                Loading matches...
              </p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-xl font-semibold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                No matches yet
              </p>
              <p className="text-[#3B0A0A]/60 text-sm mb-6" style={{ fontFamily: 'var(--font-body)' }}>
                Keep discovering people. When you both like each other, they’ll appear here.
              </p>
              <Link
                href="/discover"
                className="inline-block px-6 py-3 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Start discovering
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {matches.map((m) => (
                <Link
                  key={m.match_id}
                  href={`/messages/${m.match_id}`}
                  className="group block rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative w-full aspect-[3/4] bg-gray-100">
                    {m.profile.photo_url ? (
                      <img
                        src={m.profile.photo_url}
                        alt={m.profile.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#3B0A0A]/30">
                        No photo
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-white font-semibold text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                        {m.profile.name}, {m.profile.age}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}