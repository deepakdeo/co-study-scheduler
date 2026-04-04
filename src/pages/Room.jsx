import { useState } from 'react'
import { useParams } from 'react-router-dom'
import useRoom from '../hooks/useRoom'
import useBookings from '../hooks/useBookings'
import useTimezone from '../hooks/useTimezone'
import { getWeekRange } from '../lib/slots'
import WeekNavigator from '../components/WeekNavigator'
import TimezoneIndicator from '../components/TimezoneIndicator'
import SlotGrid from '../components/SlotGrid'
import BookingForm from '../components/BookingForm'
import ConfirmationScreen from '../components/ConfirmationScreen'

const Room = () => {
  const { slug } = useParams()
  const { room, loading: roomLoading, error: roomError } = useRoom(slug)
  const { timezone, setTimezone } = useTimezone()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  const hostTimezone = room?.host_timezone || 'America/Chicago'
  const weekDates = getWeekRange(weekOffset, hostTimezone)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[weekDates.length - 1]

  const { bookings, loading: bookingsLoading } = useBookings(room?.id, weekStart, weekEnd)

  if (roomLoading) {
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
        viewerTimezone={timezone}
        onBack={() => {
          setConfirmation(null)
          setSelectedSlot(null)
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
          Sessions are 2 hours: 5–10 min hello &amp; goals &rarr; ~100 min focused study &rarr;
          10–15 min wrap-up &amp; chat
        </p>
      </div>

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
          onBooked={(booking) => setConfirmation(booking)}
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

export default Room
