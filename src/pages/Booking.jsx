import { useState, useEffect } from 'react'
import { ChevronRight, Check, Clock, User } from 'lucide-react'
import { saveBooking, getBusinessHours, getTeachers, getTimeSlotsForDates, toLocalDateStr } from '../utils/storage'
import { useTenant } from '../context/TenantContext'

const timeSlots = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
]

export default function Booking({ isAdmin = false }) {
  const { tenant, saveSiteContent } = useTenant()
  const content = tenant.site_content
  const services = content.booking_services || []
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [availabilityData, setAvailabilityData] = useState([])
  const [availabilityByDate, setAvailabilityByDate] = useState({})
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [businessHours, setBusinessHours] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [editingCopy, setEditingCopy] = useState(false)
  const [copyDraft, setCopyDraft] = useState({})
  const [savingCopy, setSavingCopy] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [bookingData, setBookingData] = useState({
    mode: 'A', // A: 先選老師, B: 先選時間
    service: null,
    teacher: null,
    date: null,
    time: null,
    userInfo: {
      name: '',
      phone: '',
      email: '',
      note: ''
    },
    healthDeclaration: {
      pregnancy: false,
      skinSensitivity: false,
      recentSurgery: false,
      medications: false
    }
  })

  useEffect(() => {
    getBusinessHours().then(setBusinessHours)
    getTeachers().then(setTeachers)
  }, [])

  useEffect(() => {
    if (step !== 4 || !bookingData.teacher?.id) return

    let active = true
    const dates = getAvailableDates()
    setAvailabilityLoading(true)
    setAvailabilityByDate({})

    getTimeSlotsForDates(dates.map(toLocalDateStr), timeSlots, bookingData.teacher.id).then((availability) => {
      if (active) setAvailabilityByDate(availability)
    }).finally(() => {
      if (active) setAvailabilityLoading(false)
    })

    return () => {
      active = false
    }
  }, [step, businessHours, bookingData.teacher?.id])

  const handleServiceSelect = (service) => {
    setBookingData({ ...bookingData, service })
    setStep(3)
  }

  const saveBookingCopy = async () => {
    setSavingCopy(true)
    try { await saveSiteContent(copyDraft); setEditingCopy(false) } catch (error) { alert(error.message || '預約文字儲存失敗') } finally { setSavingCopy(false) }
  }

  const saveService = async () => {
    if (!editingService?.name.trim()) return alert('請輸入服務標題')
    const item = { ...editingService, name: editingService.name.trim(), price: Number(editingService.price) || 0, duration: Number(editingService.duration) || 0 }
    const nextServices = item.id ? services.map((service) => service.id === item.id ? item : service) : [...services, { ...item, id: `booking-service-${Date.now()}` }]
    setSavingCopy(true)
    try { await saveSiteContent({ booking_services: nextServices }); setEditingService(null) } catch (error) { alert(error.message || '服務儲存失敗') } finally { setSavingCopy(false) }
  }

  const removeService = async (id) => {
    if (!window.confirm('確定要移除這項服務嗎？')) return
    setSavingCopy(true)
    try { await saveSiteContent({ booking_services: services.filter((service) => service.id !== id) }) } catch (error) { alert(error.message || '服務移除失敗') } finally { setSavingCopy(false) }
  }

  const handleTeacherSelect = (teacher) => {
    setBookingData({ ...bookingData, teacher, date: null, time: null })
    setAvailabilityByDate({})
    setStep(4)
  }

  const handleDateSelect = async (date) => {
    setBookingData({ ...bookingData, date, time: null })
    setAvailabilityData([])
    setStep(5)
    setLoading(true)
    const availability = await getTimeSlotsForDate(toLocalDateStr(date), timeSlots, bookingData.teacher?.id)
    setAvailabilityData(availability)
    setLoading(false)
  }

  const handleTimeSelect = (date, time) => {
    setBookingData({ ...bookingData, date, time })
    setStep(6)
  }

  const handleUserInfoChange = (field, value) => {
    setBookingData({
      ...bookingData,
      userInfo: { ...bookingData.userInfo, [field]: value }
    })
  }

  const handleHealthDeclarationChange = (field, value) => {
    setBookingData({
      ...bookingData,
      healthDeclaration: { ...bookingData.healthDeclaration, [field]: value }
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    // Prepare booking data for Supabase
    const bookingToSave = {
      service: bookingData.service,
      teacher: bookingData.teacher,
      date: toLocalDateStr(bookingData.date),
      time: bookingData.time,
      userInfo: bookingData.userInfo,
      healthDeclaration: bookingData.healthDeclaration
    }
    
    const savedBooking = await saveBooking(bookingToSave)
    
    setLoading(false)
    
    if (savedBooking) {
      alert('預約成功！我們會盡快與您確認。')
      setStep(1)
      setBookingData({
        mode: 'A',
        service: null,
        teacher: null,
        date: null,
        time: null,
        userInfo: { name: '', phone: '', email: '', note: '' },
        healthDeclaration: {
          pregnancy: false,
          skinSensitivity: false,
          recentSurgery: false,
          medications: false
        }
      })
      setAvailabilityData([])
      setAvailabilityByDate({})
    } else {
      alert('預約失敗，請稍後再試。')
    }
  }

  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    
    // Start from today (not tomorrow)
    let currentDate = new Date(today)
    
    // Go to the end of the 3rd month (current + next 2 complete months)
    const threeMonthsLater = new Date(today)
    threeMonthsLater.setMonth(today.getMonth() + 3)
    threeMonthsLater.setDate(0) // Last day of the 3rd month
    
    while (currentDate <= threeMonthsLater) {
      const dayHours = businessHours?.[currentDate.getDay()]
      const isBusinessDay = dayHours ? dayHours.enabled : currentDate.getDay() !== 0
      if (isBusinessDay) {
        dates.push(new Date(currentDate))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })
  }

  const totalPrice = bookingData.service?.price + Number(bookingData.teacher?.extra_fee || bookingData.teacher?.extraFee || 0)

  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {isAdmin && <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-3"><div><p className="font-semibold text-primary">管理者編輯模式</p><p className="text-sm text-gray-600">服務只可修改標題、價格與時間。</p></div><button type="button" onClick={() => setEditingService({ id: null, name: '', price: 0, duration: 0 })} className="btn-primary">新增服務</button></div>}
        {isAdmin && editingService && <div className="card mb-6"><div className="grid md:grid-cols-3 gap-3"><input className="input-field" value={editingService.name} onChange={(event) => setEditingService({ ...editingService, name: event.target.value })} placeholder="服務標題" /><input type="number" className="input-field" value={editingService.price} onChange={(event) => setEditingService({ ...editingService, price: event.target.value })} placeholder="價格" /><input type="number" className="input-field" value={editingService.duration} onChange={(event) => setEditingService({ ...editingService, duration: event.target.value })} placeholder="時間（分鐘）" /></div><div className="flex gap-3 mt-4"><button type="button" onClick={saveService} className="btn-primary" disabled={savingCopy}>儲存服務</button><button type="button" onClick={() => setEditingService(null)} className="btn-secondary">取消</button></div></div>}
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= s ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step > s ? <Check size={20} /> : s}
              </div>
              {s < 6 && (
                <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-center">{content.booking_service_title}</h2>
            <p className="text-gray-600 mb-6 text-center">{content.booking_service_description}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                  <p className="text-gray-600">NT$ {service.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{service.duration} 分鐘</p>
                  {isAdmin && <div className="flex gap-2 mt-4" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setEditingService({ ...service })} className="btn-secondary px-3 py-2 text-sm">編輯</button><button type="button" onClick={() => removeService(service.id)} className="text-red-600 border border-red-200 rounded-lg px-3 py-2 text-sm">移除</button></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Teacher */}
        {step === 3 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-center">{content.booking_teacher_title}</h2>
            <p className="text-gray-600 mb-6 text-center">{content.booking_teacher_description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <button
                type="button"
                onClick={() => handleTeacherSelect({ id: null, name: '未指定老師', level: '不指定', extra_fee: 0 })}
                className={`relative min-h-[25rem] p-6 border-2 rounded-2xl transition-all text-center flex flex-col items-center ${
                  bookingData.teacher?.id === null ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                }`}
              >
                {bookingData.teacher?.id === null && <Check className="absolute top-4 right-4 text-primary" size={22} />}
                <div className="w-28 h-28 rounded-full border border-gray-200 flex items-center justify-center mb-5">
                  <User className="text-primary" size={52} />
                </div>
                <h3 className="text-xl font-semibold mb-2">未指定老師</h3>
                <p className="text-gray-600 flex-1">由工作室安排合適老師</p>
                <p className="w-full mt-5 py-3 rounded-xl bg-primary/10 text-primary font-semibold">不加價</p>
              </button>
              {teachers.map((teacher) => (
                <button
                  type="button"
                  key={teacher.id}
                  onClick={() => handleTeacherSelect(teacher)}
                  className={`relative min-h-[25rem] p-6 border-2 rounded-2xl transition-all text-center flex flex-col items-center ${
                    bookingData.teacher?.id === teacher.id
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  {bookingData.teacher?.id === teacher.id && <Check className="absolute top-4 right-4 text-primary" size={22} />}
                  <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-200 mb-5 flex items-center justify-center">
                    {teacher.avatar_url ? (
                      <img src={teacher.avatar_url} alt={teacher.name} className="w-full h-full object-cover" />
                    ) : <User className="text-primary" size={52} />}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{teacher.name}</h3>
                  <p className="inline-flex px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium mb-3">{teacher.level || teacher.experience || '專業老師'}</p>
                  <p className="text-sm text-gray-500 flex-1">{teacher.description || '專業老師，為您提供貼心服務'}</p>
                  <p className="w-full mt-5 py-3 rounded-xl bg-primary/10 text-primary font-semibold">職級加價：+NT$ {Number(teacher.extra_fee || teacher.extraFee || 0).toLocaleString()}</p>
                </button>
              ))}
            </div>
            {bookingData.teacher && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ 已選擇：{bookingData.teacher.name} ({bookingData.teacher.level})
                </p>
              </div>
            )}
            <button
              onClick={() => setStep(1)}
              className="mt-6 text-gray-600 hover:text-primary flex items-center gap-2"
            >
              <ChevronRight size={16} className="rotate-180" />
              返回選擇預約方式
            </button>
          </div>
        )}

        {/* Step 4: Select Date */}
        {step === 4 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-2 text-center">{content.booking_date_title}</h2>
            <p className="text-gray-600 mb-6 text-center">{content.booking_date_description}</p>
            <button
              onClick={() => setStep(3)}
              className="mb-4 text-gray-600 hover:text-primary flex items-center gap-2"
            >
              <ChevronRight size={16} className="rotate-180" />
              返回上一步
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAvailableDates().map((date) => {
                const dateStr = toLocalDateStr(date)
                const isSelected = bookingData.date?.toDateString() === date.toDateString()
                return (
                  <div
                    key={dateStr}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {isSelected && <Check size={16} className="text-primary" />}
                      <p className="font-semibold">{formatDate(date)}</p>
                    </div>
                    {availabilityLoading && !availabilityByDate[dateStr] ? (
                      <p className="text-sm text-gray-500 py-2">載入時段中...</p>
                    ) : availabilityByDate[dateStr]?.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availabilityByDate[dateStr].map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => slot.available && handleTimeSelect(date, slot.time)}
                            disabled={!slot.available}
                            className={`p-2 border rounded text-sm transition-colors ${
                              !slot.available
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : bookingData.date?.toDateString() === date.toDateString() && bookingData.time === slot.time
                                ? 'border-primary bg-primary text-white'
                                : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            <span className="block font-semibold">{slot.time}</span>
                            <span className="block text-xs mt-1">{slot.available ? '可預約' : '不可預約'}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 py-2">當日無可預約時段</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 5: Select Time */}
        {step === 5 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-center">選擇時段</h2>
            <p className="text-gray-600 mb-6 text-center">
              {bookingData.date && formatDate(bookingData.date)} · {bookingData.service?.name}
            </p>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">載入時段資料中...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {availabilityData.length > 0 ? availabilityData.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && handleTimeSelect(bookingData.date, slot.time)}
                    disabled={!slot.available}
                    className={`p-4 border-2 rounded-lg transition-all text-center ${
                      !slot.available
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                        : bookingData.time === slot.time
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-green-300 bg-green-50 text-green-800 hover:border-green-500 hover:bg-green-100 cursor-pointer'
                    }`}
                  >
                    <Clock className={`mx-auto mb-2 ${slot.available ? 'text-primary' : 'text-gray-400'}`} size={20} />
                    <p className="font-semibold">{slot.time}</p>
                    {!slot.available && (
                      <p className="text-xs text-red-500 mt-1">已預約</p>
                    )}
                    {slot.available && bookingData.time === slot.time && (
                      <div className="flex justify-center mt-1">
                        <Check size={16} className="text-primary" />
                      </div>
                    )}
                  </button>
                )) : (
                  <div className="col-span-full text-center py-4">
                    <p className="text-gray-600">目前沒有可預約時段，請返回選擇其他日期。</p>
                  </div>
                )}
              </div>
            )}
            {bookingData.time && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ 已選擇時段：{bookingData.time}
                </p>
              </div>
            )}
            <button
              onClick={() => setStep(4)}
              className="mt-6 text-gray-600 hover:text-primary flex items-center gap-2"
            >
              <ChevronRight size={16} className="rotate-180" />
              返回選擇日期
            </button>
          </div>
        )}

        {/* Step 6: User Information & Health Declaration */}
        {step === 6 && (
          <div className="space-y-6">
            {/* User Information */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-6 text-center">填寫預約資料</h2>
              <p className="text-gray-600 mb-6 text-center">請確認您的聯絡資訊</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">姓名 *</label>
                  <input
                    type="text"
                    value={bookingData.userInfo.name}
                    onChange={(e) => handleUserInfoChange('name', e.target.value)}
                    className="input-field"
                    placeholder="請輸入您的姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">手機號碼 *</label>
                  <input
                    type="tel"
                    value={bookingData.userInfo.phone}
                    onChange={(e) => handleUserInfoChange('phone', e.target.value)}
                    className="input-field"
                    placeholder="09xx-xxx-xxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">電子郵件</label>
                  <input
                    type="email"
                    value={bookingData.userInfo.email}
                    onChange={(e) => handleUserInfoChange('email', e.target.value)}
                    className="input-field"
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">備註</label>
                  <textarea
                    value={bookingData.userInfo.note}
                    onChange={(e) => handleUserInfoChange('note', e.target.value)}
                    className="input-field"
                    rows="3"
                    placeholder="如有特殊需求請在此說明"
                  />
                </div>
              </div>
            </div>

            {/* Health Declaration */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-6 text-center">術前安全聲明</h2>
              <p className="text-gray-600 mb-6 text-center">
                {bookingData.service?.name} 屬於設計性服務，請確認以下健康狀況
              </p>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingData.healthDeclaration.pregnancy}
                    onChange={(e) => handleHealthDeclarationChange('pregnancy', e.target.checked)}
                    className="mt-1 w-5 h-5 text-primary"
                  />
                  <span className="text-gray-700">目前是否懷孕或哺乳中？</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingData.healthDeclaration.skinSensitivity}
                    onChange={(e) => handleHealthDeclarationChange('skinSensitivity', e.target.checked)}
                    className="mt-1 w-5 h-5 text-primary"
                  />
                  <span className="text-gray-700">是否有嚴重皮膚過敏或敏感體質？</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingData.healthDeclaration.recentSurgery}
                    onChange={(e) => handleHealthDeclarationChange('recentSurgery', e.target.checked)}
                    className="mt-1 w-5 h-5 text-primary"
                  />
                  <span className="text-gray-700">近三個月內是否接受過手術或雷射治療？</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingData.healthDeclaration.medications}
                    onChange={(e) => handleHealthDeclarationChange('medications', e.target.checked)}
                    className="mt-1 w-5 h-5 text-primary"
                  />
                  <span className="text-gray-700">目前是否正在服用任何藥物？</span>
                </label>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-6 text-center">確認預約</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">服務項目</span>
                  <span className="font-semibold">{bookingData.service?.name}</span>
                </div>
                {bookingData.teacher && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">指定老師</span>
                    <span className="font-semibold">{bookingData.teacher.name} ({bookingData.teacher.level})</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">預約日期</span>
                  <span className="font-semibold">{bookingData.date && formatDate(bookingData.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">預約時間</span>
                  <span className="font-semibold">{bookingData.time}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">總金額</span>
                    <span className="font-bold text-primary">NT$ {totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSubmit}
                className="w-full btn-primary mt-6 font-semibold"
              >
                確認預約
              </button>
              <button
                onClick={() => setStep(4)}
                className="w-full mt-3 text-gray-600 hover:text-primary flex items-center justify-center gap-2"
              >
                <ChevronRight size={16} className="rotate-180" />
                返回修改
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
