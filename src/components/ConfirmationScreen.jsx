import { useState } from 'react'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { supabase } from '../lib/supabase'
import { downloadICS } from '../lib/calendar'

const ConfirmationScreen = ({ booking, room, slug, viewerTimezone, onBack, onCancelled }) => {
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [copied, setCopied] = useState(false)
  const [detailsCopied, setDetailsCopied] = useState(false)

  const startInViewer = toZonedTime(new Date(booking.slot_start_utc), viewerTimezone)
  const endInViewer = toZonedTime(new Date(booking.slot_end_utc), viewerTimezone)

  const dateLabel = format(startInViewer, 'EEEE, MMMM d, yyyy')
  const timeLabel = `${format(startInViewer, 'h:mm a')} – ${format(endInViewer, 'h:mm a')}`

  const manageUrl = `${window.location.origin}/r/${slug}?booking=${booking.id}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(manageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleAddToCalendar = () => {
    downloadICS({
      title: room.title,
      room,
      startUtc: booking.slot_start_utc,
      endUtc: booking.slot_end_utc,
    })
  }

  const handleCopyDetails = async () => {
    const details = `${room.title}\nWith ${room.host_name}\n${dateLabel}\n${timeLabel} (${viewerTimezone})`
    try {
      await navigator.clipboard.writeText(details)
      setDetailsCopied(true)
      setTimeout(() => setDetailsCopied(false), 2000)
    } catch {}
  }

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

      {/* Add to Calendar & Copy Details */}
      <div className="mb-6 flex gap-3 justify-center">
        <button
          onClick={handleAddToCalendar}
          className="flex items-center gap-2 rounded-lg bg-cobalt-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cobalt-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          Add to Calendar
        </button>
        <button
          onClick={handleCopyDetails}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
          {detailsCopied ? 'Copied!' : 'Copy Details'}
        </button>
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

      {/* Manage booking link */}
      <div className="mb-6 rounded-lg border border-cobalt-200 bg-cobalt-50 p-4 text-left">
        <p className="mb-2 text-sm font-medium text-gray-900">Save this link to manage your booking:</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={manageUrl}
            className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600"
          />
          <button
            onClick={handleCopy}
            className="whitespace-nowrap rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Use this link to cancel or reschedule anytime — even from a different device.
        </p>
      </div>

      {room.slot_duration >= 60 && (
        <div className="mb-6 rounded-lg bg-cobalt-50 p-4 text-left text-xs text-gray-600">
          <p className="mb-1 font-medium text-gray-900">Session Format</p>
          <ul className="space-y-1">
            <li>5–10 min: Hello &amp; share goals</li>
            <li>~{room.slot_duration - 20} min: Focused study</li>
            <li>10–15 min: Wrap-up &amp; chat</li>
          </ul>
        </div>
      )}

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
