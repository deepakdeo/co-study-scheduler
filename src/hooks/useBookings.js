import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const useBookings = (roomId, weekStart, weekEnd) => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBookings = useCallback(async () => {
    if (!roomId || !weekStart || !weekEnd) return

    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'confirmed')
      .gte('booking_date', weekStart)
      .lte('booking_date', weekEnd)

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }, [roomId, weekStart, weekEnd])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Real-time subscription
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`bookings-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchBookings()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, fetchBookings])

  return { bookings, loading, error, refetch: fetchBookings }
}

export default useBookings
