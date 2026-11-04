import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../src/stores/auth.js'

const storage = new Map()
let requests
let fail
beforeEach(() => {
  setActivePinia(createPinia())
  storage.clear()
  requests = []
  fail = false
  globalThis.sessionStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  }
  globalThis.fetch = async (url, options) => {
    requests.push({ url, ...options })
    if (fail) return { ok: false, status: 503, json: async () => ({ detail: 'offline' }) }
    return { ok: true, json: async () => url.endsWith('/users/me') ? { id: 'ana', nombre: 'Ana' } : {} }
  }
})

test('recupera perfil e inicia una sola vez el conteo', async () => {
  const store = useAuthStore()
  await store.cargarPerfil()
  assert.ok(store.horaIngreso)
  store.horaIngreso = Date.now() - 5000
  const inicio = store.horaIngreso
  await store.cargarPerfil()
  assert.equal(store.horaIngreso, inicio)
})

test('conserva el mismo intervalo al reintentar después de una recarga', async () => {
  const store = useAuthStore()
  await store.cargarPerfil()
  store.horaIngreso = Date.now() - 5000
  fail = true
  await assert.rejects(store.registrarTiempoConectado({ detener: true }))
  const pendiente = JSON.parse(JSON.stringify(store.pendientes[0]))
  setActivePinia(createPinia())
  fail = false
  const nuevo = useAuthStore()
  await nuevo.cargarPerfil()
  assert.deepEqual(JSON.parse(JSON.stringify(nuevo.pendientes[0])), pendiente)
  await nuevo.registrarTiempoConectado()
  assert.equal(nuevo.pendientes.length, 0)
  assert.ok(requests.some(r => r.body === JSON.stringify(pendiente)))
})

test('espera el registro antes del logout y detiene el conteo', async () => {
  const store = useAuthStore()
  await store.cargarPerfil()
  store.horaIngreso = Date.now() - 1000
  await store.cerrarSesion()
  assert.ok(requests.findIndex(r => r.url.endsWith('/user-connection-log')) < requests.findIndex(r => r.url.endsWith('/auth/logout')))
  assert.equal(store.horaIngreso, null)
  assert.equal(store.jugador, null)
})

test('si falla el registro no cierra sesión y permite reintentar', async () => {
  const store = useAuthStore()
  await store.cargarPerfil()
  store.horaIngreso = Date.now() - 1000
  fail = true
  await assert.rejects(store.cerrarSesion())
  assert.ok(store.jugador)
  assert.ok(store.horaIngreso)
  assert.equal(requests.some(r => r.url.endsWith('/auth/logout')), false)
})
