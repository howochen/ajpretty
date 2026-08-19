import { useState } from 'react'
import { Calendar, Clock, User, Phone, X } from 'lucide-react'
import { getBookingsByPhone, cancelBooking } from '../utils/storage'

export default function MyBookings() {
  const [phone, setPhone] = useState('')
  const [bookings, setBookings] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState(null)

  const handleSearch = async () => {
    if (!phone.trim()) {
      alert('請輸入手機號碼')
      return
    }
    
    setLoading(true)
    
    try {
      const userBookings = await getBookingsByPhone(phone)
      const formattedBookings = userBookings.map(booking => {
        const bookingDate = new Date(booking.booking_date)
        const formattedDate = bookingDate.toLocaleDateString('zh-TW', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
        
        return {
          id: booking.id,
          serviceName: booking.service?.name || '未知服務',
          teacher: booking.teacher?.name || '未指定',
          date: formattedDate,
          time: booking.booking_time,
          status: booking.status,
          price: booking.total_price,
          originalDate: booking.booking_date,
          originalTime: booking.booking_time
        }
      })
      
      setBookings(formattedBookings)
      setSearched(true)
    } catch (error) {
      console.error('Error searching bookings:', error)
      alert('查詢失敗，請稍後再試')
    }
    
    setLoading(false)
  }

  const handleCancelBooking = (id) => {
    setCancelBookingId(id)
    setShowCancelModal(true)
  }

  const confirmCancel = async () => {
    const bookingToCancel = bookings.find(b => b.id === cancelBookingId)
    
    if (bookingToCancel) {
      try {
        // Cancel booking in Supabase (this also restores availability)
        const success = await cancelBooking(cancelBookingId)
        
        if (success) {
          // Update local state
          setBookings(bookings.filter(b => b.id !== cancelBookingId))
          alert('預約已取消')
        } else {
          alert('取消預約失敗，請稍後再試')
        }
      } catch (error) {
        console.error('Error cancelling booking:', error)
        alert('取消預約失敗，請稍後再試')
      }
    }
    
    setShowCancelModal(false)
    setCancelBookingId(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return '已確認'
      case 'pending':
        return '待確認'
      case 'cancelled':
        return '已取消'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">我的預約</h1>

        {/* Search Section */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">查詢預約紀錄</h2>
          <p className="text-gray-600 mb-4">請輸入您的手機號碼查詢預約紀錄</p>
          <div className="flex gap-4">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field flex-1"
              placeholder="09xx-xxx-xxx"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary whitespace-nowrap"
            >
              {loading ? '查詢中...' : '查詢'}
            </button>
          </div>
        </div>

        {/* Booking List */}
        {searched && bookings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">預約紀錄</h2>
            {bookings.map((booking) => (
              <div key={booking.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{booking.serviceName}</h3>
                    <div className="space-y-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <User size={18} />
                        <span>{booking.teacher}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} />
                        <span>{booking.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={18} />
                        <span>{booking.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                    <p className="text-lg font-bold text-primary mt-2">
                      NT$ {booking.price.toLocaleString()}
                    </p>
                  </div>
                </div>
                {booking.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="text-red-600 hover:text-red-700 flex items-center gap-2 mt-4"
                  >
                    <X size={18} />
                    取消預約
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {searched && bookings.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">找不到相關的預約紀錄</p>
            <p className="text-gray-500">請確認手機號碼是否正確，或聯繫我們協助查詢</p>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">確認取消預約</h3>
              <p className="text-gray-600 mb-6">
                取消後無法復原，如需重新預約請再次操作。
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  確認取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-8 card">
          <h3 className="text-lg font-semibold mb-4">需要協助？</h3>
          <div className="space-y-3">
            <a href="tel:0912345678" className="flex items-center gap-3 text-gray-700 hover:text-primary">
              <Phone size={20} />
              <span>電話聯繫：0912-345-678</span>
            </a>
            <a href="https://line.me" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-primary">
              <span className="text-xl">💬</span>
              <span>LINE 聯繫</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
