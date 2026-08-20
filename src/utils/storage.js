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
    
    const teacherUUID = bookingData.teacher?.id || null
    
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
      false,
      teacherUUID
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
      await updateAvailability(booking.booking_date, booking.booking_time, true, booking.teacher_id)
      
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
      await updateAvailability(booking.booking_date, booking.booking_time, true, booking.teacher_id)
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

export const getTeachers = async () => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return []

    let { data, error } = await supabase
      .from('teachers')
      .select('id, name, level, description, experience, password, avatar_url, extra_fee')
      .eq('tenant_id', tenantUUID)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      const basicResult = await supabase
        .from('teachers')
        .select('id, name, level, password, avatar_url, extra_fee')
        .eq('tenant_id', tenantUUID)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (basicResult.error) {
        const legacyResult = await supabase
          .from('teachers')
          .select('id, name, level, extra_fee')
          .eq('tenant_id', tenantUUID)
          .eq('is_active', true)
          .order('created_at', { ascending: true })

        if (legacyResult.error) throw error
        data = legacyResult.data
      } else {
        data = basicResult.data
      }
    }
    return data || []
  } catch (error) {
    console.error('Error getting teachers:', error)
    return []
  }
}

export const uploadTeacherAvatar = async (file, teacherId) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID || !teacherId || !file) return null
    if (!file.type.startsWith('image/')) throw new Error('請選擇圖片檔案')
    if (file.size > 5 * 1024 * 1024) throw new Error('圖片大小不可超過 5MB')

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${tenantUUID}/${teacherId}-${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('teacher-avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) throw uploadError
    const { data: publicData } = supabase.storage.from('teacher-avatars').getPublicUrl(path)
    const avatarUrl = publicData.publicUrl

    const { data: updatedTeacher, error: updateError } = await supabase
      .from('teachers')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', teacherId)
      .eq('tenant_id', tenantUUID)
      .select('id, avatar_url')
      .maybeSingle()

    if (updateError) throw updateError
    if (!updatedTeacher?.avatar_url) throw new Error('大頭貼已上傳，但老師資料未更新，請確認 teachers.avatar_url 欄位與 UPDATE 權限')
    return avatarUrl
  } catch (error) {
    console.error('Error uploading teacher avatar:', error)
    throw error
  }
}

export const getTimeSlotsForDate = async (dateStr, timeSlots, teacherId) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) {
      return timeSlots.map((time) => ({ time, available: true }))
    }

    const availabilityQuery = supabase
      .from('availability')
      .select('time, is_available')
      .eq('tenant_id', tenantUUID)
      .eq('date', dateStr)
      .eq('teacher_id', teacherId)

    const bookingQuery = supabase
      .from('bookings')
      .select('booking_time, status')
      .eq('tenant_id', tenantUUID)
      .eq('booking_date', dateStr)
      .eq('teacher_id', teacherId)

    const [tenantRes, availRes, bookingRes] = await Promise.all([
      supabase
        .from('tenants')
        .select('business_hours')
        .eq('subdomain', currentTenantSubdomain)
        .maybeSingle(),
      availabilityQuery,
      bookingQuery
    ])

    if (tenantRes.error) throw tenantRes.error
    if (availRes.error) throw availRes.error
    if (bookingRes.error) throw bookingRes.error

    const businessHours = tenantRes.data?.business_hours
    if (businessHours) {
      const dayHours = businessHours[new Date(`${dateStr}T00:00:00`).getDay()]
      if (dayHours?.enabled) {
        const configuredSlots = []
        for (let hour = dayHours.start; hour < dayHours.end; ) {
          configuredSlots.push(hour)
          const [hours, minutes] = hour.split(':').map(Number)
          const nextMinutes = hours * 60 + minutes + 60
          hour = `${String(Math.floor(nextMinutes / 60)).padStart(2, '0')}:${String(nextMinutes % 60).padStart(2, '0')}`
        }
        timeSlots = configuredSlots
      }
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
      available: !bookedTimes.has(time) && (teacherId ? availMap[time] === true : availMap[time] !== false)
    }))
  } catch (error) {
    console.error('Error getting time slots:', error)
    return timeSlots.map((time) => ({ time, available: true }))
  }
}

export const getTimeSlotsForDates = async (dateStrs, timeSlots, teacherId) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return {}

    const [tenantRes, availRes, bookingRes] = await Promise.all([
      supabase
        .from('tenants')
        .select('business_hours')
        .eq('subdomain', currentTenantSubdomain)
        .maybeSingle(),
      supabase
        .from('availability')
        .select('date, time, is_available')
        .eq('tenant_id', tenantUUID)
        .eq('teacher_id', teacherId)
        .in('date', dateStrs),
      supabase
        .from('bookings')
        .select('booking_date, booking_time, status')
        .eq('tenant_id', tenantUUID)
        .eq('teacher_id', teacherId)
        .in('booking_date', dateStrs)
    ])

    if (tenantRes.error) throw tenantRes.error
    if (availRes.error) throw availRes.error
    if (bookingRes.error) throw bookingRes.error

    const availabilityMap = {}
    ;(availRes.data || []).forEach((row) => {
      if (!availabilityMap[row.date]) availabilityMap[row.date] = {}
      availabilityMap[row.date][row.time] = row.is_available
    })

    const bookingsMap = {}
    ;(bookingRes.data || [])
      .filter((booking) => booking.status !== 'cancelled')
      .forEach((booking) => {
        if (!bookingsMap[booking.booking_date]) bookingsMap[booking.booking_date] = new Set()
        bookingsMap[booking.booking_date].add(booking.booking_time)
      })

    const businessHours = tenantRes.data?.business_hours
    return Object.fromEntries(dateStrs.map((dateStr) => {
      const dayHours = businessHours?.[new Date(`${dateStr}T00:00:00`).getDay()]
      let configuredSlots = timeSlots
      if (dayHours?.enabled) {
        configuredSlots = []
        for (let hour = dayHours.start; hour < dayHours.end; ) {
          configuredSlots.push(hour)
          const [hours, minutes] = hour.split(':').map(Number)
          const nextMinutes = hours * 60 + minutes + 60
          hour = `${String(Math.floor(nextMinutes / 60)).padStart(2, '0')}:${String(nextMinutes % 60).padStart(2, '0')}`
        }
      }

      const dateAvailability = availabilityMap[dateStr] || {}
      const bookedTimes = bookingsMap[dateStr] || new Set()
      return [dateStr, configuredSlots.map((time) => ({
        time,
        available: !bookedTimes.has(time) && dateAvailability[time] === true
      }))]
    }))
  } catch (error) {
    console.error('Error getting time slots:', error)
    return {}
  }
}

// Get availability data for a specific date
export const getAvailabilityForDate = async (date, teacherId) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return {}
    
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('tenant_id', tenantUUID)
      .eq('date', date)
      .eq('teacher_id', teacherId)
    
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

export const getAvailabilityForDates = async (dates, teacherId) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID || !teacherId || dates.length === 0) return {}

    const { data, error } = await supabase
      .from('availability')
      .select('date, time, is_available, teacher_id')
      .eq('tenant_id', tenantUUID)
      .eq('teacher_id', teacherId)
      .in('date', dates)

    if (error) throw error

    return (data || []).reduce((result, row) => {
      if (row.teacher_id !== teacherId) return result
      if (!result[row.date]) result[row.date] = {}
      result[row.date][row.time] = row.is_available
      return result
    }, {})
  } catch (error) {
    console.error('Error getting availability dates:', error)
    return {}
  }
}

export const getTeacherScheduleDates = async (teacherId) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID || !teacherId) return null

    const { data, error } = await supabase
      .from('teacher_schedule_dates')
      .select('date')
      .eq('tenant_id', tenantUUID)
      .eq('teacher_id', teacherId)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error getting teacher schedule dates:', error)
      return null
    }
    return (data || []).map((row) => row.date)
  } catch (error) {
    console.error('Error getting teacher schedule dates:', error)
    return []
  }
}

export const saveTeacherScheduleDates = async (dates, teacherId) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID || !teacherId) return false

    const { error: deleteError } = await supabase
      .from('teacher_schedule_dates')
      .delete()
      .eq('tenant_id', tenantUUID)
      .eq('teacher_id', teacherId)

    if (deleteError) throw deleteError
    if (dates.length === 0) return true

    const { error } = await supabase
      .from('teacher_schedule_dates')
      .insert(dates.map((date) => ({ tenant_id: tenantUUID, teacher_id: teacherId, date })))

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error saving teacher schedule dates:', error)
    return false
  }
}

// Update availability for a specific date and time
export const updateAvailability = async (date, time, isAvailable, teacherId) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID) return false
    
    const { error } = await supabase
      .from('availability')
      .upsert({
        tenant_id: tenantUUID,
        teacher_id: teacherId,
        date: date,
        time: time,
        is_available: isAvailable
      }, {
        onConflict: 'tenant_id,teacher_id,date,time'
      })
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating availability:', error)
    return false
  }
}

export const updateAvailabilityBatch = async (availability, teacherId) => {
  try {
    const tenantUUID = await getTenantUUID()
    if (!tenantUUID || !teacherId || availability.length === 0) return false

    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', teacherId)
      .eq('tenant_id', tenantUUID)
      .eq('is_active', true)
      .maybeSingle()

    if (teacherError) throw teacherError
    if (!teacher) throw new Error('找不到目前老師，無法儲存上班時段')

    const rowsToSave = availability.map(({ date, time, isAvailable }) => ({
      tenant_id: tenantUUID,
      teacher_id: teacherId,
      date,
      time,
      is_available: isAvailable
    }))

    const { error } = await supabase
      .from('availability')
      .upsert(
        rowsToSave,
        { onConflict: 'tenant_id,teacher_id,date,time' }
      )

    if (error) throw error

    const { data: savedRows, error: verifyError } = await supabase
      .from('availability')
      .select('date, time, is_available, teacher_id')
      .eq('tenant_id', tenantUUID)
      .eq('teacher_id', teacherId)

    if (verifyError) throw verifyError

    const savedMap = new Map(savedRows.map((row) => [`${row.date}|${row.time}`, row]))
    return rowsToSave.every((row) => {
      const savedRow = savedMap.get(`${row.date}|${row.time}`)
      return savedRow?.teacher_id === teacherId && savedRow.is_available === row.is_available
    })
  } catch (error) {
    console.error('Error updating availability batch:', error)
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
