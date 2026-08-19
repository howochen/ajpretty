import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 若是 vue 請維持 vue 插件

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/ajpretty/' : '/',
}))