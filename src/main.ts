import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'
import { useAuthStore } from './stores/auth'
import { getCurrentUser } from './modules/auth/services/auth.service'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const auth = useAuthStore()
auth.initFromStorage()

async function bootstrap() {
  // Se há token persistido, restaura o usuário da sessão antes de montar,
  // para que os guards e o header tenham role/nome disponíveis já na primeira navegação.
  // Se o token estiver expirado, o interceptor tenta o refresh automático; se falhar, limpamos a sessão.
  if (auth.isAuthenticated) {
    try {
      const user = await getCurrentUser()
      auth.setUser(user)
    } catch {
      auth.clear()
    }
  }
  app.mount('#app')
}

bootstrap()
