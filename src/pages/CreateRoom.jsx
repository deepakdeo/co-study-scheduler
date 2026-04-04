import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
    hostTimezone: detectedTz,
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
    if (!form.meetingLink.trim()) errs.meetingLink = 'Meeting link is required'
    else if (!/^https?:\/\/.+/.test(form.meetingLink.trim()))
      errs.meetingLink = 'Enter a valid URL starting with http:// or https://'
    if (form.morningEnd <= form.morningStart)
      errs.morningWindow = 'End time must be after start time'
    if (form.eveningEnd <= form.eveningStart)
      errs.eveningWindow = 'End time must be after start time'
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

      const { error } = await supabase.from('rooms').insert({
        slug: form.slug,
        host_name: form.hostName.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        meeting_link: form.meetingLink.trim(),
        host_timezone: form.hostTimezone,
        morning_start: form.morningStart,
        morning_end: form.morningEnd,
        evening_start: form.eveningStart,
        evening_end: form.eveningEnd,
        slot_duration: 120,
        slot_interval: 30,
        admin_pin: form.adminPin,
      })

      if (error) throw error
      navigate(`/r/${form.slug}`)
    } catch (err) {
      setSubmitError(err.message || 'Failed to create room. Please try again.')
    } finally {
      setSubmitting(false)
    }
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
            <label className={LABEL_CLASS}>Zoom / Meeting Link *</label>
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

          <p className="text-sm text-gray-500">
            Session duration: 2 hours (fixed) with 30-minute rolling start times.
          </p>
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

export default CreateRoom
