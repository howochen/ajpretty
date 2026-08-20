import { useState } from 'react'
import { Heart, Calendar, Sparkles, Star } from 'lucide-react'
import { useTenant } from '../context/TenantContext'

const emptyEntry = { title: '', category: '', date: '', image: '', description: '', tags: [] }

export default function BeautyDiary({ isAdmin = false }) {
  const { tenant, saveSiteContent } = useTenant()
  const diaryEntries = tenant.site_content.diary_entries || []
  const content = tenant.site_content
  const categories = ['全部', ...new Set(diaryEntries.map((entry) => entry.category).filter(Boolean))]
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [editingEntry, setEditingEntry] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editingCta, setEditingCta] = useState(false)
  const [ctaDraft, setCtaDraft] = useState({})

  const filteredEntries = selectedCategory === '全部' 
    ? diaryEntries 
    : diaryEntries.filter(entry => entry.category === selectedCategory)

  const saveEntry = async () => {
    if (!editingEntry?.title.trim()) return alert('請輸入標題')
    const item = {
      ...editingEntry,
      title: editingEntry.title.trim(),
      tags: Array.isArray(editingEntry.tags) ? editingEntry.tags : editingEntry.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
    }
    const nextEntries = item.id
      ? diaryEntries.map((entry) => entry.id === item.id ? item : entry)
      : [...diaryEntries, { ...item, id: `diary-${Date.now()}` }]
    setSaving(true)
    try {
      await saveSiteContent({ diary_entries: nextEntries })
      setEditingEntry(null)
    } catch (error) {
      alert(error.message || '日誌儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const removeEntry = async (entryId) => {
    if (!window.confirm('確定要移除這篇變美日誌嗎？')) return
    setSaving(true)
    try {
      await saveSiteContent({ diary_entries: diaryEntries.filter((entry) => entry.id !== entryId) })
    } catch (error) {
      alert(error.message || '日誌移除失敗')
    } finally {
      setSaving(false)
    }
  }

  const moveEntry = async (entryId, direction) => {
    const index = diaryEntries.findIndex((entry) => entry.id === entryId)
    const targetIndex = index + direction
    if (index < 0 || targetIndex < 0 || targetIndex >= diaryEntries.length) return
    const nextEntries = [...diaryEntries]
    ;[nextEntries[index], nextEntries[targetIndex]] = [nextEntries[targetIndex], nextEntries[index]]
    setSaving(true)
    try {
      await saveSiteContent({ diary_entries: nextEntries })
    } catch (error) {
      alert(error.message || '日誌排序更新失敗')
    } finally {
      setSaving(false)
    }
  }

  const saveCta = async () => {
    setSaving(true)
    try { await saveSiteContent(ctaDraft); setEditingCta(false) } catch (error) { alert(error.message || '日誌頁文字儲存失敗') } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">{content.diary_page_title}</h1>
          <p className="text-gray-600">{content.diary_page_description}</p>
        </div>

        {isAdmin && (
          <div className="mb-8 p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-semibold text-primary">管理者編輯模式</p><p className="text-sm text-gray-600">可直接新增、編輯、移除或調整作品順序。</p></div>
            <button type="button" onClick={() => setEditingEntry({ ...emptyEntry })} className="btn-primary" disabled={saving}>新增變美日誌</button>
          </div>
        )}

        {isAdmin && <div className="mb-8 flex justify-end"><button type="button" onClick={() => { setCtaDraft({ diary_page_title: content.diary_page_title, diary_page_description: content.diary_page_description, diary_cta_title: content.diary_cta_title, diary_cta_description: content.diary_cta_description, diary_cta_button: content.diary_cta_button }); setEditingCta(!editingCta) }} className="btn-secondary">{editingCta ? '關閉頁面文字編輯' : '編輯頁面文字'}</button></div>}
        {isAdmin && editingCta && <div className="card mb-8"><div className="grid md:grid-cols-2 gap-3"><input className="input-field" value={ctaDraft.diary_page_title || ''} onChange={(event) => setCtaDraft({ ...ctaDraft, diary_page_title: event.target.value })} placeholder="頁面標題" /><textarea className="input-field" value={ctaDraft.diary_page_description || ''} onChange={(event) => setCtaDraft({ ...ctaDraft, diary_page_description: event.target.value })} placeholder="頁面說明" /><input className="input-field" value={ctaDraft.diary_cta_title || ''} onChange={(event) => setCtaDraft({ ...ctaDraft, diary_cta_title: event.target.value })} placeholder="CTA 標題" /><textarea className="input-field" value={ctaDraft.diary_cta_description || ''} onChange={(event) => setCtaDraft({ ...ctaDraft, diary_cta_description: event.target.value })} placeholder="CTA 說明" /><input className="input-field" value={ctaDraft.diary_cta_button || ''} onChange={(event) => setCtaDraft({ ...ctaDraft, diary_cta_button: event.target.value })} placeholder="CTA 按鈕" /></div><button type="button" onClick={saveCta} className="btn-primary mt-4" disabled={saving}>{saving ? '儲存中...' : '儲存頁面文字'}</button></div>}

        {isAdmin && editingEntry && (
          <div className="card mb-8 border-2 border-primary/30">
            <h2 className="text-xl font-bold mb-4">{editingEntry.id ? '編輯變美日誌' : '新增變美日誌'}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input className="input-field" value={editingEntry.title} onChange={(event) => setEditingEntry({ ...editingEntry, title: event.target.value })} placeholder="標題" />
              <input className="input-field" value={editingEntry.category} onChange={(event) => setEditingEntry({ ...editingEntry, category: event.target.value })} placeholder="分類" />
              <input className="input-field" value={editingEntry.date} onChange={(event) => setEditingEntry({ ...editingEntry, date: event.target.value })} placeholder="日期" />
              <input className="input-field" value={editingEntry.image} onChange={(event) => setEditingEntry({ ...editingEntry, image: event.target.value })} placeholder="圖片網址" />
              <textarea className="input-field md:col-span-2" rows="3" value={editingEntry.description} onChange={(event) => setEditingEntry({ ...editingEntry, description: event.target.value })} placeholder="內容說明" />
              <input className="input-field md:col-span-2" value={Array.isArray(editingEntry.tags) ? editingEntry.tags.join(', ') : editingEntry.tags} onChange={(event) => setEditingEntry({ ...editingEntry, tags: event.target.value })} placeholder="標籤，用逗號分隔" />
            </div>
            <div className="flex gap-3 mt-4"><button type="button" onClick={saveEntry} className="btn-primary" disabled={saving}>{saving ? '儲存中...' : '儲存'}</button><button type="button" onClick={() => setEditingEntry(null)} className="btn-secondary">取消</button></div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-primary hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="card cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <div className="relative overflow-hidden rounded-lg mb-4">
                <img
                  src={entry.image}
                  alt={entry.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-full text-sm">
                  {entry.category}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{entry.title}</h3>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                <Calendar size={16} />
                <span>{entry.date}</span>
              </div>
              <p className="text-gray-600 line-clamp-2">{entry.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {entry.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              {isAdmin && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100" onClick={(event) => event.stopPropagation()}>
                  <button type="button" onClick={() => setEditingEntry({ ...entry, tags: entry.tags || [] })} className="btn-secondary px-3 py-2 text-sm">編輯</button>
                  <button type="button" onClick={() => moveEntry(entry.id, -1)} className="btn-secondary px-3 py-2 text-sm">上移</button>
                  <button type="button" onClick={() => moveEntry(entry.id, 1)} className="btn-secondary px-3 py-2 text-sm">下移</button>
                  <button type="button" onClick={() => removeEntry(entry.id)} className="text-red-600 border border-red-200 rounded-lg px-3 py-2 text-sm">移除</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail Modal */}
        {selectedEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEntry(null)}>
            <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedEntry.image}
                alt={selectedEntry.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg mb-6"
              />
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {selectedEntry.category}
                </span>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Calendar size={16} />
                  <span>{selectedEntry.date}</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4">{selectedEntry.title}</h2>
              <p className="text-gray-700 mb-6">{selectedEntry.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedEntry.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="flex-1 btn-secondary"
                >
                  關閉
                </button>
                <button
                  onClick={() => {
                    setSelectedEntry(null)
                    window.location.href = '/booking'
                  }}
                  className="flex-1 btn-primary"
                >
                  預約此服務
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="card bg-gradient-to-br from-primary to-accent text-white">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="fill-current" size={32} />
              <Sparkles size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">{content.diary_cta_title}</h2>
            <p className="mb-6 opacity-90">{content.diary_cta_description}</p>
            <button
              onClick={() => window.location.href = '/booking'}
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              {content.diary_cta_button}
            </button>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-12 flex justify-center gap-6">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <span className="text-2xl">📸</span>
            <span>Instagram</span>
          </a>
          <a
            href="https://line.me"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
          >
            <span className="text-2xl">💬</span>
            <span>LINE</span>
          </a>
        </div>
      </div>
    </div>
  )
}
