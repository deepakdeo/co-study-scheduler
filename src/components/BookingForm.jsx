import { useState } from 'react'
import { format } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { supabase } from '../lib/supabase'
import { slotsOverlap } from '../lib/slots'

const BookingForm = ({ slot, room, viewerTimezone, onCancel, onBooked }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [showName, setShowName] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const startInViewer = toZonedTime(slot.slotStartUtc, viewerTimezone)
  const endInViewer = toZonedTime(slot.slotEndUtc, viewerTimezone)
  const timeLabel = `${format(startInViewer, 'EEEE, MMM d')} at ${format(startInViewer, 'h:mm a')} – ${format(endInViewer, 'h:mm a')}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Check for overlapping bookings
      const { data: existing } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', room.id)
        .eq('booking_date', slot.dateStr)
        .eq('status', 'confirmed')

      const hasOverlap = (existing || []).some((b) =>
        slotsOverlap(
          slot.slotStartUtc.getTime(),
          slot.slotEndUtc.getTime(),
          new Date(b.slot_start_utc).getTime(),
          new Date(b.slot_end_utc).getTime(),
        ),
      )

      if (hasOverlap) {
        setError('This time slot was just booked by someone else. Please choose another.')
        setSubmitting(false)
        return
      }

      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert({
          room_id: room.id,
          name: name.trim(),
          email: email.trim() || null,
          note: note.trim() || null,
          booking_date: slot.dateStr,
          slot_start_utc: slot.slotStartUtc.toISOString(),
          slot_end_utc: slot.slotEndUtc.toISOString(),
          booker_timezone: viewerTimezone,
          show_name: showName,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Trigger notification emails (fire-and-forget, don't block confirmation)
      supabase.functions.invoke('notify-booking', {
        body: { bookingId: data.id },
      }).then((res) => {
        if (res.error) console.error('Edge Function error:', res.error)
      }).catch((err) => console.error('Edge Function invoke failed:', err))

      onBooked(data)
    } catch (err) {
      setError(err.message || 'Failed to book. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Book This Slot</h2>
      <p className="mb-6 text-sm text-cobalt-600">{timeLabel}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-500/20 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-500/20 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional — to receive your Zoom link by email
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Private note to host
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything you'd like the host to know"
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-cobalt-500 focus:ring-2 focus:ring-cobalt-500/20 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">Only the host sees this</p>
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="showName"
            checked={showName}
            onChange={(e) => setShowName(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-cobalt-600 focus:ring-cobalt-500"
          />
          <label htmlFor="showName" className="text-sm text-gray-700">
            Show my name on the schedule
            <span className="block text-xs text-gray-500">
              Uncheck to appear as &quot;Booked&quot; instead. The host can always see your name.
            </span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-cobalt-600 py-2.5 text-sm font-semibold text-white hover:bg-cobalt-700 disabled:opacity-50"
          >
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default BookingForm
