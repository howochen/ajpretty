import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { Building2, Phone, Mail, Palette, Save } from 'lucide-react'

export default function TenantSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantData, setTenantData] = useState({
    name: '',
    subdomain: '',
    primary_color: '#c9a86c',
    secondary_color: '#f5f0e8',
    contact_phone: '',
    contact_email: '',
    line_id: '',
    instagram_id: '',
    logo_url: ''
  })

  useEffect(() => {
    loadTenantData()
  }, [])

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
          logo_url: data.logo_url || ''
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
          updated_at: new Date().toISOString()
        })
        .eq('subdomain', 'default')
      
      if (error) throw error
      
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
        <h1 className="text-3xl font-bold mb-8 text-center">工作室設定</h1>

        <div className="card">
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
                <label className="block text-sm font-medium mb-2">LINE ID</label>
                <input
                  type="text"
                  value={tenantData.line_id}
                  onChange={(e) => handleInputChange('line_id', e.target.value)}
                  className="input-field"
                  placeholder="LINE ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Instagram ID</label>
                <input
                  type="text"
                  value={tenantData.instagram_id}
                  onChange={(e) => handleInputChange('instagram_id', e.target.value)}
                  className="input-field"
                  placeholder="instagram_id"
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

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {saving ? '儲存中...' : '儲存設定'}
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 card bg-blue-50 border-blue-200">
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
        </div>
      </div>
    </div>
  )
}
