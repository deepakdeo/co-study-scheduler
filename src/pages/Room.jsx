import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { supabase } from '../lib/supabase'
import useRoom from '../hooks/useRoom'
import useBookings from '../hooks/useBookings'
import useTimezone from '../hooks/useTimezone'
import { getWeekRange } from '../lib/slots'
import WeekNavigator from '../components/WeekNavigator'
import TimezoneIndicator from '../components/TimezoneIndicator'
import SlotGrid from '../components/SlotGrid'
import BookingForm from '../components/BookingForm'
import ConfirmationScreen from '../components/ConfirmationScreen'

const STORAGE_KEY = 'co-study-bookings'

const saveBookingToStorage = (roomId, bookingId) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    stored[roomId] = bookingId
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {}
}

const getBookingFromStorage = (roomId) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return stored[roomId] || null
  } catch {
    return null
  }
}

const removeBookingFromStorage = (roomId) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    delete stored[roomId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {}
}

const Room = () => {
  const { slug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { room, loading: roomLoading, error: roomError } = useRoom(slug)
  const { timezone, setTimezone } = useTimezone()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [myBooking, setMyBooking] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [loadingMyBooking, setLoadingMyBooking] = useState(false)

  const hostTimezone = room?.host_timezone || 'America/Chicago'
  const weekDates = getWeekRange(weekOffset, hostTimezone)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[weekDates.length - 1]

  const { bookings, loading: bookingsLoading, refetch } = useBookings(room?.id, weekStart, weekEnd)

  // Look up user's booking from URL param or localStorage
  useEffect(() => {
    if (!room) return

    const bookingIdFromUrl = searchParams.get('booking')
    const bookingIdFromStorage = getBookingFromStorage(room.id)
    const bookingId = bookingIdFromUrl || bookingIdFromStorage

    if (!bookingId) {
      setMyBooking(null)
      return
    }

    // First check current bookings list
    const found = bookings.find(
      (b) => b.id === bookingId && b.status === 'confirmed',
    )
    if (found) {
      setMyBooking(found)
      saveBookingToStorage(room.id, bookingId)
      return
    }

    // If from URL but not in current week's bookings, fetch directly
    if (bookingIdFromUrl) {
      setLoadingMyBooking(true)
      supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingIdFromUrl)
        .eq('room_id', room.id)
        .eq('status', 'confirmed')
        .single()
        .then(({ data }) => {
          if (data) {
            setMyBooking(data)
            saveBookingToStorage(room.id, data.id)
          } else {
            setMyBooking(null)
            removeBookingFromStorage(room.id)
          }
          setLoadingMyBooking(false)
        })
    } else {
      // localStorage reference but not in current week — might be a different week
      setMyBooking(null)
    }
  }, [room, bookings, searchParams])

  const handleBooked = (booking) => {
    saveBookingToStorage(room.id, booking.id)
    setConfirmation(booking)
  }

  const handleCancelMyBooking = async () => {
    if (!myBooking) return
    if (!confirm('Are you sure you want to cancel your booking?')) return

    setCancelling(true)
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', myBooking.id)

    if (!error) {
      removeBookingFromStorage(room.id)
      setMyBooking(null)
      // Clear the booking param from URL
      searchParams.delete('booking')
      setSearchParams(searchParams, { replace: true })
      refetch()
    }
    setCancelling(false)
  }

  if (roomLoading || loadingMyBooking) {
    return (
      <div className="py-20 text-center text-gray-500">Loading room...</div>
    )
  }

  if (roomError || !room) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Room not found</h2>
        <p className="mt-2 text-gray-500">This room may not exist or has been deactivated.</p>
      </div>
    )
  }

  if (confirmation) {
    return (
      <ConfirmationScreen
        booking={confirmation}
        room={room}
        slug={slug}
        viewerTimezone={timezone}
        onBack={() => {
          setConfirmation(null)
          setSelectedSlot(null)
          refetch()
        }}
        onCancelled={() => {
          removeBookingFromStorage(room.id)
          setConfirmation(null)
          setSelectedSlot(null)
          setMyBooking(null)
          searchParams.delete('booking')
          setSearchParams(searchParams, { replace: true })
          refetch()
        }}
      />
    )
  }

  return (
    <div>
      {/* Room header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{room.title}</h1>
        <p className="mt-1 text-gray-600">Hosted by {room.host_name}</p>
        {room.description && <p className="mt-2 text-sm text-gray-500">{room.description}</p>}
        <p className="mt-3 text-xs text-gray-400">
          Sessions are {room.slot_duration >= 60
            ? `${room.slot_duration / 60} hour${room.slot_duration > 60 ? 's' : ''}`
            : `${room.slot_duration} min`}
          {room.slot_duration >= 60 && <> &mdash; start with a quick hello, then focused study, wrap up with a chat</>}
        </p>
      </div>

      {/* User's active booking banner */}
      {myBooking && (
        <MyBookingBanner
          booking={myBooking}
          viewerTimezone={timezone}
          onCancel={handleCancelMyBooking}
          cancelling={cancelling}
        />
      )}

      {/* Controls */}
      <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <TimezoneIndicator timezone={timezone} onChange={setTimezone} />
        <WeekNavigator
          weekDates={weekDates}
          onPrev={() => setWeekOffset((o) => o - 1)}
          onNext={() => setWeekOffset((o) => o + 1)}
          canGoPrev={weekOffset > 0}
        />
      </div>

      {/* Slot grid or booking form */}
      {selectedSlot ? (
        <BookingForm
          slot={selectedSlot}
          room={room}
          viewerTimezone={timezone}
          onCancel={() => setSelectedSlot(null)}
          onBooked={handleBooked}
        />
      ) : (
        <>
          {bookingsLoading ? (
            <div className="py-10 text-center text-gray-500">Loading schedule...</div>
          ) : (
            <SlotGrid
              room={room}
              weekDates={weekDates}
              bookings={bookings}
              viewerTimezone={timezone}
              onSelectSlot={setSelectedSlot}
            />
          )}
        </>
      )}
    </div>
  )
}

const MyBookingBanner = ({ booking, viewerTimezone, onCancel, cancelling }) => {
  const start = toZonedTime(new Date(booking.slot_start_utc), viewerTimezone)
  const end = toZonedTime(new Date(booking.slot_end_utc), viewerTimezone)
  const dateLabel = format(start, 'EEE, MMM d')
  const timeLabel = `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`

  return (
    <div className="mb-6 flex flex-col items-center justify-between gap-3 rounded-xl bg-cobalt-50 p-4 sm:flex-row">
      <div className="text-sm">
        <p className="font-medium text-gray-900">Your booking: {dateLabel} at {timeLabel}</p>
        <p className="text-xs text-gray-500">Cancel to book a different slot</p>
      </div>
      <button
        onClick={onCancel}
        disabled={cancelling}
        className="rounded-lg border border-red-300 bg-white px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {cancelling ? 'Cancelling...' : 'Cancel Booking'}
      </button>
    </div>
  )
}

export default Room
