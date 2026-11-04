const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';


async function hacerRequest(endpoint, opciones = {}) {
  const {
    metodo = 'GET',
    datos = null,
    headers = {}
  } = opciones;

  const url = `${API_BASE_URL}${endpoint}`;

  const headersBase = {
    'Content-Type': 'application/json',
  }; // header base 

  // Combinar headers
  const headersFinales = { ...headersBase, ...headers };

  // Configurar opciones de fetch
  const opcionesRequest = {
    method: metodo,
    headers: headersFinales,
    credentials: 'include', // include cookies
  };

  // Agregar body si hay datos
  if (datos) {
    opcionesRequest.body = JSON.stringify(datos);
  }

  try {
    const response = await fetch(url, opcionesRequest);

    // Manejar errores HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // El backend manda "detail" como texto, o como lista cuando los datos son inválidos (422)
      const detalle = errorData.detail;
      const mensaje = typeof detalle === 'string' ? detalle : detalle?.[0]?.msg;
      const error = new Error(
        mensaje ||
        errorData.mensaje ||
        `Error ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      throw error;
    }

    // Parsear y retornar respuesta
    const respuesta = await response.json();
    return respuesta;

  } catch (error) {
    console.error(`Error en request a ${url}:`, error);
    throw error;
  }
}


const http = {
  get: (endpoint, opciones) =>
    hacerRequest(endpoint, { ...opciones, metodo: 'GET' }),

  post: (endpoint, datos, opciones) =>
    hacerRequest(endpoint, { ...opciones, datos, metodo: 'POST' }),

  put: (endpoint, datos, opciones) =>
    hacerRequest(endpoint, { ...opciones, datos, metodo: 'PUT' }),

  delete: (endpoint, opciones) =>
    hacerRequest(endpoint, { ...opciones, metodo: 'DELETE' }),
};

export { http, API_BASE_URL };