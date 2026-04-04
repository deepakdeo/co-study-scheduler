import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMinutes,
  format,
  isBefore,
  isWeekend,
} from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

/**
 * Get the Monday–Friday date range for a given week offset from today.
 * Returns dates as YYYY-MM-DD strings in the host's timezone.
 */
export const getWeekRange = (weekOffset, hostTimezone) => {
  const nowInHostTz = toZonedTime(new Date(), hostTimezone)
  const baseDate = new Date(nowInHostTz)

  // Auto-advance to next week on weekends (Sat=6, Sun=0)
  const dayOfWeek = baseDate.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 2
    baseDate.setDate(baseDate.getDate() + daysUntilMonday)
  }

  baseDate.setDate(baseDate.getDate() + weekOffset * 7)

  const start = startOfWeek(baseDate, { weekStartsOn: 1 }) // Monday
  const end = endOfWeek(baseDate, { weekStartsOn: 1 }) // Sunday

  const days = eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d))

  return days.map((d) => format(d, 'yyyy-MM-dd'))
}

/**
 * Generate all slots for a single day using both morning and evening windows.
 */
export const generateDaySlots = (dateStr, room) => {
  const { host_timezone, morning_start, morning_end, evening_start, evening_end, slot_duration, slot_interval } = room

  const morningSlots = generateSlotsForWindow(
    dateStr,
    morning_start,
    morning_end,
    slot_duration,
    slot_interval,
    host_timezone,
  )

  const eveningSlots = generateSlotsForWindow(
    dateStr,
    evening_start,
    evening_end,
    slot_duration,
    slot_interval,
    host_timezone,
  )

  return { morningSlots, eveningSlots }
}

/**
 * Generate slots for a specific time window on a given date.
 */
const generateSlotsForWindow = (dateStr, windowStartHour, windowEndHour, duration, interval, hostTimezone) => {
  const slots = []
  const lastValidStartHour = windowEndHour - duration / 60

  let currentMinutes = windowStartHour * 60 // convert to minutes for easier iteration
  const lastValidMinutes = lastValidStartHour * 60

  while (currentMinutes <= lastValidMinutes) {
    const hours = Math.floor(currentMinutes / 60)
    const mins = currentMinutes % 60

    const hostStartStr = `${dateStr}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`
    const slotStartUtc = fromZonedTime(hostStartStr, hostTimezone)
    const slotEndUtc = addMinutes(slotStartUtc, duration)

    slots.push({
      dateStr,
      hostStartStr,
      slotStartUtc,
      slotEndUtc,
    })

    currentMinutes += interval
  }

  return slots
}

/**
 * Check if two time ranges overlap.
 */
export const slotsOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA
}

/**
 * Check if a slot is booked or blocked by an overlapping booking.
 * Returns { booking, isExactMatch } or null.
 * - isExactMatch true: this slot's start time matches the booking's start time (the actual booked slot)
 * - isExactMatch false: this slot overlaps with a booking but isn't the one that was booked (blocked)
 */
export const findBookingForSlot = (slot, bookings) => {
  const match = bookings.find(
    (b) =>
      b.status === 'confirmed' &&
      slotsOverlap(
        slot.slotStartUtc.getTime(),
        slot.slotEndUtc.getTime(),
        new Date(b.slot_start_utc).getTime(),
        new Date(b.slot_end_utc).getTime(),
      ),
  )
  if (!match) return null

  const isExactMatch =
    slot.slotStartUtc.getTime() === new Date(match.slot_start_utc).getTime()

  return { booking: match, isExactMatch }
}

/**
 * Check if a slot is in the past.
 */
export const isSlotPast = (slot) => {
  return isBefore(slot.slotStartUtc, new Date())
}
