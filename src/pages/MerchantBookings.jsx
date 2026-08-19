import { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, Download, Mail, Phone, Search, StickyNote, User } from 'lucide-react'
import { assignTeacherToBooking, getBookings, toLocalDateStr, updateBookingStatus } from '../utils/storage'

const HEALTH_LABELS = {
  pregnancy: '懷孕中',
  skinSensitivity: '肌膚敏感',
  recentSurgery: '近期手術',
  medications: '正在用藥'
}

const STATUS_OPTIONS = [
  { value: 'all', label: '全部狀態' },
  { value: 'confirmed', label: '已確認' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' }
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })
}

function statusClass(status) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function statusText(status) {
  switch (status) {
    case 'confirmed':
      return '已確認'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    case 'pending':
      return '待確認'
    default:
      return status
  }
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function downloadBookingsCsv(bookings) {
  const headers = ['日期', '時間', '狀態', '客人姓名', '電話', 'Email', '服務', '老師', '金額', '備註', '健康聲明']
  const rows = bookings.map((b) => {
    const health = b.health_declaration
      ? Object.entries(HEALTH_LABELS).filter(([key]) => b.health_declaration[key]).map(([, label]) => label).join('、')
      : ''
    return [
      b.booking_date,
      b.booking_time,
      statusText(b.status),
      b.user_name,
      b.user_phone,
      b.user_email || '',
      b.service?.name || '',
      b.teacher?.name || '',
      b.total_price || 0,
      b.user_note || '',
      health
    ].map(csvCell).join(',')
  })
  const csv = [headers.map(csvCell).join(','), ...rows].join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `預約_${toLocalDateStr(new Date())}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function MerchantBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('picked')
  const [pickedDate, setPickedDate] = useState(toLocalDateStr(new Date()))
  const [selectedId, setSelectedId] = useState(null)
  const [teacherInput, setTeacherInput] = useState('')
  const [savingTeacher, setSavingTeacher] = useState(false)

  const loadBookings = async () => {
    setLoading(true)
    const data = await getBookings()
    setBookings(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const today = new Date().toISOString().split('T')[0]

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      if (statusFilter !== 'all' && booking.status !== statusFilter) return false
      if (dateFilter === 'today' && booking.booking_date !== today) return false
      if (dateFilter === 'picked' && booking.booking_date !== pickedDate) return false
      if (dateFilter === 'upcoming' && booking.booking_date < today) return false
      if (dateFilter === 'past' && booking.booking_date >= today) return false

      const q = keyword.trim()
      if (!q) return true
      const haystack = [
        booking.user_name,
        booking.user_phone,
        booking.user_email,
        booking.service?.name,
        booking.teacher?.name
      ].join(' ').toLowerCase()
      return haystack.includes(q.toLowerCase())
    })
  }, [bookings, statusFilter, dateFilter, pickedDate, keyword, today])

  const selected = filtered.find((b) => b.id === selectedId) || filtered[0] || null

  useEffect(() => {
    setTeacherInput(selected?.teacher?.name || '')
  }, [selected?.id, selected?.teacher?.name])

  const todayCount = bookings.filter((b) => b.booking_date === today && b.status !== 'cancelled').length
  const upcomingCount = bookings.filter((b) => b.booking_date >= today && b.status === 'confirmed').length

  const handleStatusChange = async (id, status) => {
    const ok = await updateBookingStatus(id, status)
    if (!ok) {
      alert('更新狀態失敗，請稍後再試')
      return
    }
    await loadBookings()
  }

  const handleAssignTeacher = async () => {
    if (!selected) return
    setSavingTeacher(true)
    const ok = await assignTeacherToBooking(selected.id, teacherInput)
    setSavingTeacher(false)
    if (!ok) {
      alert('儲存老師名稱失敗，請稍後再試')
      return
    }
    await loadBookings()
  }

  const handleExport = () => {
    if (filtered.length === 0) {
      alert('目前沒有可匯出的預約')
      return
    }
    downloadBookingsCsv(filtered)
  }

  const healthItems = selected?.health_declaration
    ? Object.entries(HEALTH_LABELS).filter(([key]) => selected.health_declaration[key])
    : []

  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">預約管理</h1>
            <p className="text-gray-600">資料存在 Supabase，也可匯出成 Excel 可開啟的 CSV。</p>
          </div>
          <button onClick={handleExport} className="btn-secondary flex items-center justify-center gap-2">
            <Download size={18} />
            匯出 Excel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <p className="text-gray-500 text-sm">今日有效預約</p>
            <p className="text-3xl font-bold text-primary mt-1">{todayCount}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">即將到來（已確認）</p>
            <p className="text-3xl font-bold text-primary mt-1">{upcomingCount}</p>
          </div>
          <div className="card">
            <p className="text-gray-500 text-sm">全部預約</p>
            <p className="text-3xl font-bold text-primary mt-1">{bookings.length}</p>
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="input-field pl-10"
                placeholder="搜尋姓名、電話、服務或老師"
              />
            </div>
            <input
              type="date"
              value={pickedDate}
              onChange={(e) => {
                setPickedDate(e.target.value)
                setDateFilter('picked')
              }}
              className="input-field md:w-44"
            />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field md:w-40"
            >
              <option value="picked">指定日期</option>
              <option value="today">今天</option>
              <option value="upcoming">即將到來</option>
              <option value="past">過去</option>
              <option value="all">全部日期</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field md:w-40"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-12 text-gray-500">載入中...</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">目前沒有符合條件的預約</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {filtered.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => setSelectedId(booking.id)}
                  className={`card w-full text-left transition-shadow ${
                    selected?.id === booking.id ? 'ring-2 ring-primary' : 'hover:shadow-xl'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-semibold">{booking.user_name}</p>
                      <p className="text-sm text-gray-500">{booking.service?.name || '未指定服務'}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(booking.booking_date)} {booking.booking_time}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusClass(booking.status)}`}>
                      {statusText(booking.status)}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <div className="lg:col-span-3 card">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selected.user_name}</h2>
                    <p className="text-gray-500 mt-1">{selected.service?.name || '未指定服務'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClass(selected.status)}`}>
                    {statusText(selected.status)}
                  </span>
                </div>

                <div className="space-y-3 text-gray-700 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} />
                    <span>{formatDate(selected.booking_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={18} />
                    <span>{selected.booking_time}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <User size={18} />
                    {selected.teacher?.name ? (
                      <span>{selected.teacher.name}</span>
                    ) : (
                      <>
                        <span>未指定老師</span>
                        <input
                          type="text"
                          value={teacherInput}
                          onChange={(e) => setTeacherInput(e.target.value)}
                          className="input-field !py-2 !px-3 w-40"
                          placeholder="輸入老師名稱"
                        />
                        <button
                          onClick={handleAssignTeacher}
                          disabled={savingTeacher || !teacherInput.trim()}
                          className="btn-primary !px-4 !py-2 text-sm"
                        >
                          {savingTeacher ? '儲存中...' : '儲存'}
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={18} />
                    <a href={`tel:${selected.user_phone}`} className="hover:text-primary">{selected.user_phone}</a>
                  </div>
                  {selected.user_email && (
                    <div className="flex items-center gap-2">
                      <Mail size={18} />
                      <a href={`mailto:${selected.user_email}`} className="hover:text-primary">{selected.user_email}</a>
                    </div>
                  )}
                  <p className="font-semibold text-primary">
                    NT$ {Number(selected.total_price || 0).toLocaleString()}
                  </p>
                </div>

                {selected.user_note && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <StickyNote size={18} />
                      備註
                    </h3>
                    <p className="text-gray-600 bg-secondary rounded-lg p-3">{selected.user_note}</p>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="font-semibold mb-2">健康聲明</h3>
                  {healthItems.length > 0 ? (
                    <ul className="list-disc list-inside text-red-700 space-y-1">
                      {healthItems.map(([key, label]) => (
                        <li key={key}>{label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">客人未勾選特殊健康狀況</p>
                  )}
                </div>

                {selected.status !== 'cancelled' && (
                  <div className="flex flex-wrap gap-3">
                    {selected.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(selected.id, 'completed')}
                        className="btn-primary"
                      >
                        標記完成
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange(selected.id, 'cancelled')}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      取消預約
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
