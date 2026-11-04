<script setup>
// Marco común de las pantallas internas: barra superior + menú lateral.
// Es el mismo patrón que el MainLayout de la clase 8: el contenido de
// cada pantalla entra por el <slot>. Qué rutas lo usan se decide en
// router/index.js con meta: { conMenu: true }.
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// En celular el menú lateral se esconde y se abre con el botón ☰ de la barra
const menuAbierto = ref(false);
const cerrandoSesion = ref(false);
const errorSesion = ref('');

// Trae los datos del jugador para mostrar su nombre en la barra
onMounted(() => {
  if (!authStore.jugador) authStore.cargarPerfil();
});

// Invalida la sesión en el servidor y vuelve al Login
// (antes estaba en SeleccionModo; ahora el botón vive en la barra)
async function cerrarSesion() {
  if (cerrandoSesion.value) return;
  cerrandoSesion.value = true;
  errorSesion.value = '';
  try {
    await authStore.cerrarSesion();
    router.push('/');
  } catch {
    errorSesion.value = 'No se pudo guardar tu tiempo. Volvé a intentar cerrar sesión.';
  } finally { cerrandoSesion.value = false; }
}
</script>

<template>
  <div class="av-layout">
    <!-- Barra superior. Clases de Bulma: navbar, navbar-brand, navbar-item -->
    <nav class="navbar av-barra" role="navigation" aria-label="Navegación principal">
      <div class="navbar-brand av-barra-contenido">
        <router-link to="/modo" class="navbar-item av-marca">
          <span class="av-marca-icono">🐦</span> Aves BA
        </router-link>

        <div class="navbar-item ml-auto av-barra-acciones">
          <span v-if="authStore.jugador" class="mr-4 is-hidden-mobile av-saludo">
            Hola, <strong class="av-saludo">{{ authStore.jugador.nombre }}</strong>
          </span>
          <!-- Lugar vacío: SeleccionModo pone acá el botón "Modo" (solo en celular) con <Teleport> -->
          <span id="av-lugar-boton-modos"></span>
          <button type="button" class="button is-light av-elevable av-boton-salir" :disabled="cerrandoSesion" @click="cerrarSesion">
            Cerrar sesión
          </button>
        </div>

        <!-- Botón ☰ para abrir el menú en celular (navbar-burger: Bulma; is-hidden-tablet: solo en celular) -->
        <a role="button" class="navbar-burger is-hidden-tablet av-hamburguesa" :class="{ 'is-active': menuAbierto }"
          aria-label="Abrir el menú" :aria-expanded="menuAbierto" @click="menuAbierto = !menuAbierto">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
    </nav>

    <!-- Cuerpo: columnas de Bulma. En celulares se apilan solas. -->
    <section class="section av-cuerpo">
      <p v-if="errorSesion" role="alert" class="notification is-danger is-light">{{ errorSesion }}</p>
      <div class="columns">
        <!-- Menú lateral. Clases de Bulma: box, menu, menu-label, menu-list.
             active-class="is-active" hace que Bulma pinte el link de la página actual. -->
        <!-- is-narrow-desktop (Bulma): en PC la columna mide lo que necesita su contenido.
             En celular, is-hidden-mobile esconde el menú hasta que se toca el ☰.
             Al elegir una opción (@click) se vuelve a cerrar. -->
        <aside class="column is-3-tablet is-narrow-desktop av-lateral">
          <div class="box menu av-menu" :class="{ 'is-hidden-mobile': !menuAbierto }" @click="menuAbierto = false">
            <p class="menu-label">Jugar</p>
            <ul class="menu-list">
              <li><router-link to="/modo" active-class="is-active">🎯 Jugar individual</router-link></li>
              <li><router-link to="/grupo" active-class="is-active">👥 Jugar en grupo</router-link></li>
            </ul>
            <p class="menu-label">Mi cuenta</p>
            <ul class="menu-list">
              <li><router-link to="/datos-jugador" active-class="is-active">🪪 Datos del jugador</router-link></li>
              <li><router-link to="/ranking" active-class="is-active">🏆 Ranking</router-link></li>
              <li><router-link to="/metricas" active-class="is-active">📊 Métricas</router-link></li>
            </ul>

            <template v-if="authStore.esAdmin">
              <p class="menu-label">Administración</p>
              <ul class="menu-list">
                <li><router-link to="/admin/metricas" active-class="is-active">🛠️ Panel admin</router-link></li>
              </ul>
            </template>
          </div>

          <!-- Lugar vacío: SeleccionModo pone acá los modos de juego con <Teleport>.
               En PC quedan debajo del menú; en celular, arriba del juego. -->
          <div id="av-lugar-modos"></div>
        </aside>

        <!-- Acá entra cada pantalla -->
        <main class="column">
          <slot></slot>
        </main>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* De dónde sale cada estilo de este archivo:
   - Estructura y aspecto base: clases de Bulma del template (navbar, section,
     columns, box, menu, button, is-*, has-*, ml-*, mr-*).
   - Colores: variables de src/estilos/tema.css (var(--color-...)).
   - Lo propio de esta pantalla: las clases "av-" de abajo. */

.av-layout {
  min-height: 100vh;
}

/* Barra superior verde bosque, con una línea dorada abajo */
.av-barra {
  background-color: var(--color-bosque);
  border-bottom: 4px solid var(--color-dorado);
  box-shadow: var(--sombra-suave);
}
.av-barra-contenido {
  width: 100%;
  color: var(--color-crema);
}
.av-marca {
  font-family: var(--fuente-titulos);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-crema);
}
.av-marca:hover {
  background-color: transparent;
  color: var(--color-dorado);
}
/* Saludo al jugador: crema, para que se lea sobre el verde */
.av-saludo {
  color: var(--color-crema);
}
.av-marca-icono {
  margin-right: 0.4rem;
}

.av-cuerpo {
  padding-top: 1.5rem;
}

/* Menú lateral: el link activo en verde musgo (pisa el color de Bulma) */
.av-menu .menu-list a.is-active {
  background-color: var(--color-musgo);
  color: white;
}
.av-menu .menu-list a:not(.is-active):hover {
  background-color: rgba(134, 146, 102, 0.18); /* salvia transparente */
}

/* En celulares (menos de 769px, el mismo corte que usa Bulma) el menú pasa
   a ser una fila compacta de botones, para no tapar el juego. */
@media (max-width: 768px) {
  /* Sin el relleno de la columna, para no dejar un hueco cuando el menú está cerrado */
  .av-lateral {
    padding-top: 0;
    padding-bottom: 0;
  }
  .av-menu {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.5rem;
  }
  .av-menu .menu-label {
    display: none;
  }
  .av-menu .menu-list {
    display: contents;
  }
  .av-menu .menu-list a {
    padding: 0.35rem 0.6rem;
    font-size: 0.85rem;
  }
}

/* "Cerrar sesión": chico en celular y tablet; en PC se agranda (ver abajo) */
.av-boton-salir {
  font-size: 0.85rem;
}

/* En celulares angostos (375px) la barra tiene que hacer lugar para la marca,
   el botón "Modo", "Cerrar sesión" y el ☰: todo un poco más apretado. */
@media (max-width: 768px) {
  .av-marca {
    font-size: 1.25rem;
    padding-left: 0.5rem;
    padding-right: 0.25rem;
  }
  .av-barra-acciones {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }
  .av-boton-salir {
    padding-left: 0.7em;
    padding-right: 0.7em;
  }
}

/* Botón ☰ en crema, para que se vea sobre el verde */
.av-hamburguesa {
  color: var(--color-crema);
}

/* En pantallas grandes (desde 1024px, el corte "desktop" de Bulma) todo
   un poco más grande: barra más alta, marca, saludo, botón y menú. */
@media (min-width: 1024px) {
  .av-barra {
    min-height: 3.5rem;
  }
  .av-marca {
    font-size: 1.65rem;
  }
  .av-marca-icono {
    font-size: 1.75rem;
  }
  .av-saludo {
    font-size: 1.05rem;
  }
  .av-boton-salir {
    font-size: 0.95rem;
  }
  .av-menu {
    font-size: 1.1rem;
  }
  /* Cada opción del menú en un solo renglón ("Datos del jugador") */
  .av-menu .menu-list a {
    white-space: nowrap;
  }
  .av-menu .menu-label {
    font-size: 0.85rem;
  }
}
</style>
