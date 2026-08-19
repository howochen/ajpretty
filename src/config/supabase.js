import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Current tenant subdomain (in a real app, this would come from subdomain or user session)
export const currentTenantSubdomain = import.meta.env.VITE_TENANT_ID || 'default'

// Helper to get tenant UUID from subdomain
export const getTenantUUID = async () => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', currentTenantSubdomain)
      .maybeSingle()
    
    if (error) throw error
    return data?.id
  } catch (error) {
    console.error('Error getting tenant UUID:', error)
    return null
  }
}

// Helper to add tenant_id to queries
export const withTenant = (query, tenantUUID) => {
  return query.eq('tenant_id', tenantUUID)
}
