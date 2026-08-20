import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

export const defaultCourses = [
  { id: 'course-1', title: '專業美睫初級課程', description: '從零開始學習專業美睫技術，包含理論與實作', duration: '3天', price: 25000, deposit: 5000, maxStudents: 6, currentStudents: 4, dates: ['2024年10月5-7日', '2024年11月2-4日'], level: '初級' },
  { id: 'course-2', title: '皮膚管理進階課程', description: '深入學習皮膚管理知識與實務操作', duration: '5天', price: 45000, deposit: 10000, maxStudents: 8, currentStudents: 6, dates: ['2024年10月12-16日'], level: '進階' },
  { id: 'course-3', title: '眉型設計專業課程', description: '掌握眉型設計精髓，打造完美眉型', duration: '2天', price: 18000, deposit: 4000, maxStudents: 4, currentStudents: 2, dates: ['2024年10月19-20日', '2024年11月9-10日'], level: '中級' }
]

export const defaultDiaryEntries = [
  { id: 'diary-1', title: '自然款美睫 - 讓眼睛更有神', category: '美睫', date: '2024年8月15日', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop', description: '這位客人想要自然不造作的效果，我們選擇了適合她眼型的捲翹度，讓眼睛看起來更有神卻不誇張。', tags: ['自然款', '美睫', '日常妝'] },
  { id: 'diary-2', title: '霧眉設計 - 完美眉型', category: '眉型設計', date: '2024年8月10日', image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop', description: '為客人設計適合臉型的霧眉，修飾原本稀疏的眉型，讓整體五官更加立體。', tags: ['霧眉', '眉型設計', '持久妝'] },
  { id: 'diary-3', title: '皮膚管理 - 恢復肌膚光采', category: '皮膚管理', date: '2024年8月5日', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop', description: '針對乾燥肌膚進行深層保養，經過一連串的護膚程序，肌膚恢復了光采與彈性。', tags: ['保濕', '皮膚管理', '深層保養'] }
]

export const defaultServices = [
  { id: 'service-1', name: '美睫服務', description: '專業美睫設計，讓您的眼睛更有神', icon: 'sparkles' },
  { id: 'service-2', name: '皮膚管理', description: '專業護膚療程，恢復肌膚光采', icon: 'heart' },
  { id: 'service-3', name: '眉型設計', description: '量身打造適合您的完美眉型', icon: 'scissors' },
  { id: 'service-4', name: '頭皮保養', description: '專業頭皮護理，健康從頭開始', icon: 'calendar' }
]

export const defaultBookingServices = [
  { id: 'booking-service-1', name: '美睫服務', price: 1200, duration: 90 },
  { id: 'booking-service-2', name: '皮膚管理', price: 2500, duration: 60 },
  { id: 'booking-service-3', name: '眉型設計', price: 1800, duration: 45 },
  { id: 'booking-service-4', name: '隱形眼線', price: 3000, duration: 120 },
  { id: 'booking-service-5', name: '頭皮保養', price: 2000, duration: 60 }
]

const defaultTenant = {
  name: 'AJ創美學苑',
  subdomain: 'default',
  primary_color: '#c9a86c',
  secondary_color: '#f5f0e8',
  logo_url: '',
  contact_phone: '',
  contact_email: '',
  line_id: '',
  instagram_id: '',
  business_hours: {},
  site_content: {
    nav_home: '首頁', nav_booking: '線上預約', nav_my_bookings: '我的預約', nav_courses: '課程報名', nav_diary: '變美日誌',
    hero_title: 'AJ創美學苑', hero_subtitle: '美睫｜皮膚管理｜眉型設計｜隱形眼線｜頭皮保養', hero_primary_button: '立即預約', hero_secondary_button: '查看作品',
    services_title: '我們的服務', diary_title: '個人專屬變美日誌', diary_description: '您的每次蛻變，都是我們共同的驕傲', diary_button: '查看變美日誌', contact_title: '聯絡我們',
    booking_service_title: '選擇服務', booking_service_description: '請先選擇服務類別', booking_teacher_title: '選擇老師', booking_teacher_description: '選擇指定老師（費用依老師職級加價）', booking_date_title: '選擇日期與時段', booking_date_description: '選擇日期下方的可預約時段'
    ,courses_title: '課程報名', courses_description: '提升專業技能，開啟美業新篇章', course_notices: ['報名後請於規定時間內完成訂金匯款，逾期將取消報名資格', '訂金匯款後請保留匯款收據，並回報後五碼以完成報名手續', '課程開始前7天可申請改期，需支付手續費 NT$ 500', '課程開始前3天內不接受改期或退費', '如因不可抗力因素取消課程，將全額退費', '課程包含教材與實作用品，學員需自備筆記本'], diary_page_title: '個人專屬變美日誌', diary_page_description: '您的每次蛻變，都是我們共同的驕傲', diary_cta_title: '準備開始您的變美之旅？', diary_cta_description: '立即預約，讓我們為您打造專屬美麗', diary_cta_button: '立即預約', my_bookings_title: '我的預約', my_bookings_search_title: '查詢預約紀錄', my_bookings_search_description: '請輸入您的手機號碼查詢預約紀錄', services: defaultServices, booking_services: defaultBookingServices, courses: defaultCourses, diary_entries: defaultDiaryEntries
  }
}

const TenantContext = createContext({ tenant: defaultTenant, refreshTenant: async () => {}, saveSiteContent: async () => false })

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(defaultTenant)

  const refreshTenant = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', 'default')
      .maybeSingle()

    if (!error && data) setTenant({ ...defaultTenant, ...data, site_content: { ...defaultTenant.site_content, ...(data.site_content || {}) } })
  }

  const saveSiteContent = async (siteContent) => {
    const { error } = await supabase
      .from('tenants')
      .update({ site_content: siteContent, updated_at: new Date().toISOString() })
      .eq('subdomain', 'default')

    if (error) throw error
    setTenant((current) => ({ ...current, site_content: { ...current.site_content, ...siteContent } }))
    return true
  }

  useEffect(() => {
    refreshTenant()
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', tenant.primary_color || defaultTenant.primary_color)
    document.documentElement.style.setProperty('--color-secondary', tenant.secondary_color || defaultTenant.secondary_color)
    document.title = tenant.name || defaultTenant.name
  }, [tenant])

  return <TenantContext.Provider value={{ tenant, refreshTenant, saveSiteContent }}>{children}</TenantContext.Provider>
}

export function useTenant() {
  return useContext(TenantContext)
}
