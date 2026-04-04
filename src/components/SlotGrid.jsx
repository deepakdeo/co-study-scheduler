import { format } from 'date-fns'
import { generateDaySlots, findBookingForSlot, isSlotPast } from '../lib/slots'
import SlotCell from './SlotCell'

const SlotGrid = ({ room, weekDates, bookings, viewerTimezone, onSelectSlot }) => {
  if (!room || !weekDates.length) return null

  const dayData = weekDates.map((dateStr) => ({
    dateStr,
    ...generateDaySlots(dateStr, room),
  }))

  const formatDayHeader = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return {
      dayName: format(date, 'EEE'),
      dayDate: format(date, 'MMM d'),
    }
  }

  return (
    <>
      {/* Desktop: 5-column grid */}
      <div className="hidden overflow-x-auto md:block">
        <div className="inline-grid min-w-[700px] grid-cols-5 gap-3">
          {weekDates.map((dateStr) => {
            const { dayName, dayDate } = formatDayHeader(dateStr)
            return (
              <div key={dateStr} className="pb-2 text-center">
                <div className="text-sm font-semibold text-gray-900">{dayName}</div>
                <div className="text-xs text-gray-500">{dayDate}</div>
              </div>
            )
          })}

          <div className="col-span-5 border-b border-gray-200 pb-1 text-xs font-medium tracking-wide text-gray-500 uppercase">
            Morning / Afternoon
          </div>
          {renderSlotRows(dayData, 'morningSlots', bookings, viewerTimezone, onSelectSlot)}

          <div className="col-span-5 mt-4 border-b border-gray-200 pb-1 text-xs font-medium tracking-wide text-gray-500 uppercase">
            Evening
          </div>
          {renderSlotRows(dayData, 'eveningSlots', bookings, viewerTimezone, onSelectSlot)}
        </div>
      </div>

      {/* Mobile: stacked day cards */}
      <div className="space-y-6 md:hidden">
        {dayData.map((day) => {
          const { dayName, dayDate } = formatDayHeader(day.dateStr)
          return (
            <div key={day.dateStr} className="rounded-xl bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                {dayName}, {dayDate}
              </h3>

              {day.morningSlots.length > 0 && (
                <>
                  <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                    Morning / Afternoon
                  </p>
                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {day.morningSlots.map((slot, i) => (
                      <SlotCell
                        key={`m-${i}`}
                        slot={slot}
                        bookingResult={findBookingForSlot(slot, bookings)}
                        isPast={isSlotPast(slot)}
                        viewerTimezone={viewerTimezone}
                        onSelect={onSelectSlot}
                      />
                    ))}
                  </div>
                </>
              )}

              {day.eveningSlots.length > 0 && (
                <>
                  <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                    Evening
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {day.eveningSlots.map((slot, i) => (
                      <SlotCell
                        key={`e-${i}`}
                        slot={slot}
                        bookingResult={findBookingForSlot(slot, bookings)}
                        isPast={isSlotPast(slot)}
                        viewerTimezone={viewerTimezone}
                        onSelect={onSelectSlot}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

const renderSlotRows = (dayData, slotKey, bookings, viewerTimezone, onSelectSlot) => {
  const maxSlots = Math.max(...dayData.map((d) => d[slotKey].length))

  const rows = []
  for (let i = 0; i < maxSlots; i++) {
    for (const day of dayData) {
      const slot = day[slotKey][i]
      if (slot) {
        const bookingResult = findBookingForSlot(slot, bookings)
        const isPast = isSlotPast(slot)
        rows.push(
          <SlotCell
            key={`${day.dateStr}-${slotKey}-${i}`}
            slot={slot}
            bookingResult={bookingResult}
            isPast={isPast}
            viewerTimezone={viewerTimezone}
            onSelect={onSelectSlot}
          />,
        )
      } else {
        rows.push(<div key={`${day.dateStr}-${slotKey}-${i}-empty`} />)
      }
    }
  }

  return rows
}

export default SlotGrid
