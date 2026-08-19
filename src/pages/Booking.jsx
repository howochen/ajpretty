import { useState, useEffect } from 'react'
import { ChevronRight, Check, Calendar, Clock, User } from 'lucide-react'
import { saveBooking, getBusinessHours, getTimeSlotsForDate, toLocalDateStr } from '../utils/storage'

const services = [
  { id: 1, name: '美睫服務', category: 'eyelash', price: 1200, duration: 90 },
  { id: 2, name: '皮膚管理', category: 'skincare', price: 2500, duration: 60 },
  { id: 3, name: '眉型設計', category: 'eyebrow', price: 1800, duration: 45 },
  { id: 4, name: '隱形眼線', category: 'eyeliner', price: 3000, duration: 120 },
  { id: 5, name: '頭皮保養', category: 'scalp', price: 2000, duration: 60 },
]

const teachers = [
  { id: 1, name: '鄭湘蓉', level: '資深', extraFee: 500 },
  { id: 2, name: '老師 B', level: '主任', extraFee: 800 },
  { id: 3, name: '老師 C', level: '店長', extraFee: 1200 },
]

const timeSlots = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
]

export default function Booking() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [availabilityData, setAvailabilityData] = useState([])
  const [businessHours, setBusinessHours] = useState(null)
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
  }, [])

  const handleServiceSelect = (service) => {
    setBookingData({ ...bookingData, service })
    setStep(2)
  }

  const handleTeacherSelect = (teacher) => {
    setBookingData({ ...bookingData, teacher })
    setStep(4)
  }

  const handleDateSelect = async (date) => {
    setBookingData({ ...bookingData, date, time: null })
    setAvailabilityData([])
    setStep(5)
    setLoading(true)
    const availability = await getTimeSlotsForDate(toLocalDateStr(date), timeSlots)
    setAvailabilityData(availability)
    setLoading(false)
  }

  const handleTimeSelect = (time) => {
    setBookingData({ ...bookingData, time })
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

  const totalPrice = bookingData.service?.price + (bookingData.teacher?.extraFee || 0)

  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="max-w-4xl mx-auto">
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
            <h2 className="text-2xl font-bold mb-6 text-center">選擇服務</h2>
            <p className="text-gray-600 mb-6 text-center">請先選擇服務類別</p>
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
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Booking Mode */}
        {step === 2 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-center">選擇預約方式</h2>
            <p className="text-gray-600 mb-6 text-center">您想先選老師，還是先選時間？</p>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setBookingData({ ...bookingData, mode: 'A' })
                  setStep(3)
                }}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <User className="mx-auto mb-4 text-primary" size={32} />
                <h3 className="text-xl font-semibold mb-2">先選老師</h3>
                <p className="text-gray-600">選擇指定老師（費用依老師職級加價）</p>
              </button>
              <button
                onClick={() => {
                  setBookingData({ ...bookingData, mode: 'B' })
                  setStep(4)
                }}
                className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Calendar className="mx-auto mb-4 text-primary" size={32} />
                <h3 className="text-xl font-semibold mb-2">先選時間</h3>
                <p className="text-gray-600">優先選擇方便的日期與時段</p>
              </button>
            </div>
            <button
              onClick={() => setStep(1)}
              className="mt-6 text-gray-600 hover:text-primary flex items-center gap-2"
            >
              <ChevronRight size={16} className="rotate-180" />
              返回選擇服務
            </button>
          </div>
        )}

        {/* Step 3: Select Teacher */}
        {step === 3 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-6 text-center">選擇老師</h2>
            <p className="text-gray-600 mb-6 text-center">選擇指定老師（費用依老師職級加價）</p>
            <div className="space-y-4">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => handleTeacherSelect(teacher)}
                  className={`w-full p-6 border-2 rounded-lg transition-all text-left flex justify-between items-center ${
                    bookingData.teacher?.id === teacher.id
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {bookingData.teacher?.id === teacher.id && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">{teacher.name}</h3>
                      <p className="text-gray-600">{teacher.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-semibold">+NT$ {teacher.extraFee.toLocaleString()}</p>
                  </div>
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
              onClick={() => setStep(2)}
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
            <h2 className="text-2xl font-bold mb-6 text-center">
              {bookingData.mode === 'A' ? '選擇日期與時段' : '選擇日期'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAvailableDates().map((date, index) => {
                const isSelected = bookingData.date?.toDateString() === date.toDateString()
                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-primary hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {isSelected && (
                          <div className="flex items-center gap-1 mb-1">
                            <Check size={16} className="text-primary" />
                          </div>
                        )}
                        <p className="font-semibold">{formatDate(date)}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        選擇查看時段
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            {bookingData.date && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ 已選擇：{formatDate(bookingData.date)}
                </p>
              </div>
            )}
            <button
              onClick={() => setStep(bookingData.mode === 'A' ? 3 : 2)}
              className="mt-6 text-gray-600 hover:text-primary flex items-center gap-2"
            >
              <ChevronRight size={16} className="rotate-180" />
              返回上一步
            </button>
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
                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={`p-4 border-2 rounded-lg transition-all text-center ${
                      !slot.available
                        ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                        : bookingData.time === slot.time
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer'
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
                    <p className="text-gray-600">載入時段資料中...</p>
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
                onClick={() => setStep(5)}
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
