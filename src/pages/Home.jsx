import { Link } from 'react-router-dom'
import { Calendar, Sparkles, Heart, Scissors } from 'lucide-react'
import { useState } from 'react'
import { useTenant } from '../context/TenantContext'

const emptyService = { name: '', description: '', icon: 'sparkles' }

export default function Home({ isAdmin = false }) {
  const { tenant, saveSiteContent } = useTenant()
  const content = tenant.site_content
  const services = content.services || []
  const serviceIcons = { sparkles: Sparkles, heart: Heart, scissors: Scissors, calendar: Calendar }
  const [editingService, setEditingService] = useState(null)
  const [savingService, setSavingService] = useState(false)
  const [editingHero, setEditingHero] = useState(false)
  const [heroDraft, setHeroDraft] = useState({})

  const saveService = async () => {
    if (!editingService?.name.trim()) return alert('請輸入服務名稱')
    const item = { ...editingService, name: editingService.name.trim(), description: editingService.description.trim() }
    const nextServices = item.id ? services.map((service) => service.id === item.id ? item : service) : [...services, { ...item, id: `service-${Date.now()}` }]
    setSavingService(true)
    try { await saveSiteContent({ services: nextServices }); setEditingService(null) } catch (error) { alert(error.message || '服務儲存失敗') } finally { setSavingService(false) }
  }

  const removeService = async (id) => {
    if (!window.confirm('確定要移除這項服務嗎？')) return
    setSavingService(true)
    try { await saveSiteContent({ services: services.filter((service) => service.id !== id) }) } catch (error) { alert(error.message || '服務移除失敗') } finally { setSavingService(false) }
  }

  const moveService = async (id, direction) => {
    const index = services.findIndex((service) => service.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= services.length) return
    const nextServices = [...services]
    ;[nextServices[index], nextServices[target]] = [nextServices[target], nextServices[index]]
    setSavingService(true)
    try { await saveSiteContent({ services: nextServices }) } catch (error) { alert(error.message || '服務排序更新失敗') } finally { setSavingService(false) }
  }

  const saveHero = async () => {
    setSavingService(true)
    try { await saveSiteContent(heroDraft); setEditingHero(false) } catch (error) { alert(error.message || '首頁文字儲存失敗') } finally { setSavingService(false) }
  }
  const instagramUrl = tenant.instagram_id?.trim()
    ? (/^https?:\/\//i.test(tenant.instagram_id) ? tenant.instagram_id : `https://instagram.com/${tenant.instagram_id.replace(/^@/, '')}`)
    : 'https://instagram.com'
  const lineUrl = tenant.line_id?.trim()
    ? (/^https?:\/\//i.test(tenant.line_id) ? tenant.line_id : `https://line.me/ti/p/~${tenant.line_id.replace(/^@/, '')}`)
    : 'https://line.me'

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-accent text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {isAdmin && <div className="flex justify-end mb-4"><button type="button" onClick={() => { setHeroDraft({ hero_title: content.hero_title, hero_subtitle: content.hero_subtitle, hero_primary_button: content.hero_primary_button, hero_secondary_button: content.hero_secondary_button }); setEditingHero(!editingHero) }} className="bg-white/90 text-primary px-4 py-2 rounded-lg font-semibold">{editingHero ? '關閉編輯' : '編輯首頁主視覺'}</button></div>}
          {isAdmin && editingHero && <div className="bg-white text-gray-900 rounded-xl p-5 mb-6 text-left max-w-2xl mx-auto"><div className="grid md:grid-cols-2 gap-3"><input className="input-field" value={heroDraft.hero_title || ''} onChange={(event) => setHeroDraft({ ...heroDraft, hero_title: event.target.value })} placeholder="首頁標題" /><textarea className="input-field" value={heroDraft.hero_subtitle || ''} onChange={(event) => setHeroDraft({ ...heroDraft, hero_subtitle: event.target.value })} placeholder="首頁副標題" /><input className="input-field" value={heroDraft.hero_primary_button || ''} onChange={(event) => setHeroDraft({ ...heroDraft, hero_primary_button: event.target.value })} placeholder="主要按鈕" /><input className="input-field" value={heroDraft.hero_secondary_button || ''} onChange={(event) => setHeroDraft({ ...heroDraft, hero_secondary_button: event.target.value })} placeholder="次要按鈕" /></div><button type="button" onClick={saveHero} className="btn-primary mt-4" disabled={savingService}>{savingService ? '儲存中...' : '儲存首頁主視覺'}</button></div>}
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {content.hero_title || tenant.name}
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            {content.hero_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              {content.hero_primary_button}
            </Link>
            <Link to="/beauty-diary" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors">
              {content.hero_secondary_button}
            </Link>
          </div>
        </div>
      </section>

      {isAdmin && <div className="max-w-7xl mx-auto px-4 pt-8"><div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-primary">管理者編輯模式</p><p className="text-sm text-gray-600">可直接管理首頁服務卡片。</p></div><button type="button" onClick={() => setEditingService({ ...emptyService })} className="btn-primary" disabled={savingService}>新增服務</button></div></div>}

      {isAdmin && editingService && <div className="max-w-7xl mx-auto px-4 pt-6"><div className="card border-2 border-primary/30"><h2 className="text-xl font-bold mb-4">{editingService.id ? '編輯服務' : '新增服務'}</h2><div className="grid md:grid-cols-3 gap-4"><input className="input-field" value={editingService.name} onChange={(event) => setEditingService({ ...editingService, name: event.target.value })} placeholder="服務名稱" /><input className="input-field md:col-span-2" value={editingService.description} onChange={(event) => setEditingService({ ...editingService, description: event.target.value })} placeholder="服務說明" /><select className="input-field" value={editingService.icon} onChange={(event) => setEditingService({ ...editingService, icon: event.target.value })}><option value="sparkles">星光</option><option value="heart">愛心</option><option value="scissors">剪刀</option><option value="calendar">日曆</option></select></div><div className="flex gap-3 mt-4"><button type="button" onClick={saveService} className="btn-primary" disabled={savingService}>{savingService ? '儲存中...' : '儲存'}</button><button type="button" onClick={() => setEditingService(null)} className="btn-secondary">取消</button></div></div></div>}

      {/* Services Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            {content.services_title}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => {
              const Icon = serviceIcons[service.icon] || Sparkles
              return <div key={service.id} className="card text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><Icon className="text-primary" size={32} /></div>
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-gray-600">{service.description}</p>
                {isAdmin && <div className="flex flex-wrap justify-center gap-2 mt-4 pt-4 border-t border-gray-100"><button type="button" onClick={() => setEditingService({ ...service })} className="btn-secondary px-3 py-2 text-sm">編輯</button><button type="button" onClick={() => moveService(service.id, -1)} className="btn-secondary px-3 py-2 text-sm">上移</button><button type="button" onClick={() => moveService(service.id, 1)} className="btn-secondary px-3 py-2 text-sm">下移</button><button type="button" onClick={() => removeService(service.id)} className="text-red-600 border border-red-200 rounded-lg px-3 py-2 text-sm">移除</button></div>}
              </div>
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            {content.diary_title}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {content.diary_description}
          </p>
          <Link to="/beauty-diary" className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">
            {content.diary_button}
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">
            {content.contact_title}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center justify-center gap-3 hover:shadow-xl transition-shadow"
            >
              <span className="text-2xl">📸</span>
              <span className="font-semibold">Instagram</span>
            </a>
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center justify-center gap-3 hover:shadow-xl transition-shadow"
            >
              <span className="text-2xl">💬</span>
              <span className="font-semibold">LINE</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2024 AJ創美學苑. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
