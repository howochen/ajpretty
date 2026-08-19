import { useState } from 'react'
import { Heart, Calendar, Sparkles, Star } from 'lucide-react'

const diaryEntries = [
  {
    id: 1,
    title: '自然款美睫 - 讓眼睛更有神',
    category: '美睫',
    date: '2024年8月15日',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop',
    description: '這位客人想要自然不造作的效果，我們選擇了適合她眼型的捲翹度，讓眼睛看起來更有神卻不誇張。',
    tags: ['自然款', '美睫', '日常妝']
  },
  {
    id: 2,
    title: '霧眉設計 - 完美眉型',
    category: '眉型設計',
    date: '2024年8月10日',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=300&fit=crop',
    description: '為客人設計適合臉型的霧眉，修飾原本稀疏的眉型，讓整體五官更加立體。',
    tags: ['霧眉', '眉型設計', '持久妝']
  },
  {
    id: 3,
    title: '皮膚管理 - 恢復肌膚光采',
    category: '皮膚管理',
    date: '2024年8月5日',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop',
    description: '針對乾燥肌膚進行深層保養，經過一連串的護膚程序，肌膚恢復了光采與彈性。',
    tags: ['保濕', '皮膚管理', '深層保養']
  },
  {
    id: 4,
    title: '隱形眼線 - 自然放大雙眼',
    category: '隱形眼線',
    date: '2024年7月28日',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop',
    description: '隱形眼線讓雙眼自然放大，不需每天畫眼線也能擁有神采奕奕的眼神。',
    tags: ['隱形眼線', '持久妝', '自然']
  },
  {
    id: 5,
    title: '頭皮保養 - 健康從頭開始',
    category: '頭皮保養',
    date: '2024年7月20日',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&h=300&fit=crop',
    description: '專業頭皮檢測與保養，改善頭皮環境，讓髮絲從根部開始健康生長。',
    tags: ['頭皮保養', '健康', '護髮']
  },
  {
    id: 6,
    title: '娃娃款美睫 - 可愛風格',
    category: '美睫',
    date: '2024年7月15日',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=300&fit=crop',
    description: '娃娃款美睫讓眼睛圓潤可愛，適合喜歡韓系妝容的客人。',
    tags: ['娃娃款', '美睫', '韓系']
  }
]

const categories = ['全部', '美睫', '皮膚管理', '眉型設計', '隱形眼線', '頭皮保養']

export default function BeautyDiary() {
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [selectedEntry, setSelectedEntry] = useState(null)

  const filteredEntries = selectedCategory === '全部' 
    ? diaryEntries 
    : diaryEntries.filter(entry => entry.category === selectedCategory)

  return (
    <div className="min-h-screen bg-secondary py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">個人專屬變美日誌</h1>
          <p className="text-gray-600">您的每次蛻變，都是我們共同的驕傲</p>
        </div>

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
            <h2 className="text-2xl font-bold mb-4">準備開始您的變美之旅？</h2>
            <p className="mb-6 opacity-90">立即預約，讓我們為您打造專屬美麗</p>
            <button
              onClick={() => window.location.href = '/booking'}
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              立即預約
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
