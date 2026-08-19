import { useState } from 'react'
import { ChevronRight, Calendar, Users, BookOpen } from 'lucide-react'

const courses = [
  {
    id: 1,
    title: '專業美睫初級課程',
    description: '從零開始學習專業美睫技術，包含理論與實作',
    duration: '3天',
    price: 25000,
    deposit: 5000,
    maxStudents: 6,
    currentStudents: 4,
    dates: ['2024年10月5-7日', '2024年11月2-4日'],
    level: '初級'
  },
  {
    id: 2,
    title: '皮膚管理進階課程',
    description: '深入學習皮膚管理知識與實務操作',
    duration: '5天',
    price: 45000,
    deposit: 10000,
    maxStudents: 8,
    currentStudents: 6,
    dates: ['2024年10月12-16日'],
    level: '進階'
  },
  {
    id: 3,
    title: '眉型設計專業課程',
    description: '掌握眉型設計精髓，打造完美眉型',
    duration: '2天',
    price: 18000,
    deposit: 4000,
    maxStudents: 4,
    currentStudents: 2,
    dates: ['2024年10月19-20日', '2024年11月9-10日'],
    level: '中級'
  }
]

export default function Courses() {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [regForm, setRegForm] = useState({
    courseId: '',
    name: '',
    phone: '',
    email: '',
    date: '',
    note: ''
  })

  const handleCourseSelect = (course) => {
    setSelectedCourse(course)
    setRegForm({ ...regForm, courseId: course.id })
    setShowRegistration(true)
  }

  const handleSubmitRegistration = () => {
    console.log('Course registration:', regForm)
    alert('報名成功！請於24小時內完成訂金匯款。')
    setShowRegistration(false)
    setSelectedCourse(null)
    setRegForm({
      courseId: '',
      name: '',
      phone: '',
      email: '',
      date: '',
      note: ''
    })
  }

  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">課程報名</h1>
          <p className="text-gray-600">提升專業技能，開啟美業新篇章</p>
        </div>

        {/* Course List */}
        {!showRegistration && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="card hover:shadow-xl transition-shadow">
                <div className="mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {course.level}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3">{course.title}</h3>
                <p className="text-gray-600 mb-4">{course.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={18} />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={18} />
                    <span>名額: {course.currentStudents}/{course.maxStudents}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <BookOpen size={18} />
                    <span>開課日期: {course.dates.join('、')}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-2xl font-bold text-primary mb-1">
                    NT$ {course.price.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    訂金 NT$ {course.deposit.toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleCourseSelect(course)}
                    className="w-full btn-primary"
                  >
                    立即報名
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Registration Form */}
        {showRegistration && selectedCourse && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowRegistration(false)}
              className="text-gray-600 hover:text-primary flex items-center gap-2 mb-6"
            >
              <ChevronRight size={16} className="rotate-180" />
              返回課程列表
            </button>

            <div className="card">
              <h2 className="text-2xl font-bold mb-2">{selectedCourse.title}</h2>
              <p className="text-gray-600 mb-6">{selectedCourse.description}</p>

              <div className="bg-primary/10 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">課程資訊</h3>
                <div className="space-y-1 text-gray-700">
                  <p>課程時長：{selectedCourse.duration}</p>
                  <p>課程費用：NT$ {selectedCourse.price.toLocaleString()}</p>
                  <p>訂金金額：NT$ {selectedCourse.deposit.toLocaleString()}</p>
                  <p>開課日期：{selectedCourse.dates.join('、')}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">姓名 *</label>
                  <input
                    type="text"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className="input-field"
                    placeholder="請輸入您的姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">手機號碼 *</label>
                  <input
                    type="tel"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="input-field"
                    placeholder="09xx-xxx-xxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">電子郵件 *</label>
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="input-field"
                    placeholder="example@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">選擇開課日期 *</label>
                  <select
                    value={regForm.date}
                    onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                    className="input-field"
                  >
                    <option value="">請選擇日期</option>
                    {selectedCourse.dates.map((date, index) => (
                      <option key={index} value={date}>{date}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">備註</label>
                  <textarea
                    value={regForm.note}
                    onChange={(e) => setRegForm({ ...regForm, note: e.target.value })}
                    className="input-field"
                    rows="3"
                    placeholder="如有問題請在此說明"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-6 mb-6">
                <h4 className="font-semibold text-yellow-800 mb-2">付款注意事項</h4>
                <p className="text-yellow-700 text-sm">
                  請於 24 小時內匯款訂金 NT$ {selectedCourse.deposit.toLocaleString()} 至以下帳戶：
                </p>
                <p className="text-yellow-700 text-sm mt-1">
                  銀行：台灣銀行 | 帳號：1234-5678-9012
                </p>
                <p className="text-yellow-700 text-sm mt-2">
                  匯款完成後，請至「我的預約」以電話查詢，回報帳號後五碼以完成報名
                </p>
              </div>

              <button
                onClick={handleSubmitRegistration}
                className="w-full btn-primary"
              >
                確認報名
              </button>
            </div>
          </div>
        )}

        {/* Course Info */}
        {!showRegistration && (
          <div className="mt-12 card">
            <h3 className="text-xl font-bold mb-4">課程報名注意事項</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• 報名後請於規定時間內完成訂金匯款，逾期將取消報名資格</li>
              <li>• 訂金匯款後請保留匯款收據，並回報後五碼以完成報名手續</li>
              <li>• 課程開始前7天可申請改期，需支付手續費 NT$ 500</li>
              <li>• 課程開始前3天內不接受改期或退費</li>
              <li>• 如因不可抗力因素取消課程，將全額退費</li>
              <li>• 課程包含教材與實作用品，學員需自備筆記本</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
