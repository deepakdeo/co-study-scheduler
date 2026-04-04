import { getCommonTimezones } from '../lib/timezone'

const TimezoneIndicator = ({ timezone, onChange }) => {
  const timezones = getCommonTimezones(timezone)

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <label htmlFor="tz-select">Viewing in:</label>
      <select
        id="tz-select"
        value={timezone}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-cobalt-500 focus:outline-none"
      >
        {timezones.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default TimezoneIndicator
