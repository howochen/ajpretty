import { Link } from 'react-router-dom'
import { Calendar, Sparkles, Heart, Scissors } from 'lucide-react'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-accent text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            AJ創美學苑
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            美睫｜皮膚管理｜眉型設計｜隱形眼線｜頭皮保養
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking" className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              立即預約
            </Link>
            <Link to="/beauty-diary" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors">
              查看作品
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            我們的服務
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">美睫服務</h3>
              <p className="text-gray-600">專業美睫設計，讓您的眼睛更有神</p>
            </div>
            <div className="card text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">皮膚管理</h3>
              <p className="text-gray-600">專業護膚疗程，恢復肌膚光采</p>
            </div>
            <div className="card text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scissors className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">眉型設計</h3>
              <p className="text-gray-600">量身打造適合您的完美眉型</p>
            </div>
            <div className="card text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">頭皮保養</h3>
              <p className="text-gray-600">專業頭皮護理，健康從頭開始</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            個人專屬變美日誌
          </h2>
          <p className="text-xl mb-8 opacity-90">
            您的每次蛻變，都是我們共同的驕傲
          </p>
          <Link to="/beauty-diary" className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">
            查看變美日誌
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">
            聯絡我們
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center justify-center gap-3 hover:shadow-xl transition-shadow"
            >
              <span className="text-2xl">📸</span>
              <span className="font-semibold">Instagram</span>
            </a>
            <a
              href="https://line.me"
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
