import { supabase, currentTenantSubdomain, getTenantUUID } from '../config/supabase'

export const toLocalDateStr = (date) => {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Get all bookings for current tenant
export const getBookings = async () => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return []
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        teacher:teachers(*)
      `)
      .eq('tenant_id', tenantUUID)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting bookings:', error)
    return []
  }
}

// Save a new booking
export const saveBooking = async (bookingData) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return null
    
    const totalPrice = bookingData.service?.price + (bookingData.teacher?.extraFee || 0)
    
    // Get service UUID if service exists
    let serviceUUID = null
    if (bookingData.service?.id) {
      const { data: serviceData } = await supabase
        .from('services')
        .select('id')
        .eq('name', bookingData.service.name)
        .eq('tenant_id', tenantUUID)
        .maybeSingle()
      serviceUUID = serviceData?.id
    }
    
    // Get teacher UUID if teacher exists
    let teacherUUID = null
    if (bookingData.teacher?.id) {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('name', bookingData.teacher.name)
        .eq('tenant_id', tenantUUID)
        .maybeSingle()
      teacherUUID = teacherData?.id
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        tenant_id: tenantUUID,
        service_id: serviceUUID,
        teacher_id: teacherUUID,
        user_name: bookingData.userInfo.name,
        user_phone: bookingData.userInfo.phone,
        user_email: bookingData.userInfo.email,
        user_note: bookingData.userInfo.note,
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        health_declaration: bookingData.healthDeclaration,
        total_price: totalPrice,
        status: 'confirmed'
      })
      .select()
      .maybeSingle()
    
    if (error) throw error
    
    // Update availability
    await updateAvailability(
      bookingData.date, 
      bookingData.time, 
      false
    )
    
    return data
  } catch (error) {
    console.error('Error saving booking:', error)
    return null
  }
}

// Get bookings by phone number for current tenant
export const getBookingsByPhone = async (phone) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return []
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        teacher:teachers(*)
      `)
      .eq('tenant_id', tenantUUID)
      .eq('user_phone', phone)
      .order('booking_date', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting bookings by phone:', error)
    return []
  }
}

// Cancel a booking
export const cancelBooking = async (bookingId) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return false
    
    // First get the booking to restore availability
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('tenant_id', tenantUUID)
      .maybeSingle()
    
    if (booking) {
      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('tenant_id', tenantUUID)
      
      if (error) throw error
      
      // Restore availability
      await updateAvailability(booking.booking_date, booking.booking_time, true)
      
      return true
    }
    return false
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return false
  }
}

export const updateBookingStatus = async (bookingId, status) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return false

    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('tenant_id', tenantUUID)
      .maybeSingle()

    if (!booking) return false

    const { error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)
      .eq('tenant_id', tenantUUID)

    if (error) throw error

    if (status === 'cancelled' && booking.status !== 'cancelled') {
      await updateAvailability(booking.booking_date, booking.booking_time, true)
    }

    return true
  } catch (error) {
    console.error('Error updating booking status:', error)
    return false
  }
}

export const assignTeacherToBooking = async (bookingId, teacherName) => {
  try {
    const tenantUUID = await getTenantUUID()
    const name = teacherName?.trim()
    if (!tenantUUID || !name) return false

    let { data: teacher, error: findError } = await supabase
      .from('teachers')
      .select('id')
      .eq('tenant_id', tenantUUID)
      .eq('name', name)
      .maybeSingle()

    if (findError) throw findError

    if (!teacher) {
      const { data: created, error: createError } = await supabase
        .from('teachers')
        .insert({
          tenant_id: tenantUUID,
          name,
          level: '指定',
          extra_fee: 0
        })
        .select('id')
        .maybeSingle()

      if (createError) throw createError
      teacher = created
    }

    const { error } = await supabase
      .from('bookings')
      .update({
        teacher_id: teacher.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .eq('tenant_id', tenantUUID)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error assigning teacher:', error)
    return false
  }
}

export const getTimeSlotsForDate = async (dateStr, timeSlots) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) {
      return timeSlots.map((time) => ({ time, available: true }))
    }

    const [tenantRes, availRes, bookingRes] = await Promise.all([
      supabase
        .from('tenants')
        .select('business_hours')
        .eq('subdomain', currentTenantSubdomain)
        .maybeSingle(),
      supabase
        .from('availability')
        .select('time, is_available')
        .eq('tenant_id', tenantUUID)
        .eq('date', dateStr),
      supabase
        .from('bookings')
        .select('booking_time, status')
        .eq('tenant_id', tenantUUID)
        .eq('booking_date', dateStr)
    ])

    if (tenantRes.error) throw tenantRes.error
    if (availRes.error) throw availRes.error
    if (bookingRes.error) throw bookingRes.error

    const businessHours = tenantRes.data?.business_hours
    if (businessHours) {
      const dayHours = businessHours[new Date(`${dateStr}T00:00:00`).getDay()]
      if (!dayHours?.enabled) return []

      const configuredSlots = []
      for (let hour = dayHours.start; hour < dayHours.end; ) {
        configuredSlots.push(hour)
        const [hours, minutes] = hour.split(':').map(Number)
        const nextMinutes = hours * 60 + minutes + 60
        hour = `${String(Math.floor(nextMinutes / 60)).padStart(2, '0')}:${String(nextMinutes % 60).padStart(2, '0')}`
      }
      timeSlots = configuredSlots
    }

    const availMap = {}
    ;(availRes.data || []).forEach((row) => {
      availMap[row.time] = row.is_available
    })

    const bookedTimes = new Set(
      (bookingRes.data || [])
        .filter((b) => b.status !== 'cancelled')
        .map((b) => b.booking_time)
    )

    return timeSlots.map((time) => ({
      time,
      available: !bookedTimes.has(time) && availMap[time] !== false
    }))
  } catch (error) {
    console.error('Error getting time slots:', error)
    return timeSlots.map((time) => ({ time, available: true }))
  }
}

// Get availability data for a specific date
export const getAvailabilityForDate = async (date) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return {}
    
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('date', date)
    
    if (error) throw error
    
    // Convert to object format for easy lookup
    const availabilityMap = {}
    data.forEach(slot => {
      availabilityMap[slot.time] = slot.is_available
    })
    
    return availabilityMap
  } catch (error) {
    console.error('Error getting availability:', error)
    return {}
  }
}

// Update availability for a specific date and time
export const updateAvailability = async (date, time, isAvailable) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return false
    
    const { error } = await supabase
      .from('availability')
      .upsert({
        tenant_id: tenantUUID,
        date: date,
        time: time,
        is_available: isAvailable
      }, {
        onConflict: 'tenant_id,date,time'
      })
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating availability:', error)
    return false
  }
}

// Check if a time slot is available
export const isTimeSlotAvailable = async (dateStr, time) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return true
    
    const { data, error } = await supabase
      .from('availability')
      .select('is_available')
      .eq('tenant_id', tenantUUID)
      .eq('date', dateStr)
      .eq('time', time)
      .maybeSingle()
    
    if (error) {
      // If no record exists, assume available
      if (error.code === 'PGRST116') return true
      throw error
    }
    
    return data?.is_available !== false
  } catch (error) {
    console.error('Error checking availability:', error)
    return true // Default to available on error
  }
}

// Initialize availability for a date if not exists
export const initializeAvailabilityForDate = async (date, timeSlots) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return false
    
    const availabilityRecords = timeSlots.map(time => ({
      tenant_id: tenantUUID,
      date: date,
      time: time,
      is_available: true
    }))
    
    const { error } = await supabase
      .from('availability')
      .upsert(availabilityRecords, {
        onConflict: 'tenant_id,date,time',
        ignoreDuplicates: true
      })
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error initializing availability:', error)
    return false
  }
}

export const getBusinessHours = async () => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('business_hours')
      .eq('subdomain', currentTenantSubdomain)
      .maybeSingle()

    if (error) throw error
    return data?.business_hours || null
  } catch (error) {
    console.error('Error getting business hours:', error)
    return null
  }
}
