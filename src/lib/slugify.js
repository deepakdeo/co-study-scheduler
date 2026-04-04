import { supabase } from './supabase'

export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export const validateSlug = (slug) => {
  if (!slug) return { valid: false, error: 'Slug is required' }
  if (slug.length < 3) return { valid: false, error: 'Slug must be at least 3 characters' }
  if (slug.length > 60) return { valid: false, error: 'Slug must be 60 characters or fewer' }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { valid: false, error: 'Only lowercase letters, numbers, and hyphens allowed' }
  }
  return { valid: true, error: null }
}

export const checkSlugUniqueness = async (slug) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (error) return false
  return data === null
}
