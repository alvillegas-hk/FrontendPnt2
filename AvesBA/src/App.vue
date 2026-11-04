<script setup>
import { onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import LayoutPrincipal from './components/LayoutPrincipal.vue'

const route = useRoute()
const authStore = useAuthStore()

const guardar = () => authStore.registrarTiempoConectado().catch(error => {
  console.warn('El tiempo pendiente se reintentará guardar', error)
})
const alSalir = () => authStore.registrarTiempoConectado({ beacon: true, detener: true })
const alVolver = () => { authStore.iniciarConteo(); guardar() }
const alCambiarVisibilidad = () => {
  if (document.visibilityState === 'hidden') {
    authStore.registrarTiempoConectado({ beacon: true })
  } else {
    alVolver()
  }
}
const intervalo = window.setInterval(guardar, 30000)
window.addEventListener('pagehide', alSalir)
window.addEventListener('pageshow', alVolver)
document.addEventListener('visibilitychange', alCambiarVisibilidad)

onUnmounted(() => {
  alSalir()
  window.clearInterval(intervalo)
  window.removeEventListener('pagehide', alSalir)
  window.removeEventListener('pageshow', alVolver)
  document.removeEventListener('visibilitychange', alCambiarVisibilidad)
})
</script>

<template>
  <!-- Pantallas internas (las que tienen meta.conMenu en el router): van dentro del layout.
       <Transition name="pagina"> anima el cambio de pantalla (ver estilos/animaciones.css). -->
  <LayoutPrincipal v-if="route.meta.conMenu">
    <router-view v-slot="{ Component }">
      <Transition name="pagina" mode="out-in">
        <component :is="Component" />
      </Transition>
    </router-view>
  </LayoutPrincipal>

  <!-- Login y Registro: pantalla completa, sin menú -->
  <router-view v-else v-slot="{ Component }">
    <Transition name="pagina" mode="out-in">
      <component :is="Component" />
    </Transition>
  </router-view>
</template>
