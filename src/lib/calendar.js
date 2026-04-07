import { format } from 'date-fns'

/**
 * Format a Date as an ICS datetime string in UTC (e.g., 20260410T210000Z).
 */
const toICSDate = (date) => {
  return format(date, "yyyyMMdd'T'HHmmss'Z'")
}

/**
 * Generate an .ics calendar file content for a booking.
 */
export const generateICS = ({ title, description, startUtc, endUtc, location }) => {
  const now = new Date()
  const uid = `${now.getTime()}-${Math.random().toString(36).slice(2)}@co-study-scheduler`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Co-Study Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(now)}`,
    `DTSTART:${toICSDate(startUtc)}`,
    `DTEND:${toICSDate(endUtc)}`,
    `SUMMARY:${escapeICSText(title)}`,
  ]

  if (description) {
    lines.push(`DESCRIPTION:${escapeICSText(description)}`)
  }

  if (location) {
    lines.push(`LOCATION:${escapeICSText(location)}`)
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Escape special characters for ICS text fields.
 */
const escapeICSText = (text) => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Download an .ics file.
 */
export const downloadICS = ({ title, room, startUtc, endUtc }) => {
  const description = `Co-study session with ${room.host_name}\\n\\nSession format:\\n- 5-10 min: Hello & share goals\\n- ~${room.slot_duration - 20} min: Focused study\\n- 10-15 min: Wrap-up & chat`

  const icsContent = generateICS({
    title: `${room.title}`,
    description,
    startUtc: new Date(startUtc),
    endUtc: new Date(endUtc),
  })

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
