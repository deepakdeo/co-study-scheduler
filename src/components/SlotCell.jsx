import { toZonedTime } from 'date-fns-tz'
import { format } from 'date-fns'

const SlotCell = ({ slot, booking, isPast, viewerTimezone, onSelect }) => {
  const startInViewer = toZonedTime(slot.slotStartUtc, viewerTimezone)
  const endInViewer = toZonedTime(slot.slotEndUtc, viewerTimezone)
  const timeLabel = `${format(startInViewer, 'h:mm a')} – ${format(endInViewer, 'h:mm a')}`

  if (isPast) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-center opacity-50">
        <span className="text-xs text-gray-400">{timeLabel}</span>
      </div>
    )
  }

  if (booking) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 px-2 py-2 text-center">
        <span className="text-xs text-gray-600">{timeLabel}</span>
        <p className="mt-0.5 truncate text-xs font-medium text-amber-800">{booking.name}</p>
      </div>
    )
  }

  return (
    <button
      onClick={() => onSelect(slot)}
      aria-label={`Book slot ${timeLabel}`}
      className="w-full rounded-lg border border-green-300 bg-green-50 px-2 py-2 text-center hover:border-green-400 hover:bg-green-100"
    >
      <span className="text-xs text-gray-600">{timeLabel}</span>
      <p className="mt-0.5 text-xs font-medium text-green-700">Open</p>
    </button>
  )
}

export default SlotCell
