import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const useRoom = (slug) => {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return

    const fetchRoom = async () => {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('slug', slug)
        .single()

      if (fetchError) {
        setError(fetchError.message)
        setRoom(null)
      } else {
        setRoom(data)
        setError(null)
      }
      setLoading(false)
    }

    fetchRoom()
  }, [slug])

  return { room, loading, error }
}

export default useRoom
