import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 若是 vue 請維持 vue 插件

export default defineConfig({
  plugins: [react()],
  base: '/ajpretty/', // 加上這行（對應你的 Repo 名稱）
})