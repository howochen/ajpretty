import { useState, useEffect, useRef } from 'react'
import { supabase, getTenantUUID } from '../config/supabase'
import { useTenant } from '../context/TenantContext'
import { Building2, Phone, Mail, Palette, Save, CalendarDays, Clock, Loader2, Trash2, Upload, User } from 'lucide-react'
import { getAvailabilityForDate, getAvailabilityForDates, getTeacherScheduleDates, getTeachers, saveTeacherScheduleDates, toLocalDateStr, updateAvailabilityBatch, uploadTeacherAvatar } from '../utils/storage'

const defaultBusinessHours = {
  0: { enabled: false, start: '10:00', end: '19:00' },
  1: { enabled: true, start: '10:00', end: '19:00' },
  2: { enabled: true, start: '10:00', end: '19:00' },
  3: { enabled: true, start: '10:00', end: '19:00' },
  4: { enabled: true, start: '10:00', end: '19:00' },
  5: { enabled: true, start: '10:00', end: '19:00' },
  6: { enabled: true, start: '10:00', end: '19:00' }
}

const defaultSiteContent = {
  nav_home: '首頁', nav_booking: '線上預約', nav_my_bookings: '我的預約', nav_courses: '課程報名', nav_diary: '變美日誌',
  hero_title: 'AJ創美學苑', hero_subtitle: '美睫｜皮膚管理｜眉型設計｜隱形眼線｜頭皮保養', hero_primary_button: '立即預約', hero_secondary_button: '查看作品',
  services_title: '我們的服務', diary_title: '個人專屬變美日誌', diary_description: '您的每次蛻變，都是我們共同的驕傲', diary_button: '查看變美日誌', contact_title: '聯絡我們', courses_title: '課程報名', courses_description: '提升專業技能，開啟美業新篇章', diary_page_title: '個人專屬變美日誌', diary_page_description: '您的每次蛻變，都是我們共同的驕傲', my_bookings_title: '我的預約', my_bookings_search_title: '查詢預約紀錄', my_bookings_search_description: '請輸入您的手機號碼查詢預約紀錄',
  booking_service_title: '選擇服務', booking_service_description: '請先選擇服務類別', booking_teacher_title: '選擇老師', booking_teacher_description: '選擇指定老師（費用依老師職級加價）', booking_date_title: '選擇日期與時段', booking_date_description: '選擇日期下方的可預約時段'
}

const siteContentGroups = [
  { title: '導覽列', fields: [['nav_home', '首頁'], ['nav_booking', '線上預約'], ['nav_my_bookings', '我的預約'], ['nav_courses', '課程報名'], ['nav_diary', '變美日誌']] },
  { title: '首頁', fields: [['hero_title', '首頁主標題'], ['hero_subtitle', '首頁副標題'], ['hero_primary_button', '主要按鈕文字'], ['hero_secondary_button', '次要按鈕文字'], ['services_title', '服務區標題'], ['diary_title', '日誌區標題'], ['diary_description', '日誌區說明'], ['diary_button', '日誌按鈕文字'], ['contact_title', '聯絡區標題']] },
  { title: '課程與日誌頁面', fields: [['courses_title', '課程頁標題'], ['courses_description', '課程頁說明'], ['diary_page_title', '日誌頁標題'], ['diary_page_description', '日誌頁說明']] },
  { title: '預約流程', fields: [['booking_service_title', '選擇服務標題'], ['booking_service_description', '選擇服務說明'], ['booking_teacher_title', '選擇老師標題'], ['booking_teacher_description', '選擇老師說明'], ['booking_date_title', '日期時段標題'], ['booking_date_description', '日期時段說明']] }
]

const emptyCourse = { title: '', description: '', duration: '', price: 0, deposit: 0, maxStudents: 1, currentStudents: 0, dates: [], level: '' }
const emptyDiaryEntry = { title: '', category: '', date: '', image: '', description: '', tags: [] }
const emptyService = { name: '', description: '', icon: 'sparkles' }

export default function TenantSettings() {
  const { refreshTenant } = useTenant()
  const [activeTab, setActiveTab] = useState('admin')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [adminSaving, setAdminSaving] = useState(false)
  const [teacherSaving, setTeacherSaving] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [selectedDates, setSelectedDates] = useState([])
  const [selectedSlots, setSelectedSlots] = useState([])
  const [editingMonths, setEditingMonths] = useState({})
  const [monthSnapshots, setMonthSnapshots] = useState({})
  const [teachers, setTeachers] = useState([])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [teacherPassword, setTeacherPassword] = useState('')
  const [teacherUnlocked, setTeacherUnlocked] = useState(false)
  const [autoSelectFirstDate, setAutoSelectFirstDate] = useState(true)
  const availabilityRequestRef = useRef(0)
  const [newTeacher, setNewTeacher] = useState({ name: '', description: '', experience: '', password: '' })
  const [newTeacherAvatar, setNewTeacherAvatar] = useState(null)
  const [courseDraft, setCourseDraft] = useState(null)
  const [diaryDraft, setDiaryDraft] = useState(null)
  const [serviceDraft, setServiceDraft] = useState(null)
  const [tenantData, setTenantData] = useState({
    name: '',
    subdomain: '',
    primary_color: '#c9a86c',
    secondary_color: '#f5f0e8',
    contact_phone: '',
    contact_email: '',
    line_id: '',
    instagram_id: '',
    logo_url: '',
    business_hours: defaultBusinessHours,
    site_content: defaultSiteContent
  })

  useEffect(() => {
    loadTenantData()
    loadAdminData()
    loadTeachers()
  }, [])

  useEffect(() => {
    const firstDate = getScheduleDates()[0]
    if (selectedDates.length === 0 && firstDate && autoSelectFirstDate) setSelectedDates([firstDate])
  }, [tenantData.business_hours, selectedDates, autoSelectFirstDate])

  useEffect(() => {
    const requestId = ++availabilityRequestRef.current
    let cancelled = false
    if (selectedDates.length === 0 || !selectedTeacherId || !teacherUnlocked) {
      setSelectedSlots([])
      return () => { cancelled = true }
    }

    loadAvailability(selectedDates[0], selectedTeacherId).then((slots) => {
      if (!cancelled && requestId === availabilityRequestRef.current) setSelectedSlots(slots)
    })

    return () => { cancelled = true }
  }, [selectedDates, selectedTeacherId, teacherUnlocked, tenantData.business_hours])

  useEffect(() => {
    if (!selectedTeacherId || !teacherUnlocked) return undefined
    const requestId = ++availabilityRequestRef.current
    let cancelled = false
    const scheduleDates = getScheduleDates()

    Promise.all([
      getTeacherScheduleDates(selectedTeacherId),
      getAvailabilityForDates(scheduleDates, selectedTeacherId)
    ]).then(([savedDates, availabilityByDate]) => {
      if (cancelled || requestId !== availabilityRequestRef.current) return
      const datesToSelect = savedDates !== null
        ? savedDates.filter((date) => scheduleDates.includes(date))
        : scheduleDates.filter((date) => getSlotsForDate(date).some((time) => availabilityByDate[date]?.[time] === true))
      const firstDate = datesToSelect[0]
      setAutoSelectFirstDate(false)
      setSelectedDates(datesToSelect)
      setSelectedSlots(firstDate
        ? getSlotsForDate(firstDate).filter((time) => availabilityByDate[firstDate]?.[time] === true)
        : [])
    })

    return () => { cancelled = true }
  }, [selectedTeacherId, teacherUnlocked, tenantData.business_hours])

  const loadTeachers = async () => {
    const teacherData = await getTeachers()
    setTeachers(teacherData)
    setSelectedTeacherId((current) => teacherData.some((teacher) => teacher.id === current) ? current : teacherData[0]?.id || '')
    return teacherData
  }

  const handleTeacherChange = (teacherId) => {
    setSelectedTeacherId(teacherId)
    setAutoSelectFirstDate(true)
    setTeacherPassword('')
    setTeacherUnlocked(false)
    setEditingMonths({})
    setMonthSnapshots({})
    setSelectedSlots([])
  }

  const handleTeacherAvatarUpload = async (file) => {
    if (!file || !selectedTeacherId) return
    setTeacherSaving(true)
    try {
      const avatarUrl = await uploadTeacherAvatar(file, selectedTeacherId)
      setTeachers((current) => current.map((teacher) => teacher.id === selectedTeacherId ? { ...teacher, avatar_url: avatarUrl } : teacher))
      alert('老師大頭貼已更新')
    } catch (error) {
      alert(error.message || '大頭貼上傳失敗')
    } finally {
      setTeacherSaving(false)
    }
  }

  const unlockTeacher = () => {
    const teacher = teachers.find((item) => item.id === selectedTeacherId)
    if (!teacherPassword) {
      alert('請輸入老師密碼')
      return
    }
    if (teacherPassword !== String(teacher?.password || '123')) {
      setTeacherUnlocked(false)
      alert('老師密碼錯誤')
      return
    }
    setTeacherUnlocked(true)
    alert('已解鎖，可設定上班時段')
  }

  const handleEditMonth = (monthKey, dates) => {
    setMonthSnapshots((current) => ({
      ...current,
      [monthKey]: {
        dates: selectedDates.filter((date) => dates.includes(date)),
        slots: selectedDates[0]?.startsWith(monthKey) ? [...selectedSlots] : null
      }
    }))
    setEditingMonths((current) => ({ ...current, [monthKey]: true }))
  }

  const handleCancelMonth = (monthKey, dates) => {
    const snapshot = monthSnapshots[monthKey]
    if (snapshot) {
      setSelectedDates((current) => [
        ...current.filter((date) => !dates.includes(date)),
        ...snapshot.dates
      ])
      if (snapshot.slots) setSelectedSlots(snapshot.slots)
    }
    setEditingMonths((current) => ({ ...current, [monthKey]: false }))
  }

  const loadAdminData = async () => {
    const { data } = await supabase.auth.getUser()
    const user = data?.user
    setAdminEmail(user?.email || '')
  }

  const getScheduleDates = () => {
    const dates = []
    const today = new Date()
    const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0)

    for (const date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayHours = tenantData.business_hours[date.getDay()]
      if (dayHours?.enabled) dates.push(toLocalDateStr(date))
    }

    return dates
  }

  const getScheduleMonths = () => {
    const monthMap = new Map()
    getScheduleDates().forEach((date) => {
      const monthKey = date.slice(0, 7)
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, [])
      monthMap.get(monthKey).push(date)
    })
    return Array.from(monthMap.entries())
  }

  const getSlotsForDate = (dateStr) => {
    const dayHours = tenantData.business_hours[new Date(`${dateStr}T00:00:00`).getDay()]
    const start = dayHours?.start || '10:00'
    const end = dayHours?.end || '19:00'

    const slots = []
    for (let hour = start; hour < end; ) {
      slots.push(hour)
      const [hours, minutes] = hour.split(':').map(Number)
      const nextMinutes = hours * 60 + minutes + 60
      hour = `${String(Math.floor(nextMinutes / 60)).padStart(2, '0')}:${String(nextMinutes % 60).padStart(2, '0')}`
    }
    return slots
  }

  const loadAvailability = async (dateStr, teacherId) => {
    if (!teacherId) {
      return []
    }
    const slots = getSlotsForDate(dateStr)
    const availability = await getAvailabilityForDate(dateStr, teacherId)
    return slots.filter((time) => availability[time] === true)
  }

  const saveAdminSettings = async () => {
    if (!selectedTeacherId || !teacherUnlocked) {
      alert('請先選擇老師並輸入正確密碼解鎖')
      return
    }
    if (selectedDates.length === 0) {
      alert('請先選擇老師')
      return
    }
    setAdminSaving(true)
    try {
      const availability = selectedDates.flatMap((date) => getSlotsForDate(date).map((time) => ({
        date,
        time,
        isAvailable: selectedSlots.includes(time)
      })))
      const saved = await updateAvailabilityBatch(availability, selectedTeacherId)
      if (!saved) throw new Error('上班時段儲存失敗')
      const datesSaved = await saveTeacherScheduleDates(selectedDates, selectedTeacherId)
      if (!datesSaved) throw new Error('上班日期儲存失敗')

      const refreshedSlots = await loadAvailability(selectedDates[0], selectedTeacherId)
      setSelectedSlots(refreshedSlots)

      await loadTeachers()
      setEditingMonths({})
      setMonthSnapshots({})
      alert('管理者設定已儲存！')
    } catch (error) {
      console.error('Error saving admin settings:', error)
      alert(error.message || '管理者設定儲存失敗，請稍後再試')
    } finally {
      setAdminSaving(false)
    }
  }

  const addTeacher = async () => {
    if (!newTeacher.name.trim()) {
      alert('請輸入老師名稱')
      return
    }
    if (!newTeacher.password.trim()) {
      alert('請設定老師密碼')
      return
    }

    setTeacherSaving(true)
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', 'default')
        .single()
      if (tenantError) throw tenantError

      let { data: created, error } = await supabase
        .from('teachers')
        .insert({
          tenant_id: tenant.id,
          name: newTeacher.name.trim(),
          description: newTeacher.description.trim(),
          experience: newTeacher.experience.trim(),
          password: newTeacher.password.trim(),
          level: '指定',
          extra_fee: 0
        })
        .select('id, name, level, description, experience, password, avatar_url, extra_fee')
        .single()

      if (error) {
        const basicResult = await supabase
          .from('teachers')
          .insert({
            tenant_id: tenant.id,
            name: newTeacher.name.trim(),
            password: newTeacher.password.trim(),
            level: '指定',
            extra_fee: 0
          })
          .select('id, name, level, password, extra_fee')
          .single()

        if (basicResult.error) throw new Error(`${error.message || '新增老師失敗'}\n${basicResult.error.message || ''}`)
        created = basicResult.data
      }

        if (newTeacherAvatar) {
          created = { ...created, avatar_url: await uploadTeacherAvatar(newTeacherAvatar, created.id) }
        }

      setTeachers((current) => current.some((teacher) => teacher.id === created.id) ? current : [...current, created])
      setSelectedTeacherId(created.id)
      setAutoSelectFirstDate(false)
      setTeacherPassword('')
      setTeacherUnlocked(false)
      setSelectedSlots([])
      setEditingMonths({})
      setMonthSnapshots({})
      setNewTeacher({ name: '', description: '', experience: '', password: '' })
      setNewTeacherAvatar(null)
      alert('老師已新增')

      const refreshedTeachers = await getTeachers()
      if (refreshedTeachers.length > 0) {
        setTeachers((current) => refreshedTeachers.some((teacher) => teacher.id === created.id)
          ? refreshedTeachers
          : [...refreshedTeachers, created])
      }
    } catch (error) {
      console.error('Error adding teacher:', error)
      alert(error.message || '新增老師失敗，請稍後再試')
    } finally {
      setTeacherSaving(false)
    }
  }

  const deleteTeacher = async (teacher) => {
    if (!teacher) return
    const confirmed = window.confirm(`確定要刪除老師「${teacher.name}」嗎？\n\n刪除後將無法再安排新的預約，既有預約紀錄會保留。`)
    if (!confirmed) return
    const password = window.prompt('請輸入該老師密碼以確認刪除：')
    if (password === null) return
    if (password !== String(teacher.password || '123')) {
      alert('老師密碼錯誤，無法刪除')
      return
    }

    setAdminSaving(true)
    try {
      const tenantUUID = await getTenantUUID()
      if (!tenantUUID) throw new Error('找不到目前工作室資料，無法刪除老師')

      const { data: deletedTeacher, error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', teacher.id)
        .eq('tenant_id', tenantUUID)
        .select('id')
        .maybeSingle()

      if (error) throw error
      if (!deletedTeacher) throw new Error('老師資料未被刪除，請確認 Supabase 的 teachers DELETE 權限已設定')

      const remainingTeachers = teachers.filter((item) => item.id !== teacher.id)
      setTeachers(remainingTeachers)
      setSelectedTeacherId((current) => current === teacher.id ? remainingTeachers[0]?.id || '' : current)
      setSelectedSlots([])
      alert('老師已刪除')
    } catch (error) {
      console.error('Error deleting teacher:', error)
      alert(error.message || '刪除老師失敗，請稍後再試')
    } finally {
      setAdminSaving(false)
    }
  }

  const loadTenantData = async () => {
    try {
      // For now, load the default tenant
      // In a real app, this would be determined by subdomain
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', 'default')
        .single()
      
      if (error) throw error
      
      if (data) {
        setTenantData({
          name: data.name || '',
          subdomain: data.subdomain || '',
          primary_color: data.primary_color || '#c9a86c',
          secondary_color: data.secondary_color || '#f5f0e8',
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
          line_id: data.line_id || '',
          instagram_id: data.instagram_id || '',
          logo_url: data.logo_url || '',
          business_hours: { ...defaultBusinessHours, ...(data.business_hours || {}) },
          site_content: { ...defaultSiteContent, ...(data.site_content || {}) }
        })
      }
    } catch (error) {
      console.error('Error loading tenant data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: tenantData.name,
          primary_color: tenantData.primary_color,
          secondary_color: tenantData.secondary_color,
          contact_phone: tenantData.contact_phone,
          contact_email: tenantData.contact_email,
          line_id: tenantData.line_id,
          instagram_id: tenantData.instagram_id,
          logo_url: tenantData.logo_url,
          business_hours: tenantData.business_hours,
          site_content: tenantData.site_content,
          updated_at: new Date().toISOString()
        })
        .eq('subdomain', 'default')
      
      if (error) throw error
      await refreshTenant()
      
      alert('設定已儲存！')
    } catch (error) {
      console.error('Error saving tenant data:', error)
      alert('儲存失敗，請稍後再試')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setTenantData({ ...tenantData, [field]: value })
  }

  const updateContentList = (field, nextList) => {
    setTenantData((current) => ({ ...current, site_content: { ...current.site_content, [field]: nextList } }))
  }

  const saveCourseDraft = () => {
    if (!courseDraft?.title.trim()) return alert('請輸入課程名稱')
    const courses = tenantData.site_content.courses || []
    const item = { ...courseDraft, title: courseDraft.title.trim(), price: Number(courseDraft.price) || 0, deposit: Number(courseDraft.deposit) || 0, maxStudents: Number(courseDraft.maxStudents) || 1, currentStudents: Number(courseDraft.currentStudents) || 0, dates: typeof courseDraft.dates === 'string' ? courseDraft.dates.split(',').map((value) => value.trim()).filter(Boolean) : courseDraft.dates }
    updateContentList('courses', item.id ? courses.map((course) => course.id === item.id ? item : course) : [...courses, { ...item, id: `course-${Date.now()}` }])
    setCourseDraft(null)
  }

  const saveDiaryDraft = () => {
    if (!diaryDraft?.title.trim()) return alert('請輸入日誌標題')
    const entries = tenantData.site_content.diary_entries || []
    const item = { ...diaryDraft, title: diaryDraft.title.trim(), tags: typeof diaryDraft.tags === 'string' ? diaryDraft.tags.split(',').map((value) => value.trim()).filter(Boolean) : diaryDraft.tags }
    updateContentList('diary_entries', item.id ? entries.map((entry) => entry.id === item.id ? item : entry) : [...entries, { ...item, id: `diary-${Date.now()}` }])
    setDiaryDraft(null)
  }

  const saveServiceDraft = () => {
    if (!serviceDraft?.name.trim()) return alert('請輸入服務名稱')
    const services = tenantData.site_content.services || []
    const item = { ...serviceDraft, name: serviceDraft.name.trim(), description: serviceDraft.description.trim() }
    updateContentList('services', item.id ? services.map((service) => service.id === item.id ? item : service) : [...services, { ...item, id: `service-${Date.now()}` }])
    setServiceDraft(null)
  }

  const handleBusinessHoursChange = (day, field, value) => {
    setTenantData({
      ...tenantData,
      business_hours: {
        ...tenantData.business_hours,
        [day]: { ...tenantData.business_hours[day], [field]: value }
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">設定</h1>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`px-5 py-3 font-medium border-b-2 ${activeTab === 'admin' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
          >
            管理者設定
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('studio')}
            className={`px-5 py-3 font-medium border-b-2 ${activeTab === 'studio' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
          >
            工作室設定
          </button>
        </div>

        {activeTab === 'studio' && <div className="card">
          {/* Basic Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Building2 size={24} />
              基本資訊
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">工作室名稱</label>
                <input
                  type="text"
                  value={tenantData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-field"
                  placeholder="請輸入工作室名稱"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">子網域</label>
                <input
                  type="text"
                  value={tenantData.subdomain}
                  onChange={(e) => handleInputChange('subdomain', e.target.value)}
                  className="input-field"
                  placeholder="your-studio"
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">子網域目前無法修改</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Phone size={24} />
              聯絡資訊
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">聯絡電話</label>
                <input
                  type="tel"
                  value={tenantData.contact_phone}
                  onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                  className="input-field"
                  placeholder="09xx-xxx-xxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">電子郵件</label>
                <input
                  type="email"
                  value={tenantData.contact_email}
                  onChange={(e) => handleInputChange('contact_email', e.target.value)}
                  className="input-field"
                  placeholder="contact@example.com"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mail size={24} />
              社群媒體
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">LINE 連結或 ID</label>
                <input
                  type="text"
                  value={tenantData.line_id}
                  onChange={(e) => handleInputChange('line_id', e.target.value)}
                  className="input-field"
                  placeholder="例如：your-line-id 或完整連結"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Instagram 連結或 ID</label>
                <input
                  type="text"
                  value={tenantData.instagram_id}
                  onChange={(e) => handleInputChange('instagram_id', e.target.value)}
                  className="input-field"
                  placeholder="例如：your-account 或完整連結"
                />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Palette size={24} />
              品牌設定
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">主色調</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={tenantData.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="w-16 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tenantData.primary_color}
                    onChange={(e) => handleInputChange('primary_color', e.target.value)}
                    className="input-field flex-1"
                    placeholder="#c9a86c"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">次要色調</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={tenantData.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="w-16 h-12 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tenantData.secondary_color}
                    onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                    className="input-field flex-1"
                    placeholder="#f5f0e8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Logo URL</label>
                <input
                  type="url"
                  value={tenantData.logo_url}
                  onChange={(e) => handleInputChange('logo_url', e.target.value)}
                  className="input-field"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <h3 className="font-semibold mb-4">預覽</h3>
            <div 
              className="p-4 rounded-lg text-center"
              style={{ 
                backgroundColor: tenantData.primary_color,
                color: '#fff'
              }}
            >
              <h4 className="text-2xl font-bold">{tenantData.name || '工作室名稱'}</h4>
              <p className="mt-2 opacity-90">{tenantData.contact_phone || '聯絡電話'}</p>
            </div>
          </div>

          {false && <>
          <div className="mb-8 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><h2 className="text-xl font-semibold">首頁服務卡片</h2><p className="text-sm text-gray-500 mt-1">直接新增、編輯或移除首頁服務。</p></div>
              <button type="button" onClick={() => setServiceDraft({ ...emptyService })} className="btn-secondary whitespace-nowrap">新增服務</button>
            </div>
            <div className="space-y-3">
              {(tenantData.site_content.services || []).map((service) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                  {serviceDraft?.id === service.id ? (
                    <div className="grid md:grid-cols-3 gap-3">
                      <input className="input-field" value={serviceDraft.name} onChange={(event) => setServiceDraft({ ...serviceDraft, name: event.target.value })} placeholder="服務名稱" />
                      <input className="input-field md:col-span-2" value={serviceDraft.description} onChange={(event) => setServiceDraft({ ...serviceDraft, description: event.target.value })} placeholder="服務說明" />
                      <select className="input-field" value={serviceDraft.icon} onChange={(event) => setServiceDraft({ ...serviceDraft, icon: event.target.value })}><option value="sparkles">星光</option><option value="heart">愛心</option><option value="scissors">剪刀</option><option value="calendar">日曆</option></select>
                      <div className="md:col-span-2 flex gap-2"><button type="button" onClick={saveServiceDraft} className="btn-primary">儲存服務</button><button type="button" onClick={() => setServiceDraft(null)} className="btn-secondary">取消</button></div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{service.name}</h3><p className="text-sm text-gray-500">{service.description}</p></div><div className="flex gap-2"><button type="button" onClick={() => setServiceDraft({ ...service })} className="btn-secondary px-4 py-2">編輯</button><button type="button" onClick={() => updateContentList('services', (tenantData.site_content.services || []).filter((item) => item.id !== service.id))} className="text-red-600 border border-red-200 rounded-lg px-4 py-2">移除</button></div></div>
                  )}
                </div>
              ))}
              {serviceDraft && !serviceDraft.id && <div className="border border-primary/30 rounded-lg p-4"><div className="grid md:grid-cols-3 gap-3"><input className="input-field" value={serviceDraft.name} onChange={(event) => setServiceDraft({ ...serviceDraft, name: event.target.value })} placeholder="服務名稱" /><input className="input-field md:col-span-2" value={serviceDraft.description} onChange={(event) => setServiceDraft({ ...serviceDraft, description: event.target.value })} placeholder="服務說明" /><select className="input-field" value={serviceDraft.icon} onChange={(event) => setServiceDraft({ ...serviceDraft, icon: event.target.value })}><option value="sparkles">星光</option><option value="heart">愛心</option><option value="scissors">剪刀</option><option value="calendar">日曆</option></select><div className="md:col-span-2 flex gap-2"><button type="button" onClick={saveServiceDraft} className="btn-primary">儲存服務</button><button type="button" onClick={() => setServiceDraft(null)} className="btn-secondary">取消</button></div></div></div>}
            </div>
          </div>

          <div className="mb-8 border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-2">網站文字客製化</h2>
            <p className="text-sm text-gray-500 mb-6">修改後會同步套用到首頁、導覽列與預約流程。</p>
            <div className="space-y-8">
              {siteContentGroups.map((group) => (
                <section key={group.title}>
                  <h3 className="font-semibold mb-3 text-primary">{group.title}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {group.fields.map(([field, label]) => (
                      <label key={field} className="block">
                        <span className="block text-sm font-medium mb-2">{label}</span>
                        {field.includes('description') || field === 'hero_subtitle' ? (
                          <textarea
                            value={tenantData.site_content[field] || ''}
                            onChange={(event) => setTenantData({ ...tenantData, site_content: { ...tenantData.site_content, [field]: event.target.value } })}
                            className="input-field min-h-24 resize-y"
                            rows={2}
                          />
                        ) : (
                          <input
                            type="text"
                            value={tenantData.site_content[field] || ''}
                            onChange={(event) => setTenantData({ ...tenantData, site_content: { ...tenantData.site_content, [field]: event.target.value } })}
                            className="input-field"
                          />
                        )}
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="mb-8 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-semibold">課程報名內容</h2>
                <p className="text-sm text-gray-500 mt-1">管理課程卡片，前台課程報名頁會同步更新。</p>
              </div>
              <button type="button" onClick={() => setCourseDraft({ ...emptyCourse, dates: [] })} className="btn-secondary whitespace-nowrap">新增課程</button>
            </div>
            <div className="space-y-3">
              {(tenantData.site_content.courses || []).map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                  {courseDraft?.id === course.id ? (
                    <div className="grid md:grid-cols-2 gap-3">
                      <input className="input-field" value={courseDraft.title} onChange={(event) => setCourseDraft({ ...courseDraft, title: event.target.value })} placeholder="課程名稱" />
                      <input className="input-field" value={courseDraft.level} onChange={(event) => setCourseDraft({ ...courseDraft, level: event.target.value })} placeholder="程度" />
                      <textarea className="input-field md:col-span-2" value={courseDraft.description} onChange={(event) => setCourseDraft({ ...courseDraft, description: event.target.value })} placeholder="課程說明" />
                      <input className="input-field" value={courseDraft.duration} onChange={(event) => setCourseDraft({ ...courseDraft, duration: event.target.value })} placeholder="課程時長" />
                      <input className="input-field" value={Array.isArray(courseDraft.dates) ? courseDraft.dates.join(', ') : courseDraft.dates} onChange={(event) => setCourseDraft({ ...courseDraft, dates: event.target.value })} placeholder="開課日期，用逗號分隔" />
                      <input type="number" className="input-field" value={courseDraft.price} onChange={(event) => setCourseDraft({ ...courseDraft, price: event.target.value })} placeholder="課程費用" />
                      <input type="number" className="input-field" value={courseDraft.deposit} onChange={(event) => setCourseDraft({ ...courseDraft, deposit: event.target.value })} placeholder="訂金" />
                      <div className="md:col-span-2 flex gap-2"><button type="button" onClick={saveCourseDraft} className="btn-primary">儲存課程</button><button type="button" onClick={() => setCourseDraft(null)} className="btn-secondary">取消</button></div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{course.title}</h3><p className="text-sm text-gray-500">{course.level} · {course.duration} · NT$ {Number(course.price).toLocaleString()}</p></div><div className="flex gap-2"><button type="button" onClick={() => setCourseDraft({ ...course, dates: course.dates || [] })} className="btn-secondary px-4 py-2">編輯</button><button type="button" onClick={() => updateContentList('courses', (tenantData.site_content.courses || []).filter((item) => item.id !== course.id))} className="text-red-600 border border-red-200 rounded-lg px-4 py-2">刪除</button></div></div>
                  )}
                </div>
              ))}
              {courseDraft && !courseDraft.id && (
                <div className="border border-primary/30 rounded-lg p-4"><div className="grid md:grid-cols-2 gap-3">
                  <input className="input-field" value={courseDraft.title} onChange={(event) => setCourseDraft({ ...courseDraft, title: event.target.value })} placeholder="課程名稱" />
                  <input className="input-field" value={courseDraft.level} onChange={(event) => setCourseDraft({ ...courseDraft, level: event.target.value })} placeholder="程度" />
                  <textarea className="input-field md:col-span-2" value={courseDraft.description} onChange={(event) => setCourseDraft({ ...courseDraft, description: event.target.value })} placeholder="課程說明" />
                  <input className="input-field" value={courseDraft.duration} onChange={(event) => setCourseDraft({ ...courseDraft, duration: event.target.value })} placeholder="課程時長" />
                  <input className="input-field" value={Array.isArray(courseDraft.dates) ? courseDraft.dates.join(', ') : courseDraft.dates} onChange={(event) => setCourseDraft({ ...courseDraft, dates: event.target.value })} placeholder="開課日期，用逗號分隔" />
                  <input type="number" className="input-field" value={courseDraft.price} onChange={(event) => setCourseDraft({ ...courseDraft, price: event.target.value })} placeholder="課程費用" />
                  <input type="number" className="input-field" value={courseDraft.deposit} onChange={(event) => setCourseDraft({ ...courseDraft, deposit: event.target.value })} placeholder="訂金" />
                  <div className="md:col-span-2 flex gap-2"><button type="button" onClick={saveCourseDraft} className="btn-primary">儲存課程</button><button type="button" onClick={() => setCourseDraft(null)} className="btn-secondary">取消</button></div>
                </div></div>
              )}
            </div>
          </div>

          <div className="mb-8 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><h2 className="text-xl font-semibold">變美日誌內容</h2><p className="text-sm text-gray-500 mt-1">新增作品案例，前台變美日誌會同步更新。</p></div>
              <button type="button" onClick={() => setDiaryDraft({ ...emptyDiaryEntry, tags: [] })} className="btn-secondary whitespace-nowrap">新增日誌</button>
            </div>
            <div className="space-y-3">
              {(tenantData.site_content.diary_entries || []).map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                  {diaryDraft?.id === entry.id ? (
                    <div className="grid md:grid-cols-2 gap-3">
                      <input className="input-field" value={diaryDraft.title} onChange={(event) => setDiaryDraft({ ...diaryDraft, title: event.target.value })} placeholder="標題" />
                      <input className="input-field" value={diaryDraft.category} onChange={(event) => setDiaryDraft({ ...diaryDraft, category: event.target.value })} placeholder="分類" />
                      <input className="input-field" value={diaryDraft.date} onChange={(event) => setDiaryDraft({ ...diaryDraft, date: event.target.value })} placeholder="日期" />
                      <input className="input-field" value={diaryDraft.image} onChange={(event) => setDiaryDraft({ ...diaryDraft, image: event.target.value })} placeholder="圖片網址" />
                      <textarea className="input-field md:col-span-2" value={diaryDraft.description} onChange={(event) => setDiaryDraft({ ...diaryDraft, description: event.target.value })} placeholder="內容說明" />
                      <input className="input-field md:col-span-2" value={Array.isArray(diaryDraft.tags) ? diaryDraft.tags.join(', ') : diaryDraft.tags} onChange={(event) => setDiaryDraft({ ...diaryDraft, tags: event.target.value })} placeholder="標籤，用逗號分隔" />
                      <div className="md:col-span-2 flex gap-2"><button type="button" onClick={saveDiaryDraft} className="btn-primary">儲存日誌</button><button type="button" onClick={() => setDiaryDraft(null)} className="btn-secondary">取消</button></div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3">{entry.image && <img src={entry.image} alt="" className="w-16 h-16 rounded-lg object-cover" />}<div><h3 className="font-semibold">{entry.title}</h3><p className="text-sm text-gray-500">{entry.category} · {entry.date}</p></div></div><div className="flex gap-2"><button type="button" onClick={() => setDiaryDraft({ ...entry, tags: entry.tags || [] })} className="btn-secondary px-4 py-2">編輯</button><button type="button" onClick={() => updateContentList('diary_entries', (tenantData.site_content.diary_entries || []).filter((item) => item.id !== entry.id))} className="text-red-600 border border-red-200 rounded-lg px-4 py-2">刪除</button></div></div>
                  )}
                </div>
              ))}
              {diaryDraft && !diaryDraft.id && (
                <div className="border border-primary/30 rounded-lg p-4"><div className="grid md:grid-cols-2 gap-3">
                  <input className="input-field" value={diaryDraft.title} onChange={(event) => setDiaryDraft({ ...diaryDraft, title: event.target.value })} placeholder="標題" />
                  <input className="input-field" value={diaryDraft.category} onChange={(event) => setDiaryDraft({ ...diaryDraft, category: event.target.value })} placeholder="分類" />
                  <input className="input-field" value={diaryDraft.date} onChange={(event) => setDiaryDraft({ ...diaryDraft, date: event.target.value })} placeholder="日期" />
                  <input className="input-field" value={diaryDraft.image} onChange={(event) => setDiaryDraft({ ...diaryDraft, image: event.target.value })} placeholder="圖片網址" />
                  <textarea className="input-field md:col-span-2" value={diaryDraft.description} onChange={(event) => setDiaryDraft({ ...diaryDraft, description: event.target.value })} placeholder="內容說明" />
                  <input className="input-field md:col-span-2" value={Array.isArray(diaryDraft.tags) ? diaryDraft.tags.join(', ') : diaryDraft.tags} onChange={(event) => setDiaryDraft({ ...diaryDraft, tags: event.target.value })} placeholder="標籤，用逗號分隔" />
                  <div className="md:col-span-2 flex gap-2"><button type="button" onClick={saveDiaryDraft} className="btn-primary">儲存日誌</button><button type="button" onClick={() => setDiaryDraft(null)} className="btn-secondary">取消</button></div>
                </div></div>
              )}
            </div>
          </div>

          </>}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? '儲存中...' : '儲存設定'}
          </button>
        </div>}

        {activeTab === 'admin' && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <CalendarDays size={24} />
              管理者設定
            </h2>

            <p className="text-sm text-gray-500 mb-6">登入帳號：{adminEmail || '載入中...'}</p>

            <div className="mb-8">
              <h3 className="font-semibold mb-3">選擇老師</h3>
              <div className="space-y-4 mb-4">
                {selectedTeacherId && (
                  <div className="flex flex-wrap items-end justify-start gap-4">
                    {teachers.find((teacher) => teacher.id === selectedTeacherId)?.avatar_url ? (
                      <img src={teachers.find((teacher) => teacher.id === selectedTeacherId).avatar_url} alt="老師大頭貼" className="w-[150px] h-[150px] rounded-full object-cover" />
                    ) : <div className="w-[150px] h-[150px] rounded-full border border-gray-200 flex items-center justify-center"><User className="text-primary" size={52} /></div>}
                    <label className="btn-secondary text-sm whitespace-nowrap cursor-pointer flex items-center gap-2">
                      <Upload size={16} />
                      上傳大頭貼
                      <input type="file" accept="image/*" className="hidden" disabled={teacherSaving} onChange={(event) => handleTeacherAvatarUpload(event.target.files?.[0])} />
                    </label>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-3 items-center">
                  <select
                    value={selectedTeacherId}
                    onChange={(event) => handleTeacherChange(event.target.value)}
                    className="input-field min-w-0 w-full"
                    disabled={teachers.length === 0 || adminSaving}
                  >
                    <option value="">{teachers.length === 0 ? '目前沒有老師，請先新增' : '請選擇現有老師'}</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>
                  {selectedTeacherId && <>
                    <input
                      type="password"
                      value={teacherPassword}
                      onChange={(event) => setTeacherPassword(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && unlockTeacher()}
                      className="input-field min-w-0 w-full"
                      placeholder="輸入老師密碼"
                      disabled={adminSaving || teacherUnlocked}
                    />
                    <button
                      type="button"
                      onClick={unlockTeacher}
                      disabled={adminSaving || teacherUnlocked}
                      className="btn-secondary whitespace-nowrap"
                    >
                      {teacherUnlocked ? '已解鎖' : '解鎖'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTeacher(teachers.find((teacher) => teacher.id === selectedTeacherId))}
                      disabled={adminSaving || teacherSaving}
                      className="p-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      title="刪除目前老師"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-3">新增老師</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newTeacher.name}
                    onChange={(event) => setNewTeacher({ ...newTeacher, name: event.target.value })}
                    className="input-field"
                    placeholder="名稱"
                  />
                  <input
                    type="text"
                    value={newTeacher.description}
                    onChange={(event) => setNewTeacher({ ...newTeacher, description: event.target.value })}
                    className="input-field"
                    placeholder="描述"
                  />
                  <input
                    type="text"
                    value={newTeacher.experience}
                    onChange={(event) => setNewTeacher({ ...newTeacher, experience: event.target.value })}
                    className="input-field"
                    placeholder="資歷"
                  />
                  <input
                    type="password"
                    value={newTeacher.password}
                    onChange={(event) => setNewTeacher({ ...newTeacher, password: event.target.value })}
                    className="input-field"
                    placeholder="設定密碼"
                  />
                  <label className="input-field cursor-pointer flex items-center gap-2">
                    <Upload size={18} />
                    {newTeacherAvatar ? newTeacherAvatar.name : '選擇大頭貼（選填）'}
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => setNewTeacherAvatar(event.target.files?.[0] || null)} />
                  </label>
                </div>
                <button type="button" onClick={addTeacher} disabled={teacherSaving} className="btn-secondary mt-3">
                  {teacherSaving ? '新增中...' : '新增老師'}
                </button>
              </div>

              {!teacherUnlocked && selectedTeacherId && <p className="text-sm text-amber-700 mb-2">請先輸入老師密碼並解鎖，才能顯示下方時段設定。</p>}

              {teacherUnlocked && <>
                <h3 className="font-semibold mb-2">選擇兩個月內可上班時段</h3>
                <p className="text-sm text-gray-600 mb-4">日期範圍：今天起至下下個月月底。可逐日選擇，也可以整月勾選。</p>

                <div className="space-y-5 mb-6 max-h-[32rem] overflow-y-auto p-1">
                {getScheduleMonths().map(([monthKey, dates]) => {
                  const monthSelected = dates.every((date) => selectedDates.includes(date))
                  const isEditing = editingMonths[monthKey] === true
                  return (
                    <div key={monthKey} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <h4 className="font-semibold">
                          {new Date(`${monthKey}-01T00:00:00`).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long' })}
                        </h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => isEditing ? handleCancelMonth(monthKey, dates) : handleEditMonth(monthKey, dates)}
                            className={`text-sm px-3 py-1 rounded border ${isEditing ? 'border-gray-400 text-gray-600' : 'border-primary text-primary'}`}
                          >
                            {isEditing ? '取消' : '編輯'}
                          </button>
                          <button
                            type="button"
                            disabled={!isEditing || !teacherUnlocked}
                            onClick={() => setSelectedDates((current) => Array.from(new Set([...current, ...dates])))}
                            className="text-sm px-3 py-1 rounded border border-gray-300 disabled:opacity-40"
                          >
                            本月全選
                          </button>
                          <button
                            type="button"
                            disabled={!isEditing || !teacherUnlocked}
                            onClick={() => setSelectedDates((current) => current.filter((date) => !dates.includes(date)))}
                            className="text-sm px-3 py-1 rounded border border-gray-300 disabled:opacity-40"
                          >
                            本月全取消
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {dates.map((date) => (
                          <label
                            key={date}
                            className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${selectedDates.includes(date) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200'}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedDates.includes(date)}
                              disabled={!isEditing || !teacherUnlocked}
                              onChange={() => setSelectedDates((current) => current.includes(date) ? current.filter((item) => item !== date) : [...current, date])}
                              className="w-4 h-4 accent-primary"
                            />
                            {new Date(`${date}T00:00:00`).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' })}
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
                </div>

                {selectedDates.length > 0 && (
                  <div className="border-t border-gray-200 pt-5">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock size={18} />
                    已選取 {selectedDates.length} 天，設定相同上班時段
                  </h4>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setSelectedSlots(getSlotsForDate(selectedDates[0]))}
                      disabled={!teacherUnlocked || editingMonths[selectedDates[0].slice(0, 7)] !== true}
                      className="btn-secondary px-4 py-2"
                    >
                      全部勾選
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSlots([])}
                      disabled={!teacherUnlocked || editingMonths[selectedDates[0].slice(0, 7)] !== true}
                      className="btn-secondary px-4 py-2"
                    >
                      全部取消
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {getSlotsForDate(selectedDates[0]).map((time) => {
                      const checked = selectedSlots.includes(time)
                      return (
                        <label key={time} className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${editingMonths[selectedDates[0].slice(0, 7)] === true ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${checked ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!teacherUnlocked || editingMonths[selectedDates[0].slice(0, 7)] !== true}
                            onChange={() => setSelectedSlots((current) => checked ? current.filter((slot) => slot !== time) : [...current, time])}
                            className="w-4 h-4 accent-primary"
                          />
                          {time}
                        </label>
                      )
                    })}
                  </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={saveAdminSettings}
                  disabled={adminSaving || selectedDates.length === 0}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {adminSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {adminSaving ? '儲存中，請稍候...' : '儲存管理者設定'}
                </button>
              </>}
            </div>
          </div>
        )}

        {/* Info */}
        {activeTab === 'studio' && <div className="mt-8 card bg-blue-50 border-blue-200">
          <h3 className="font-semibold mb-2">多租戶說明</h3>
          <p className="text-sm text-gray-700">
            目前系統已支援多租戶架構。每個租戶都有自己的：
          </p>
          <ul className="text-sm text-gray-700 mt-2 space-y-1 list-disc list-inside">
            <li>獨立的服務項目和價格設定</li>
            <li>獨立的老師資訊和職級</li>
            <li>獨立的預約資料和時段管理</li>
            <li>自訂品牌顏色和 Logo</li>
            <li>專屬的聯絡資訊</li>
          </ul>
          <p className="text-sm text-gray-700 mt-2">
            未來可透過子網域（如 studio1.yoursystem.com）區分不同租戶。
          </p>
        </div>}
      </div>
    </div>
  )
}
