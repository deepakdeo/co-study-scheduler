export const detectTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/Chicago'
  }
}

const COMMON_TIMEZONES = [
  // US
  { value: 'America/New_York', label: 'Eastern Time - America/New_York' },
  { value: 'America/Chicago', label: 'Central Time - America/Chicago' },
  { value: 'America/Denver', label: 'Mountain Time - America/Denver' },
  { value: 'America/Los_Angeles', label: 'Pacific Time - America/Los_Angeles' },
  { value: 'America/Anchorage', label: 'Alaska Time - America/Anchorage' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time - Pacific/Honolulu' },
  // Canada
  { value: 'America/Toronto', label: 'Eastern Time - America/Toronto' },
  { value: 'America/Vancouver', label: 'Pacific Time - America/Vancouver' },
  // Europe
  { value: 'Europe/London', label: 'GMT/BST - Europe/London' },
  { value: 'Europe/Paris', label: 'CET - Europe/Paris' },
  { value: 'Europe/Berlin', label: 'CET - Europe/Berlin' },
  { value: 'Europe/Amsterdam', label: 'CET - Europe/Amsterdam' },
  { value: 'Europe/Zurich', label: 'CET - Europe/Zurich' },
  { value: 'Europe/Madrid', label: 'CET - Europe/Madrid' },
  { value: 'Europe/Rome', label: 'CET - Europe/Rome' },
  { value: 'Europe/Stockholm', label: 'CET - Europe/Stockholm' },
  { value: 'Europe/Helsinki', label: 'EET - Europe/Helsinki' },
  { value: 'Europe/Athens', label: 'EET - Europe/Athens' },
  { value: 'Europe/Moscow', label: 'MSK - Europe/Moscow' },
  // Asia
  { value: 'Asia/Dubai', label: 'Gulf Time - Asia/Dubai' },
  { value: 'Asia/Kolkata', label: 'IST - Asia/Kolkata' },
  { value: 'Asia/Bangkok', label: 'ICT - Asia/Bangkok' },
  { value: 'Asia/Singapore', label: 'SGT - Asia/Singapore' },
  { value: 'Asia/Shanghai', label: 'CST - Asia/Shanghai' },
  { value: 'Asia/Tokyo', label: 'JST - Asia/Tokyo' },
  { value: 'Asia/Seoul', label: 'KST - Asia/Seoul' },
  // Oceania
  { value: 'Australia/Sydney', label: 'AEST - Australia/Sydney' },
  { value: 'Australia/Melbourne', label: 'AEST - Australia/Melbourne' },
  { value: 'Pacific/Auckland', label: 'NZST - Pacific/Auckland' },
  // South America
  { value: 'America/Sao_Paulo', label: 'BRT - America/Sao_Paulo' },
  { value: 'America/Argentina/Buenos_Aires', label: 'ART - America/Argentina/Buenos_Aires' },
  // Africa
  { value: 'Africa/Lagos', label: 'WAT - Africa/Lagos' },
  { value: 'Africa/Cairo', label: 'EET - Africa/Cairo' },
  { value: 'Africa/Johannesburg', label: 'SAST - Africa/Johannesburg' },
]

export const getCommonTimezones = (detected) => {
  const exists = COMMON_TIMEZONES.some((tz) => tz.value === detected)
  if (detected && !exists) {
    return [{ value: detected, label: `Detected - ${detected}` }, ...COMMON_TIMEZONES]
  }
  return COMMON_TIMEZONES
}
