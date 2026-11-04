import { defineStore } from 'pinia'
import { login as loginService, obtenerPerfil, logout } from '../servicios/authService.js'
import { API_BASE_URL, http } from '../servicios/httpClient.js'

let envioEnCurso = null
const MAX_TRAMO = 86400000

export const useAuthStore = defineStore('auth', {
  state: () => ({
    jugador: null,
    cargando: true,
    error: '',
    horaIngreso: null,
    pendientes: [],
  }),
  getters: {
    estaLogueado: state => state.jugador !== null,
    nombreCompleto: state => state.jugador ? `${state.jugador.nombre} ${state.jugador.apellido}` : '',
    esAdmin: state => ['admin', 'moderador'].includes(state.jugador?.role),
  },
  actions: {
    guardarPendientes() {
      if (!this.jugador) return
      try {
        sessionStorage.setItem(`conexion:${this.jugador.id}`, JSON.stringify(this.pendientes))
      } catch (error) {
        console.warn('No se pudieron conservar los intervalos pendientes', error)
      }
    },
    iniciarConteo() {
      if (this.jugador && this.horaIngreso === null) this.horaIngreso = Date.now()
    },
    async cargarPerfil() {
      this.cargando = true
      this.error = ''
      try {
        const jugador = await obtenerPerfil()
        if (this.jugador?.id !== jugador.id) {
          this.horaIngreso = null
          try {
            this.pendientes = JSON.parse(sessionStorage.getItem(`conexion:${jugador.id}`) || '[]')
          } catch {
            this.pendientes = []
          }
        }
        this.jugador = jugador
        this.iniciarConteo()
      } catch (err) {
        this.error = err.message
        if (err.status === 401 || err.status === 403) {
          this.capturarTramo()
          this.horaIngreso = null
          this.jugador = null
        }
      } finally {
        this.cargando = false
      }
    },
    capturarTramo() {
      if (!this.jugador || this.horaIngreso === null) return
      const fin = Date.now()
      // Dividir sesiones largas para respetar el máximo del endpoint.
      while (this.horaIngreso < fin) {
        const inicio = this.horaIngreso
        const finTramo = Math.min(fin, inicio + MAX_TRAMO)
        this.pendientes.push({
          registroId: crypto.randomUUID(),
          inicioMs: inicio,
          finMs: finTramo,
          tiempoConectado: finTramo - inicio,
        })
        this.horaIngreso = finTramo
      }
      this.guardarPendientes()
    },
    registrarTiempoConectado({ beacon = false, detener = false } = {}) {
      this.capturarTramo()
      if (detener) this.horaIngreso = null
      if (!this.jugador) return Promise.resolve()
      if (beacon) {
        // Conservar hasta confirmar por HTTP: aceptar el beacon no confirma persistencia.
        for (const tramo of this.pendientes) {
          navigator.sendBeacon(`${API_BASE_URL}/api/user-connection-log`, JSON.stringify(tramo))
        }
        return Promise.resolve()
      }
      if (envioEnCurso) return envioEnCurso
      envioEnCurso = (async () => {
        while (this.pendientes.length) {
          const tramo = this.pendientes[0]
          await http.post('/api/user-connection-log', tramo)
          this.pendientes.shift()
          this.guardarPendientes()
        }
      })().finally(() => { envioEnCurso = null })
      return envioEnCurso
    },
    async cerrarSesion() {
      // Si falla el guardado, mantener la sesión para permitir reintentar.
      await this.registrarTiempoConectado({ detener: true }).catch(error => {
        this.iniciarConteo()
        throw error
      })
      await logout()
      this.jugador = null
      this.pendientes = []
    },
    async login(email, password) {
      await loginService(email, password)
      await this.cargarPerfil()
    },
  },
})
