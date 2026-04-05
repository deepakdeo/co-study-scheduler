import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { detectTimezone, getCommonTimezones } from '../lib/timezone'
import { generateSlug, validateSlug, checkSlugUniqueness } from '../lib/slugify'

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-500/20 focus:outline-none'
const INPUT_ERROR_CLASS =
  'w-full rounded-lg border border-red-500 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none'
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1'

const formatHour = (hour) => {
  if (hour === 0) return '12:00 AM'
  if (hour === 12) return '12:00 PM'
  if (hour < 12) return `${hour}:00 AM`
  return `${hour - 12}:00 PM`
}

const HourSelect = ({ value, onChange, min, max, error }) => (
  <select
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className={error ? INPUT_ERROR_CLASS : INPUT_CLASS}
  >
    {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((h) => (
      <option key={h} value={h}>
        {formatHour(h)}
      </option>
    ))}
  </select>
)

const CreateRoom = () => {
  const navigate = useNavigate()
  const detectedTz = detectTimezone()
  const timezones = getCommonTimezones(detectedTz)

  const [form, setForm] = useState({
    hostName: '',
    title: '',
    description: '',
    slug: '',
    meetingLink: '',
    hostEmail: '',
    hostTimezone: detectedTz,
    slotDuration: 120,
    scheduleMode: 'split',
    fullDayStart: 8,
    fullDayEnd: 20,
    morningStart: 10,
    morningEnd: 15,
    eveningStart: 19,
    eveningEnd: 23,
    adminPin: '',
  })

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState(null)
  const [slugChecking, setSlugChecking] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [showPin, setShowPin] = useState(false)
  const [createdSlug, setCreatedSlug] = useState(null)

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const handleTitleChange = (value) => {
    updateField('title', value)
    if (!slugManuallyEdited) {
      const slug = generateSlug(value)
      setForm((prev) => ({ ...prev, title: value, slug }))
      setSlugAvailable(null)
    }
  }

  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true)
    updateField('slug', value)
    setSlugAvailable(null)
  }

  // Debounced slug uniqueness check
  useEffect(() => {
    if (!form.slug) {
      setSlugAvailable(null)
      return
    }
    const { valid } = validateSlug(form.slug)
    if (!valid) {
      setSlugAvailable(null)
      return
    }
    setSlugChecking(true)
    const timer = setTimeout(async () => {
      const available = await checkSlugUniqueness(form.slug)
      setSlugAvailable(available)
      setSlugChecking(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [form.slug])

  const validate = () => {
    const errs = {}
    if (!form.hostName.trim()) errs.hostName = 'Host name is required'
    if (!form.title.trim()) errs.title = 'Room title is required'
    const slugResult = validateSlug(form.slug)
    if (!slugResult.valid) errs.slug = slugResult.error
    else if (slugAvailable === false) errs.slug = 'This slug is already taken'
    if (form.meetingLink.trim() && !/^https?:\/\/.+/.test(form.meetingLink.trim()))
      errs.meetingLink = 'Enter a valid URL starting with http:// or https://'
    if (form.hostEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.hostEmail.trim()))
      errs.hostEmail = 'Enter a valid email address'
    if (!form.slotDuration || form.slotDuration < 15)
      errs.slotDuration = 'Duration must be at least 15 minutes'
    else if (form.slotDuration > 480)
      errs.slotDuration = 'Duration cannot exceed 8 hours'
    const durationHours = form.slotDuration / 60
    if (form.scheduleMode === 'full') {
      if (form.fullDayEnd <= form.fullDayStart)
        errs.fullDayWindow = 'End time must be after start time'
      else if (form.fullDayEnd - form.fullDayStart < durationHours)
        errs.fullDayWindow = `Window must be at least ${form.slotDuration} minutes for this session duration`
    } else {
      if (form.morningEnd <= form.morningStart)
        errs.morningWindow = 'End time must be after start time'
      else if (form.morningEnd - form.morningStart < durationHours)
        errs.morningWindow = `Window must be at least ${form.slotDuration} minutes for this session duration`
      if (form.eveningEnd <= form.eveningStart)
        errs.eveningWindow = 'End time must be after start time'
      else if (form.eveningEnd - form.eveningStart < durationHours)
        errs.eveningWindow = `Window must be at least ${form.slotDuration} minutes for this session duration`
    }
    if (!form.adminPin) errs.adminPin = 'Admin PIN is required'
    else if (!/^\d{4,6}$/.test(form.adminPin))
      errs.adminPin = 'PIN must be 4-6 digits'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      // Final slug check
      const available = await checkSlugUniqueness(form.slug)
      if (!available) {
        setErrors((prev) => ({ ...prev, slug: 'This slug was just taken' }))
        setSubmitting(false)
        return
      }

      const isFullDay = form.scheduleMode === 'full'
      const { error } = await supabase.from('rooms').insert({
        slug: form.slug,
        host_name: form.hostName.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        meeting_link: form.meetingLink.trim() || null,
        host_email: form.hostEmail.trim() || null,
        host_timezone: form.hostTimezone,
        morning_start: isFullDay ? form.fullDayStart : form.morningStart,
        morning_end: isFullDay ? form.fullDayEnd : form.morningEnd,
        evening_start: isFullDay ? 0 : form.eveningStart,
        evening_end: isFullDay ? 0 : form.eveningEnd,
        slot_duration: form.slotDuration,
        slot_interval: 30,
        admin_pin: form.adminPin,
      })

      if (error) throw error
      setCreatedSlug(form.slug)
    } catch (err) {
      setSubmitError(err.message || 'Failed to create room. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (createdSlug) {
    return <RoomCreatedScreen slug={createdSlug} adminPin={form.adminPin} />
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">Create a Room</h1>

      {submitError && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{submitError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 rounded-xl bg-white p-6 shadow-sm sm:p-8">
        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Info</h2>

          <div>
            <label className={LABEL_CLASS}>Host Name *</label>
            <input
              type="text"
              value={form.hostName}
              onChange={(e) => updateField('hostName', e.target.value)}
              placeholder="Your name"
              className={errors.hostName ? INPUT_ERROR_CLASS : INPUT_CLASS}
            />
            {errors.hostName && <p className="mt-1 text-sm text-red-600">{errors.hostName}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Room Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., AI/ML Co-Study with Deo"
              className={errors.title ? INPUT_ERROR_CLASS : INPUT_CLASS}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description of your study sessions"
              rows={3}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Slug *</label>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-sm text-gray-500">/r/</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="auto-generated-from-title"
                className={errors.slug ? INPUT_ERROR_CLASS : INPUT_CLASS}
              />
              {slugChecking && <span className="text-sm text-gray-400">checking...</span>}
              {!slugChecking && slugAvailable === true && (
                <span className="text-sm text-green-600">&#10003;</span>
              )}
              {!slugChecking && slugAvailable === false && (
                <span className="text-sm text-red-600">&#10007;</span>
              )}
            </div>
            {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
          </div>
        </section>

        {/* Meeting Link */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Meeting Link</h2>
          <div>
            <label className={LABEL_CLASS}>Zoom / Meeting Link</label>
            <input
              type="url"
              value={form.meetingLink}
              onChange={(e) => updateField('meetingLink', e.target.value)}
              placeholder="https://zoom.us/j/..."
              className={errors.meetingLink ? INPUT_ERROR_CLASS : INPUT_CLASS}
            />
            <p className="mt-1 text-sm text-gray-500">
              This link is private and only shared with confirmed attendees.
            </p>
            {errors.meetingLink && (
              <p className="mt-1 text-sm text-red-600">{errors.meetingLink}</p>
            )}
          </div>

          <div>
            <label className={LABEL_CLASS}>Host Email</label>
            <input
              type="email"
              value={form.hostEmail}
              onChange={(e) => updateField('hostEmail', e.target.value)}
              placeholder="your@email.com"
              className={errors.hostEmail ? INPUT_ERROR_CLASS : INPUT_CLASS}
            />
            <p className="mt-1 text-sm text-gray-500">
              Optional — receive email notifications when someone books a session.
            </p>
            {errors.hostEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.hostEmail}</p>
            )}
          </div>
        </section>

        {/* Schedule Settings */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Schedule Settings</h2>

          <div>
            <label className={LABEL_CLASS}>Host Timezone</label>
            <select
              value={form.hostTimezone}
              onChange={(e) => updateField('hostTimezone', e.target.value)}
              className={INPUT_CLASS}
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL_CLASS}>Availability Mode</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateField('scheduleMode', 'split')}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${
                  form.scheduleMode === 'split'
                    ? 'border-cobalt-500 bg-cobalt-50 text-cobalt-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Morning + Evening
              </button>
              <button
                type="button"
                onClick={() => updateField('scheduleMode', 'full')}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium ${
                  form.scheduleMode === 'full'
                    ? 'border-cobalt-500 bg-cobalt-50 text-cobalt-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Full Day
              </button>
            </div>
          </div>

          {form.scheduleMode === 'full' ? (
            <div>
              <label className={LABEL_CLASS}>Available Hours</label>
              <div className="flex items-center gap-3">
                <HourSelect
                  value={form.fullDayStart}
                  onChange={(v) => updateField('fullDayStart', v)}
                  min={0}
                  max={23}
                  error={errors.fullDayWindow}
                />
                <span className="text-gray-500">to</span>
                <HourSelect
                  value={form.fullDayEnd}
                  onChange={(v) => updateField('fullDayEnd', v)}
                  min={1}
                  max={24}
                  error={errors.fullDayWindow}
                />
              </div>
              {errors.fullDayWindow && (
                <p className="mt-1 text-sm text-red-600">{errors.fullDayWindow}</p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className={LABEL_CLASS}>Morning / Afternoon Window</label>
                <div className="flex items-center gap-3">
                  <HourSelect
                    value={form.morningStart}
                    onChange={(v) => updateField('morningStart', v)}
                    min={6}
                    max={18}
                    error={errors.morningWindow}
                  />
                  <span className="text-gray-500">to</span>
                  <HourSelect
                    value={form.morningEnd}
                    onChange={(v) => updateField('morningEnd', v)}
                    min={6}
                    max={18}
                    error={errors.morningWindow}
                  />
                </div>
                {errors.morningWindow && (
                  <p className="mt-1 text-sm text-red-600">{errors.morningWindow}</p>
                )}
              </div>

              <div>
                <label className={LABEL_CLASS}>Evening Window</label>
                <div className="flex items-center gap-3">
                  <HourSelect
                    value={form.eveningStart}
                    onChange={(v) => updateField('eveningStart', v)}
                    min={16}
                    max={23}
                    error={errors.eveningWindow}
                  />
                  <span className="text-gray-500">to</span>
                  <HourSelect
                    value={form.eveningEnd}
                    onChange={(v) => updateField('eveningEnd', v)}
                    min={16}
                    max={24}
                    error={errors.eveningWindow}
                  />
                </div>
                {errors.eveningWindow && (
                  <p className="mt-1 text-sm text-red-600">{errors.eveningWindow}</p>
                )}
              </div>
            </>
          )}

          <div>
            <label className={LABEL_CLASS}>Session Duration (minutes)</label>
            <input
              type="number"
              min={15}
              max={480}
              step={5}
              value={form.slotDuration}
              onChange={(e) => updateField('slotDuration', Number(e.target.value) || '')}
              placeholder="e.g., 120"
              className={errors.slotDuration ? INPUT_ERROR_CLASS : INPUT_CLASS}
            />
            <p className="mt-1 text-sm text-gray-500">
              Any value from 15 to 480 minutes. Slots will have 30-minute rolling start times.
            </p>
            {errors.slotDuration && (
              <p className="mt-1 text-sm text-red-600">{errors.slotDuration}</p>
            )}
          </div>
        </section>

        {/* Security */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          <div>
            <label className={LABEL_CLASS}>Admin PIN *</label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={form.adminPin}
                onChange={(e) => updateField('adminPin', e.target.value)}
                placeholder="4-6 digit PIN"
                maxLength={6}
                className={errors.adminPin ? INPUT_ERROR_CLASS : INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
              >
                {showPin ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              You&apos;ll need this PIN to access the admin view for your room.
            </p>
            {errors.adminPin && <p className="mt-1 text-sm text-red-600">{errors.adminPin}</p>}
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-cobalt-600 py-3 text-lg font-semibold text-white hover:bg-cobalt-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </div>
  )
}

const RoomCreatedScreen = ({ slug, adminPin }) => {
  const [copiedPublic, setCopiedPublic] = useState(false)
  const [copiedAdmin, setCopiedAdmin] = useState(false)

  const baseUrl = window.location.origin
  const publicUrl = `${baseUrl}/r/${slug}`
  const adminUrl = `${baseUrl}/r/${slug}/admin`

  const copyToClipboard = async (text, setCopied) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <div className="mb-4 text-center text-4xl text-green-500">&#10003;</div>
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Room Created!</h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          Save the links below — you&apos;ll need them to share and manage your room.
        </p>

        {/* Public link */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Share this link with your study group:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
            <button
              onClick={() => copyToClipboard(publicUrl, setCopiedPublic)}
              className="whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {copiedPublic ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Admin link */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Admin dashboard (for managing bookings):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={adminUrl}
              className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
            <button
              onClick={() => copyToClipboard(adminUrl, setCopiedAdmin)}
              className="whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {copiedAdmin ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Your admin PIN is <span className="font-mono font-medium text-gray-700">{adminPin}</span> — save it somewhere safe.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to={`/r/${slug}`}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Room
          </Link>
          <Link
            to={`/r/${slug}/admin`}
            className="flex-1 rounded-lg bg-cobalt-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-cobalt-700"
          >
            Go to Admin
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CreateRoom
