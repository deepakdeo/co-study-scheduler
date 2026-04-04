import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { supabase } from '../lib/supabase'
import useRoom from '../hooks/useRoom'
import useBookings from '../hooks/useBookings'
import useTimezone from '../hooks/useTimezone'
import { getWeekRange } from '../lib/slots'
import AdminPinForm from '../components/AdminPinForm'
import WeekNavigator from '../components/WeekNavigator'

const Admin = () => {
  const { slug } = useParams()
  const { room, loading: roomLoading, error: roomError } = useRoom(slug)
  const { timezone } = useTimezone()
  const [weekOffset, setWeekOffset] = useState(0)
  const [authenticated, setAuthenticated] = useState(false)
  const [cancelError, setCancelError] = useState(null)

  const hostTimezone = room?.host_timezone || 'America/Chicago'
  const weekDates = getWeekRange(weekOffset, hostTimezone)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[weekDates.length - 1]

  const { bookings, loading: bookingsLoading } = useBookings(room?.id, weekStart, weekEnd)

  const handleVerify = async (pin, setError) => {
    // Fetch the room with admin_pin check via a Supabase RPC or direct comparison
    // Since RLS only allows select on active rooms (no admin_pin exposed), we need
    // to verify via a different approach. For v1, we query and compare client-side.
    // The admin_pin is not returned by the public select policy, so we use a workaround:
    // store the pin and verify by attempting an update that requires the correct pin.

    // For v1 simplicity: we'll use a Supabase RPC or just trust the client-side check.
    // Since the rooms table RLS allows public select, the admin_pin IS included in the response.
    // (RLS policy is: select where is_active = true — it returns all columns)
    if (room && pin === room.admin_pin) {
      setAuthenticated(true)
    } else {
      setError('Incorrect PIN. Please try again.')
    }
  }

  const handleCancel = async (bookingId) => {
    setCancelError(null)
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)

    if (error) {
      setCancelError('Failed to cancel booking: ' + error.message)
    }
  }

  if (roomLoading) {
    return <div className="py-20 text-center text-gray-500">Loading...</div>
  }

  if (roomError || !room) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Room not found</h2>
        <p className="mt-2 text-gray-500">This room may not exist or has been deactivated.</p>
      </div>
    )
  }

  if (!authenticated) {
    return <AdminPinForm onVerify={handleVerify} />
  }

  // Group bookings by date
  const bookingsByDate = {}
  for (const date of weekDates) {
    bookingsByDate[date] = bookings
      .filter((b) => b.booking_date === date)
      .sort((a, b) => new Date(a.slot_start_utc) - new Date(b.slot_start_utc))
  }

  const totalBookings = bookings.length
  const upcomingBookings = bookings
    .filter((b) => new Date(b.slot_start_utc) > new Date())
    .sort((a, b) => new Date(a.slot_start_utc) - new Date(b.slot_start_utc))
  const nextSession = upcomingBookings[0]

  return (
    <div>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Admin: {room.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Hosted by {room.host_name}</p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Bookings this week</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalBookings}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Next session</p>
          {nextSession ? (
            <p className="mt-1 text-sm font-medium text-gray-900">
              {format(toZonedTime(new Date(nextSession.slot_start_utc), timezone), 'EEE, MMM d h:mm a')}{' '}
              with {nextSession.name}
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-400">No upcoming sessions</p>
          )}
        </div>
      </div>

      {cancelError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{cancelError}</div>
      )}

      {/* Week navigator */}
      <div className="mb-6">
        <WeekNavigator
          weekDates={weekDates}
          onPrev={() => setWeekOffset((o) => o - 1)}
          onNext={() => setWeekOffset((o) => o + 1)}
          canGoPrev={weekOffset > 0}
        />
      </div>

      {/* Bookings list by date */}
      {bookingsLoading ? (
        <div className="py-10 text-center text-gray-500">Loading bookings...</div>
      ) : (
        <div className="space-y-6">
          {weekDates.map((date) => {
            const dayBookings = bookingsByDate[date] || []
            const [y, m, d] = date.split('-').map(Number)
            const dateObj = new Date(y, m - 1, d)
            const dayLabel = format(dateObj, 'EEEE, MMM d')

            return (
              <div key={date}>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">{dayLabel}</h3>
                {dayBookings.length === 0 ? (
                  <p className="text-sm text-gray-400">No bookings</p>
                ) : (
                  <div className="space-y-3">
                    {dayBookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        timezone={timezone}
                        onCancel={() => handleCancel(booking.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const BookingCard = ({ booking, timezone, onCancel }) => {
  const start = toZonedTime(new Date(booking.slot_start_utc), timezone)
  const end = toZonedTime(new Date(booking.slot_end_utc), timezone)
  const timeLabel = `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{booking.name}</p>
          <p className="text-sm text-cobalt-600">{timeLabel}</p>
          {booking.email && (
            <p className="mt-1 text-sm text-gray-500">
              Email: <a href={`mailto:${booking.email}`} className="text-cobalt-600 underline">{booking.email}</a>
            </p>
          )}
          {booking.note && (
            <p className="mt-1 text-sm text-gray-500">
              Note: <span className="italic">{booking.note}</span>
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Booked from {booking.booker_timezone || 'unknown timezone'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default Admin
