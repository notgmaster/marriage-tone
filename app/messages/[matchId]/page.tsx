'use client'

import { useEffect, useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Message = {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

type OtherProfile = {
  name: string
  photo_url: string
  clerk_user_id: string
}

export default function ChatPage() {
  const { user } = useUser()
  const params = useParams()
  const router = useRouter()
  const matchId = params.matchId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [other, setOther] = useState<OtherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !matchId) return

    async function load() {
      setLoading(true)

      // Get match to find the other user
      const { data: match } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .maybeSingle()

      if (!match) {
        setLoading(false)
        return
      }

      const otherId = match.user1_id === user!.id ? match.user2_id : match.user1_id

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, photo_url, clerk_user_id')
        .eq('clerk_user_id', otherId)
        .maybeSingle()

      if (profile) setOther(profile)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (msgs) setMessages(msgs as Message[])
      setLoading(false)
    }

    load()
  }, [user, matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !newMessage.trim() || sending) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content,
      })
      .select()
      .single()

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message])
    }
    setSending(false)
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <main className="min-h-screen bg-[#f0f2f5] flex flex-col">
      {/* Header - WhatsApp style */}
      <header className="bg-[#3B0A0A] text-white sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-3 h-14 flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() => router.push('/matches')}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Profile photo + name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
              {other?.photo_url ? (
                <img src={other.photo_url} alt={other.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                  {other?.name?.[0] || '?'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate" style={{ fontFamily: 'var(--font-body)' }}>
                {other?.name || 'Loading...'}
              </p>
              <p className="text-xs text-white/70">Online</p>
            </div>
          </div>

          {/* Call buttons */}
          <div className="flex items-center gap-1">
            <button
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Voice call"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02.37-1.11.56-2.3.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
              </svg>
            </button>
            <button
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Video call"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {loading ? (
            <div className="text-center py-10 text-[#3B0A0A]/50" style={{ fontFamily: 'var(--font-body)' }}>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#3B0A0A]/50 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                No messages yet. Say hello!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl shadow-sm ${
                      isMe
                        ? 'bg-[#3B0A0A] text-white rounded-br-md'
                        : 'bg-white text-[#3B0A0A] rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words" style={{ fontFamily: 'var(--font-body)' }}>
                      {msg.content}
                    </p>
                    <p
                      className={`text-[10px] mt-1 text-right ${
                        isMe ? 'text-white/60' : 'text-[#3B0A0A]/40'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <form
        onSubmit={sendMessage}
        className="bg-white border-t border-gray-200 px-3 py-3 sticky bottom-0"
      >
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 outline-none text-sm text-[#3B0A0A] placeholder:text-gray-400"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 rounded-full bg-[#3B0A0A] text-white flex items-center justify-center hover:bg-[#5a1515] transition-colors disabled:opacity-40"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </form>
    </main>
  )
}