<script setup>
import VueApexCharts from 'vue3-apexcharts';
import { obtenerMisMetricas, obtenerRanking } from '../servicios/metricasService.js';
import { color, fuente } from '../estilos/graficos.js';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';

const authStore = useAuthStore();
let intervalo;
let actualizando = false;
const errorTiempo = ref('');
async function actualizarTiempo() {
  if (actualizando) return;
  actualizando = true;
  try {
    await authStore.registrarTiempoConectado();
    metricas.value = await obtenerMisMetricas();
    errorTiempo.value = '';
  } catch (err) {
    errorTiempo.value = 'No se pudo actualizar el tiempo conectado. Se reintentará automáticamente.';
  } finally { actualizando = false; }
}
onUnmounted(() => clearInterval(intervalo));

const metricas = ref(null);
const ranking = ref([]);
const cargando = ref(true);
const error = ref('');

onMounted(async () => {
  intervalo = setInterval(actualizarTiempo, 15000);
  try {
    await authStore.registrarTiempoConectado().catch(() => {});
    metricas.value = await obtenerMisMetricas();
    ranking.value = await obtenerRanking(5);
  } catch (err) {
    error.value = err.message;
  } finally {
    cargando.value = false;
  }
});


const fallos = computed(() => {
  if (!metricas.value) return 0;
  return metricas.value.total_intentos - metricas.value.total_aciertos;
});

const sinPartidas = computed(() => metricas.value?.total_intentos === 0);


const serieDona = computed(() => [metricas.value?.total_aciertos ?? 0, fallos.value]);


const seriePrecision = computed(() => [metricas.value?.porcentaje_acierto ?? 0]);

const jugadoresComparados = computed(() => {
  if (!metricas.value) return [];
  const estoyEnElTop = ranking.value.some(j => j.user_id === metricas.value.user_id);
  if (estoyEnElTop) return ranking.value;
  return [
    ...ranking.value,
    { user_id: metricas.value.user_id, nombre: metricas.value.nombre, puntos_totales: metricas.value.puntuacion_total },
  ];
});

const serieComparacion = computed(() => [
  { name: 'Puntos', data: jugadoresComparados.value.map(j => j.puntos_totales) },
]);
// color() y fuente() leen la paleta de src/estilos/tema.css (ver src/estilos/graficos.js).

const opcionesDona = {
  chart: { fontFamily: fuente() },
  labels: ['Aciertos', 'Fallos'],
  colors: [color('hoja'), color('terracota')],
  legend: { position: 'bottom' },
  plotOptions: {
    pie: { donut: { size: '62%', labels: { show: true, total: { show: true, label: 'Respuestas' } } } },
  },
};

const opcionesPrecision = {
  chart: { fontFamily: fuente() },
  labels: ['Precisión'],
  colors: [color('musgo')],
  plotOptions: {
    radialBar: {
      hollow: { size: '62%' },
      track: { background: color('crema') },
      dataLabels: {
        name: { offsetY: 22, color: color('texto-suave') },
        value: { offsetY: -12, fontSize: '30px', fontWeight: 700, formatter: valor => `${Math.round(valor)}%` },
      },
    },
  },
};


const opcionesComparacion = computed(() => ({
  chart: { fontFamily: fuente(), toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 6, distributed: true } },
  
  colors: jugadoresComparados.value.map(j => (j.user_id === metricas.value?.user_id ? color('dorado') : color('musgo'))),
  xaxis: { categories: jugadoresComparados.value.map(j => j.nombre) },
  legend: { show: false },
  tooltip: { y: { formatter: valor => `${valor} puntos` } },
}));
const formatearTiempo = segundos => {
  if (segundos == null) return '—';
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  if (horas === 0) return `${minutos} min`;
  return `${horas} h ${minutos} min`;
};
</script>



<template>
  <div class="av-metricas">
    <h1 class="title is-3">Mis métricas</h1>

    <progress v-if="cargando" class="progress is-small is-primary" max="100"></progress>

    <p v-else-if="error" class="notification is-danger is-light">{{ error }}</p>

    <div v-if="!cargando && !error && sinPartidas" class="box has-text-centered">
      <p class="is-size-1">🐣</p>
      <p class="title is-5">Todavía no jugaste ninguna partida</p>
      <router-link to="/modo" class="button is-primary av-elevable">Jugar mi primera partida</router-link>
    </div>

    <template v-if="!cargando && !error && metricas">
      <p v-if="errorTiempo" class="notification is-warning is-light">{{ errorTiempo }}</p>
      <div class="columns is-multiline">
        <div class="column is-6-tablet is-4-desktop">
          <div class="box av-kpi">
            <p class="heading">Puntos</p>
            <p class="title is-3">⭐ {{ metricas.puntuacion_total }}</p>
          </div>
        </div>
        <div class="column is-6-tablet is-4-desktop">
          <div class="box av-kpi">
            <p class="heading">Posición en el ranking</p>
            <p class="title is-3">🏆 #{{ metricas.posicion_ranking }}</p>
          </div>
        </div>
        <div class="column is-6-tablet is-4-desktop">
          <div class="box av-kpi">
            <p class="heading">Precisión</p>
            <p class="title is-3">🎯 {{ Math.round(metricas.porcentaje_acierto) }}%</p>
          </div>
        </div>
                <div class="column is-6-tablet is-4-desktop">
          <div class="box av-kpi">
            <p class="heading">Respuestas</p>
            <p class="title is-3">🐦 {{ metricas.total_intentos }}</p>
          </div>
        </div>
        <div class="column is-6-tablet is-4-desktop">
          <div class="box av-kpi">
            <p class="heading">Tiempo conectado hoy</p>
            <p class="title is-3">⏱️ {{ formatearTiempo(metricas.tiempo_conectado_hoy_seg) }}</p>
          </div>
        </div>
        <div class="column is-6-tablet is-4-desktop">
          <div class="box av-kpi">
            <p class="heading">Tiempo conectado total</p>
            <p class="title is-3">⌛ {{ formatearTiempo(metricas.tiempo_conectado_total_seg) }}</p>
          </div>
        </div>
      </div>

      <div v-if="!sinPartidas" class="columns">
        <div class="column is-6">
          <div class="box">
            <h2 class="title is-5">Aciertos y fallos</h2>
            <VueApexCharts type="donut" height="280" :series="serieDona" :options="opcionesDona" />
          </div>
        </div>
        <div class="column is-6">
          <div class="box">
            <h2 class="title is-5">Precisión</h2>
            <VueApexCharts type="radialBar" height="280" :series="seriePrecision" :options="opcionesPrecision" />
          </div>
        </div>
      </div>

      <div v-if="!sinPartidas" class="box">
        <h2 class="title is-5">Vos contra el top 5</h2>
        <VueApexCharts type="bar" height="300" :series="serieComparacion" :options="opcionesComparacion" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.av-kpi {
  height: 100%;
  text-align: center;
  border-top: 5px solid var(--color-musgo);
}
.av-kpi .heading {
  color: var(--color-texto-suave);
}
</style>