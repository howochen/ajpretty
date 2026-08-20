import { useState } from 'react'
import { ChevronRight, Calendar, Users, BookOpen } from 'lucide-react'
import { useTenant } from '../context/TenantContext'

const emptyCourse = { title: '', description: '', duration: '', price: 0, deposit: 0, maxStudents: 1, currentStudents: 0, dates: [], level: '' }

export default function Courses({ isAdmin = false }) {
  const { tenant, saveSiteContent } = useTenant()
  const courses = tenant.site_content.courses || []
  const content = tenant.site_content
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
  const [editingCourse, setEditingCourse] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editingNotices, setEditingNotices] = useState(false)
  const [noticeDraft, setNoticeDraft] = useState([])
  const [editingPageCopy, setEditingPageCopy] = useState(false)
  const [pageCopyDraft, setPageCopyDraft] = useState({})

  const saveCourse = async () => {
    if (!editingCourse?.title.trim()) return alert('請輸入課程名稱')
    const item = { ...editingCourse, title: editingCourse.title.trim(), price: Number(editingCourse.price) || 0, deposit: Number(editingCourse.deposit) || 0, dates: Array.isArray(editingCourse.dates) ? editingCourse.dates : editingCourse.dates.split(',').map((date) => date.trim()).filter(Boolean) }
    const nextCourses = item.id ? courses.map((course) => course.id === item.id ? item : course) : [...courses, { ...item, id: `course-${Date.now()}` }]
    setSaving(true)
    try { await saveSiteContent({ courses: nextCourses }); setEditingCourse(null) } catch (error) { alert(error.message || '課程儲存失敗') } finally { setSaving(false) }
  }

  const removeCourse = async (id) => {
    if (!window.confirm('確定要移除這門課程嗎？')) return
    setSaving(true)
    try { await saveSiteContent({ courses: courses.filter((course) => course.id !== id) }) } catch (error) { alert(error.message || '課程移除失敗') } finally { setSaving(false) }
  }

  const moveCourse = async (id, direction) => {
    const index = courses.findIndex((course) => course.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= courses.length) return
    const nextCourses = [...courses]
    ;[nextCourses[index], nextCourses[target]] = [nextCourses[target], nextCourses[index]]
    setSaving(true)
    try { await saveSiteContent({ courses: nextCourses }) } catch (error) { alert(error.message || '課程排序更新失敗') } finally { setSaving(false) }
  }

  const saveNotices = async () => {
    setSaving(true)
    try { await saveSiteContent({ course_notices: noticeDraft.filter((notice) => notice.trim()) }); setEditingNotices(false) } catch (error) { alert(error.message || '注意事項儲存失敗') } finally { setSaving(false) }
  }

  const savePageCopy = async () => {
    setSaving(true)
    try { await saveSiteContent(pageCopyDraft); setEditingPageCopy(false) } catch (error) { alert(error.message || '課程頁文字儲存失敗') } finally { setSaving(false) }
  }

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
          <h1 className="text-3xl font-bold mb-4">{content.courses_title}</h1>
          <p className="text-gray-600">{content.courses_description}</p>
        </div>

        {isAdmin && <div className="mb-6 flex justify-end"><button type="button" onClick={() => { setPageCopyDraft({ courses_title: content.courses_title, courses_description: content.courses_description }); setEditingPageCopy(!editingPageCopy) }} className="btn-secondary">{editingPageCopy ? '關閉頁面文字編輯' : '編輯課程頁文字'}</button></div>}
        {isAdmin && editingPageCopy && <div className="card mb-8"><div className="grid md:grid-cols-2 gap-3"><input className="input-field" value={pageCopyDraft.courses_title || ''} onChange={(event) => setPageCopyDraft({ ...pageCopyDraft, courses_title: event.target.value })} placeholder="課程頁標題" /><textarea className="input-field" value={pageCopyDraft.courses_description || ''} onChange={(event) => setPageCopyDraft({ ...pageCopyDraft, courses_description: event.target.value })} placeholder="課程頁說明" /></div><button type="button" onClick={savePageCopy} className="btn-primary mt-4" disabled={saving}>{saving ? '儲存中...' : '儲存頁面文字'}</button></div>}

        {isAdmin && <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-primary">管理者編輯模式</p><p className="text-sm text-gray-600">可直接新增、編輯、移除或調整課程順序。</p></div><button type="button" onClick={() => setEditingCourse({ ...emptyCourse, dates: [] })} className="btn-primary" disabled={saving}>新增課程</button></div>}

        {isAdmin && editingCourse && <div className="card mb-8 border-2 border-primary/30"><h2 className="text-xl font-bold mb-4">{editingCourse.id ? '編輯課程' : '新增課程'}</h2><div className="grid md:grid-cols-2 gap-4"><input className="input-field" value={editingCourse.title} onChange={(event) => setEditingCourse({ ...editingCourse, title: event.target.value })} placeholder="課程名稱" /><input className="input-field" value={editingCourse.level} onChange={(event) => setEditingCourse({ ...editingCourse, level: event.target.value })} placeholder="程度" /><textarea className="input-field md:col-span-2" rows="3" value={editingCourse.description} onChange={(event) => setEditingCourse({ ...editingCourse, description: event.target.value })} placeholder="課程說明" /><input className="input-field" value={editingCourse.duration} onChange={(event) => setEditingCourse({ ...editingCourse, duration: event.target.value })} placeholder="課程時長" /><input className="input-field" value={Array.isArray(editingCourse.dates) ? editingCourse.dates.join(', ') : editingCourse.dates} onChange={(event) => setEditingCourse({ ...editingCourse, dates: event.target.value })} placeholder="開課日期，用逗號分隔" /><input type="number" className="input-field" value={editingCourse.price} onChange={(event) => setEditingCourse({ ...editingCourse, price: event.target.value })} placeholder="課程費用" /><input type="number" className="input-field" value={editingCourse.deposit} onChange={(event) => setEditingCourse({ ...editingCourse, deposit: event.target.value })} placeholder="訂金" /></div><div className="flex gap-3 mt-4"><button type="button" onClick={saveCourse} className="btn-primary" disabled={saving}>{saving ? '儲存中...' : '儲存'}</button><button type="button" onClick={() => setEditingCourse(null)} className="btn-secondary">取消</button></div></div>}

        {isAdmin && <div className="card mb-8 border-2 border-primary/20"><div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="text-xl font-bold">課程報名注意事項</h2><p className="text-sm text-gray-500 mt-1">可直接新增或移除注意事項。</p></div><button type="button" onClick={() => { setNoticeDraft([...(content.course_notices || [])]); setEditingNotices(!editingNotices) }} className="btn-secondary">{editingNotices ? '關閉編輯' : '編輯注意事項'}</button></div>{editingNotices && <><div className="space-y-3">{noticeDraft.map((notice, index) => <div key={index} className="flex gap-2"><input className="input-field" value={notice} onChange={(event) => setNoticeDraft(noticeDraft.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /><button type="button" onClick={() => setNoticeDraft(noticeDraft.filter((_, itemIndex) => itemIndex !== index))} className="text-red-600 border border-red-200 rounded-lg px-3">移除</button></div>)}</div><div className="flex gap-3 mt-4"><button type="button" onClick={() => setNoticeDraft([...noticeDraft, ''])} className="btn-secondary">新增注意事項</button><button type="button" onClick={saveNotices} className="btn-primary" disabled={saving}>儲存注意事項</button></div></>}</div>}

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
                  {isAdmin && <div className="flex flex-wrap gap-2 mt-3" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setEditingCourse({ ...course, dates: course.dates || [] })} className="btn-secondary px-3 py-2 text-sm">編輯</button><button type="button" onClick={() => moveCourse(course.id, -1)} className="btn-secondary px-3 py-2 text-sm">上移</button><button type="button" onClick={() => moveCourse(course.id, 1)} className="btn-secondary px-3 py-2 text-sm">下移</button><button type="button" onClick={() => removeCourse(course.id)} className="text-red-600 border border-red-200 rounded-lg px-3 py-2 text-sm">移除</button></div>}
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
              {(content.course_notices || []).map((notice, index) => <li key={index}>• {notice}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
