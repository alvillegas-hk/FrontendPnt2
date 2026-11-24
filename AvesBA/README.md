# 🐦 Aves BA — app de Vue

Esta carpeta es la aplicación de Vue 3 + Vite. La documentación completa (qué hace, arquitectura, rutas, stores y decisiones de diseño) está en el **[README principal](../README.md)**.

## Arranque rápido

```bash
npm install
npm run dev
```

Por defecto el front le pega a `http://localhost:8000`. Para usar el backend publicado, creá `.env.local` con:

```bash
VITE_API_BASE_URL=https://backendpnt2-production.up.railway.app
```

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Versión optimizada en `dist/` |
| `npm run preview` | Sirve `dist/` para probarlo |
| `node --test tests/connection.test.js` | Tests del conteo de tiempo conectado |

## Más documentación

- [`ESTILOS.md`](ESTILOS.md): de dónde sale cada clase, color y animación.
- [`GUIA-METRICAS.md`](GUIA-METRICAS.md): la guía paso a paso con la que se armó "Mis métricas".
