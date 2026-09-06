'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

type Profile = {
  id: string
  clerk_user_id: string
  name: string
  age: number
  bio: string
  gender: string
  interested_in: string
  location: string
  hobbies: string[]
  occupation: string
  photo_url: string
}

export default function Discover() {
  const { user } = useUser()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matchName, setMatchName] = useState<string | null>(null)

  const loadProfiles = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: swipedRows } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', user.id)

    const swipedIds = (swipedRows || []).map((r) => r.swiped_id)
    const excludeIds = [user.id, ...swipedIds]

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('clerk_user_id', 'in', `(${excludeIds.join(',')})`)

    if (!error && data) {
      setProfiles(data as Profile[])
      setCurrentIndex(0)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  async function handleSwipe(direction: 'like' | 'pass') {
    if (!user) return
    const target = profiles[currentIndex]
    if (!target) return

    await supabase.from('swipes').insert({
      swiper_id: user.id,
      swiped_id: target.clerk_user_id,
      direction,
    })

    if (direction === 'like') {
      const { data: theirSwipe } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', target.clerk_user_id)
        .eq('swiped_id', user.id)
        .eq('direction', 'like')
        .maybeSingle()

      if (theirSwipe) {
        const [user1_id, user2_id] = [user.id, target.clerk_user_id].sort()
        await supabase.from('matches').insert({ user1_id, user2_id })
        setMatchName(target.name)
      }
    }

    setCurrentIndex((i) => i + 1)
  }

  const current = profiles[currentIndex]

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <h1 className="text-xl font-bold text-[#3B0A0A]" style={{ fontFamily: 'var(--font-display)' }}>
              Discover
            </h1>
            <Link
              href="/matches"
              className="text-sm font-medium text-[#3B0A0A]/60 hover:text-[#3B0A0A] transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Matches
            </Link>
          </div>
          <UserButton />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Match modal */}
        {matchName && (
          <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
            onClick={() => setMatchName(null)}
          >
            <div
              className="bg-white rounded-3xl p-8 text-center max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl mb-3">💍</div>
              <h2 className="text-2xl font-bold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                It’s a match!
              </h2>
              <p className="text-[#3B0A0A]/70 mb-6" style={{ fontFamily: 'var(--font-body)' }}>
                You and <span className="font-semibold">{matchName}</span> liked each other.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMatchName(null)}
                  className="flex-1 py-3 rounded-full border border-gray-200 text-[#3B0A0A] font-semibold hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Keep browsing
                </button>
                <Link
                  href="/matches"
                  className="flex-1 py-3 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-colors text-center"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Message
                </Link>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-4 border-[#3B0A0A]/20 border-t-[#3B0A0A] animate-spin mx-auto mb-4"></div>
            <p className="text-[#3B0A0A]/60" style={{ fontFamily: 'var(--font-body)' }}>
              Finding people...
            </p>
          </div>
        ) : current ? (
          <div className="w-full max-w-sm">
            {/* Card */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100">
              {/* Photo */}
              <div className="relative w-full h-96 bg-gray-100">
                {current.photo_url ? (
                  <img
                    src={current.photo_url}
                    alt={current.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#3B0A0A]/30">
                    No photo
                  </div>
                )}
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {current.name}, {current.age}
                  </h2>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                {current.bio && (
                  <p className="text-[#3B0A0A]/80 text-sm leading-relaxed mb-4" style={{ fontFamily: 'var(--font-body)' }}>
                    {current.bio}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => handleSwipe('pass')}
                    className="flex-1 py-3.5 rounded-full border-2 border-gray-200 text-[#3B0A0A] font-semibold hover:bg-gray-50 transition-all active:scale-95"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => handleSwipe('like')}
                    className="flex-1 py-3.5 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-all active:scale-95"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Like
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-4">🌟</div>
            <p className="text-xl font-semibold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              No more profiles right now
            </p>
            <p className="text-[#3B0A0A]/60 text-sm mb-6" style={{ fontFamily: 'var(--font-body)' }}>
              Check back later for new people.
            </p>
            <Link
              href="/matches"
              className="inline-block px-6 py-3 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              View matches
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}