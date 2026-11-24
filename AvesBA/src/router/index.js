import { createRouter, createWebHistory } from 'vue-router'
import Login from '../vistas/Login.vue'
import Registro from '../vistas/Registro.vue'
import SeleccionModo from '../vistas/SeleccionModo.vue'
import JugarGrupo from '../vistas/JugarGrupo.vue'
import Ranking from '../vistas/Ranking.vue'
import Metricas from '../vistas/Metricas.vue'
import MetricasAdmin from '../vistas/MetricasAdmin.vue'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  { path: '/', component: Login, meta: { publica: true } },
  { path: '/registro', component: Registro, meta: { publica: true } },
  { path: '/modo', component: SeleccionModo, meta: { conMenu: true } },
  { path: '/grupo', component: JugarGrupo, meta: { conMenu: true } },
  { path: '/datos-jugador', redirect: '/modo' },
  { path: '/ranking', component: Ranking, meta: { conMenu: true } },
  { path: '/metricas', component: Metricas, meta: { conMenu: true } },
  { path: '/admin/metricas', component: MetricasAdmin, meta: { conMenu: true, soloAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.publica) return true;

  const authStore = useAuthStore();
  await authStore.cargarPerfil();

  if (!authStore.estaLogueado) return '/';
  if (to.meta.soloAdmin && !authStore.esAdmin) return '/modo';
  return true;
})

export default router