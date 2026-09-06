'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const { user, isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!isLoaded) return

    async function checkProfile() {
      if (!isSignedIn) {
        setChecking(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', user!.id)
        .maybeSingle()

      if (!data) {
        router.push('/onboarding')
      } else {
        setChecking(false)
      }
    }

    checkProfile()
  }, [isLoaded, isSignedIn, user, router])

  if (!isLoaded || checking) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-[#3B0A0A]/20 border-t-[#3B0A0A] animate-spin mx-auto mb-4"></div>
          <p className="text-[#3B0A0A]/70 text-base" style={{ fontFamily: 'var(--font-body)' }}>
            Loading...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* ===== TOP NAVIGATION ===== */}
      <header className="w-full bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
         {/* Left - Logo */}
<div className="flex-shrink-0 z-10">
  <h1
    className="text-2xl sm:text-3xl font-bold tracking-tight text-[#C41E3A]"
    style={{ fontFamily: 'var(--font-display)' }}
  >
    MARRIAGE<span className="relative">ONE
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px]">🏹</span>
    </span>
  </h1>
</div>

          {/* Center - Navigation links */}
          <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
            <a
              href="#product"
              className="text-sm font-medium text-[#3B0A0A]/80 hover:text-[#3B0A0A] transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Product
            </a>
            <a
              href="#safety"
              className="text-sm font-medium text-[#3B0A0A]/80 hover:text-[#3B0A0A] transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Safety
            </a>
            <a
              href="#support"
              className="text-sm font-medium text-[#3B0A0A]/80 hover:text-[#3B0A0A] transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Support
            </a>
          </nav>

          {/* Right - Log in */}
          <div className="flex items-center gap-3 flex-shrink-0 z-10">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-[#3B0A0A] text-white hover:bg-[#5a1515] transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Log in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <a
                href="/discover"
                className="px-5 py-2 rounded-full text-sm font-semibold bg-[#F2A93B] text-[#3B0A0A] hover:bg-[#D4A017] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Discover
              </a>
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center">
        <h2
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#3B0A0A] leading-tight max-w-4xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Love has no boundary.
        </h2>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Show when="signed-out">
            <button
              className="px-8 py-3.5 rounded-full bg-gray-100 text-[#3B0A0A] font-semibold text-base hover:bg-gray-200 transition-all"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Get the app
            </button>

            <SignUpButton mode="modal">
              <button
                className="px-8 py-3.5 rounded-full bg-[#3B0A0A] text-white font-semibold text-base hover:bg-[#5a1515] transition-all"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Create account
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <a
              href="/discover"
              className="px-8 py-3.5 rounded-full bg-[#F2A93B] text-[#3B0A0A] font-semibold text-base hover:bg-[#D4A017] transition-all"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Start discovering
            </a>
          </Show>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-100 py-6 px-4 text-center">
        <p className="text-xs text-[#3B0A0A]/40" style={{ fontFamily: 'var(--font-body)' }}>
          © 2026 MarriageTone.com · Terms · Privacy · Safety
        </p>
      </footer>
    </main>
  )
}