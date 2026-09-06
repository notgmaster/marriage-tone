'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'

export default function Onboarding() {
  const { user } = useUser()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [gender, setGender] = useState('')
  const [interestedIn, setInterestedIn] = useState('')
  const [lookingFor, setLookingFor] = useState('')
  const [bio, setBio] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setPhotoFile(file)
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
    } else {
      setPhotoPreview('')
    }
  }

  function calculateAge(birthday: string) {
    const today = new Date()
    const birth = new Date(birthday)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  async function handleSubmit() {
    if (!user) return
    setLoading(true)
    setError('')

    const age = calculateAge(birthday)
    if (age < 18) {
      setError('You must be at least 18 years old.')
      setLoading(false)
      return
    }

    let photoUrl = ''

    if (photoFile) {
      if (photoFile.size > 10 * 1024 * 1024) {
        setError('Photo is too large. Please choose one under 10MB.')
        setLoading(false)
        return
      }

      const compressedFile = await imageCompression(photoFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
      })

      const fileExt = photoFile.name.split('.').pop()
      const filePath = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile)

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      photoUrl = publicUrlData.publicUrl
    }

    const { error: insertError } = await supabase.from('profiles').insert({
      clerk_user_id: user.id,
      name,
      age,
      bio,
      gender,
      interested_in: interestedIn,
      looking_for: lookingFor,
      photo_url: photoUrl,
      location: '',
      hobbies: [],
      occupation: '',
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    router.push('/discover')
  }

  function nextStep() {
    setError('')
    setStep((s) => s + 1)
  }

  function prevStep() {
    setError('')
    setStep((s) => s - 1)
  }

  const totalSteps = 7

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-100">
        <div
          className="h-full bg-[#3B0A0A] transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* STEP 1 - House Rules */}
          {step === 1 && (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Welcome to MarriageTone
              </h2>
              <p className="text-[#3B0A0A]/60 mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                Please follow these house rules.
              </p>

              <div className="text-left space-y-5 mb-10">
                <div>
                  <p className="font-semibold text-[#3B0A0A]" style={{ fontFamily: 'var(--font-body)' }}>✓ Be yourself.</p>
                  <p className="text-sm text-[#3B0A0A]/60">Make sure your photos, age and bio are true to who you are.</p>
                </div>
                <div>
                  <p className="font-semibold text-[#3B0A0A]" style={{ fontFamily: 'var(--font-body)' }}>✓ Stay safe.</p>
                  <p className="text-sm text-[#3B0A0A]/60">Don’t be too quick to give out personal information.</p>
                </div>
                <div>
                  <p className="font-semibold text-[#3B0A0A]" style={{ fontFamily: 'var(--font-body)' }}>✓ Play it cool.</p>
                  <p className="text-sm text-[#3B0A0A]/60">Respect others and treat them as you would like to be treated.</p>
                </div>
                <div>
                  <p className="font-semibold text-[#3B0A0A]" style={{ fontFamily: 'var(--font-body)' }}>✓ Be proactive.</p>
                  <p className="text-sm text-[#3B0A0A]/60">Always report bad behaviour.</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setAgreed(true)
                  nextStep()
                }}
                className="w-full py-3.5 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                I Agree
              </button>
            </div>
          )}

          {/* STEP 2 - First Name */}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                What’s your first name?
              </h2>
              <p className="text-[#3B0A0A]/60 mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                This is how you’ll appear on MarriageTone.
              </p>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name"
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-[#3B0A0A] text-[#3B0A0A] mb-6"
                style={{ fontFamily: 'var(--font-body)' }}
              />

              <button
                onClick={() => {
                  if (!name.trim()) {
                    setError('Please enter your first name.')
                    return
                  }
                  nextStep()
                }}
                className="w-full py-3.5 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Continue
              </button>
              {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
            </div>
          )}

          {/* STEP 3 - Birthday */}
          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Your birthday
              </h2>
              <p className="text-[#3B0A0A]/60 mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                Your age will be public. You must be 18+.
              </p>

              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-[#3B0A0A] text-[#3B0A0A] mb-6"
                style={{ fontFamily: 'var(--font-body)' }}
              />

              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="flex-1 py-3.5 rounded-full border border-gray-200 text-[#3B0A0A] font-semibold hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!birthday) {
                      setError('Please select your birthday.')
                      return
                    }
                    const age = calculateAge(birthday)
                    if (age < 18) {
                      setError('You must be at least 18 years old.')
                      return
                    }
                    nextStep()
                  }}
                  className="flex-1 py-3.5 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Continue
                </button>
              </div>
              {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
            </div>
          )}

          {/* STEP 4 - Gender */}
          {step === 4 && (
            <div>
              <h2 className="text-3xl font-bold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                I am a...
              </h2>
              <p className="text-[#3B0A0A]/60 mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                Select your gender.
              </p>

              <div className="space-y-3 mb-6">
                {['man', 'woman', 'other'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`w-full py-3.5 rounded-xl border text-left px-4 font-medium transition-all ${
                      gender === g
                        ? 'border-[#3B0A0A] bg-[#3B0A0A]/5 text-[#3B0A0A]'
                        : 'border-gray-200 text-[#3B0A0A]/70 hover:border-gray-300'
                    }`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="flex-1 py-3.5 rounded-full border border-gray-200 text-[#3B0A0A] font-semibold hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!gender) {
                      setError('Please select your gender.')
                      return
                    }
                    nextStep()
                  }}
                  className="flex-1 py-3.5 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Continue
                </button>
              </div>
              {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
            </div>
          )}

          {/* STEP 5 - Interested In */}
          {step === 5 && (
            <div>
              <h2 className="text-3xl font-bold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Interested in...
              </h2>
              <p className="text-[#3B0A0A]/60 mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                Who would you like to meet?
              </p>

              <div className="space-y-3 mb-6">
                {[
                  { value: 'men', label: 'Men' },
                  { value: 'women', label: 'Women' },
                  { value: 'everyone', label: 'Everyone' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setInterestedIn(item.value)}
                    className={`w-full py-3.5 rounded-xl border text-left px-4 font-medium transition-all ${
                      interestedIn === item.value
                        ? 'border-[#3B0A0A] bg-[#3B0A0A]/5 text-[#3B0A0A]'
                        : 'border-gray-200 text-[#3B0A0A]/70 hover:border-gray-300'
                    }`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="flex-1 py-3.5 rounded-full border border-gray-200 text-[#3B0A0A] font-semibold hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!interestedIn) {
                      setError('Please select who you are interested in.')
                      return
                    }
                    nextStep()
                  }}
                  className="flex-1 py-3.5 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Continue
                </button>
              </div>
              {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
            </div>
          )}

          {/* STEP 6 - Looking For */}
          {step === 6 && (
            <div>
              <h2 className="text-3xl font-bold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                What are you looking for?
              </h2>
              <p className="text-[#3B0A0A]/60 mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                All good if it changes. There’s something for everyone.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { value: 'serious', label: 'Long-term partner', emoji: '💍' },
                  { value: 'casual', label: 'Something casual', emoji: '😊' },
                  { value: 'unsure', label: 'Still figuring it out', emoji: '🤔' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setLookingFor(item.value)}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      lookingFor === item.value
                        ? 'border-[#3B0A0A] bg-[#3B0A0A]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{item.emoji}</div>
                    <div className="text-sm font-medium text-[#3B0A0A]" style={{ fontFamily: 'var(--font-body)' }}>
                      {item.label}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="flex-1 py-3.5 rounded-full border border-gray-200 text-[#3B0A0A] font-semibold hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!lookingFor) {
                      setError('Please select what you are looking for.')
                      return
                    }
                    nextStep()
                  }}
                  className="flex-1 py-3.5 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Continue
                </button>
              </div>
              {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
            </div>
          )}

          {/* STEP 7 - Photo + Bio */}
          {step === 7 && (
            <div>
              <h2 className="text-3xl font-bold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Add a photo & bio
              </h2>
              <p className="text-[#3B0A0A]/60 mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                A clear face photo works best. Bio is required.
              </p>

              {/* Photo upload */}
              <div className="flex justify-center mb-6">
                <label
                  htmlFor="photo"
                  className="relative w-28 h-28 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#3B0A0A] transition-colors bg-gray-50"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-[#3B0A0A]/50 text-center px-2">Add photo</span>
                  )}
                </label>
                <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A little about yourself..."
                rows={4}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 outline-none focus:border-[#3B0A0A] text-[#3B0A0A] mb-6 resize-none"
                style={{ fontFamily: 'var(--font-body)' }}
              />

              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="flex-1 py-3.5 rounded-full border border-gray-200 text-[#3B0A0A] font-semibold hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (!photoFile) {
                      setError('Please add a photo.')
                      return
                    }
                    if (!bio.trim()) {
                      setError('Please write a short bio.')
                      return
                    }
                    handleSubmit()
                  }}
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-full bg-[#3B0A0A] text-white font-semibold hover:bg-[#5a1515] transition-colors disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {loading ? 'Saving...' : 'Finish'}
                </button>
              </div>
              {error && <p className="text-red-600 text-sm mt-3 text-center">{error}</p>}
            </div>
          )}

        </div>
      </div>
    </main>
  )
}