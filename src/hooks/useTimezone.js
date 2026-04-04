import { useState } from 'react'
import { detectTimezone } from '../lib/timezone'

const useTimezone = () => {
  const [timezone, setTimezone] = useState(detectTimezone)

  return { timezone, setTimezone }
}

export default useTimezone
