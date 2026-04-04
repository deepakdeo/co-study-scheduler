import { useState } from 'react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { supabase } from '../lib/supabase'

const ConfirmationScreen = ({ booking, room, viewerTimezone, onBack, onCancelled }) => {
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  const startInViewer = toZonedTime(new Date(booking.slot_start_utc), viewerTimezone)
  const endInViewer = toZonedTime(new Date(booking.slot_end_utc), viewerTimezone)

  const dateLabel = format(startInViewer, 'EEEE, MMMM d, yyyy')
  const timeLabel = `${format(startInViewer, 'h:mm a')} – ${format(endInViewer, 'h:mm a')}`

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    setCancelling(true)
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', booking.id)

    if (error) {
      alert('Failed to cancel: ' + error.message)
      setCancelling(false)
      return
    }

    setCancelled(true)
    setCancelling(false)
  }

  if (cancelled) {
    return (
      <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <h2 className="mb-2 text-xl font-bold text-gray-900">Booking Cancelled</h2>
        <p className="mb-6 text-sm text-gray-600">
          Your session on {dateLabel} has been cancelled. You can book a different slot.
        </p>
        <button
          onClick={onCancelled}
          className="rounded-lg bg-cobalt-600 px-6 py-2 text-sm font-semibold text-white hover:bg-cobalt-700"
        >
          Book a Different Slot
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
      <div className="mb-4 text-4xl text-green-500">&#10003;</div>
      <h2 className="mb-2 text-xl font-bold text-gray-900">You&apos;re Booked!</h2>

      <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{room.title}</span>
          <br />
          with {room.host_name}
        </p>
        <p className="mt-2 text-sm font-medium text-cobalt-600">{dateLabel}</p>
        <p className="text-sm text-cobalt-600">{timeLabel}</p>
        <p className="mt-1 text-xs text-gray-500">Times shown in your timezone ({viewerTimezone})</p>
      </div>

      {booking.email ? (
        <p className="mb-6 text-sm text-gray-600">
          You&apos;ll receive a Zoom meeting link at{' '}
          <span className="font-medium">{booking.email}</span> before the session.
        </p>
      ) : (
        <p className="mb-6 text-sm text-gray-600">
          {room.host_name} will share your Zoom meeting link via direct message in the group.
        </p>
      )}

      <div className="mb-6 rounded-lg bg-cobalt-50 p-4 text-left text-xs text-gray-600">
        <p className="mb-1 font-medium text-gray-900">Session Format</p>
        <ul className="space-y-1">
          <li>5–10 min: Hello &amp; share goals</li>
          <li>~100 min: Focused study</li>
          <li>10–15 min: Wrap-up &amp; chat</li>
        </ul>
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={onBack}
          className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Schedule
        </button>
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="rounded-lg border border-red-300 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {cancelling ? 'Cancelling...' : 'Cancel Booking'}
        </button>
      </div>
    </div>
  )
}

export default ConfirmationScreen
