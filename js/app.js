const URL_API_BASE = 'https://pokeapi.co/api/v2';
const TARJETAS_POR_PAGINA = 15; // Cantidad de elementos por página

// Estado de la aplicación
const estado = {
  todosLosDetalles: [], // Detalles de los pokemon cargados en la vista actual
  listaUrlsPokemon: [],    // Lista completa de {name, url} para el contexto actual (filtrado)
  total: 0,         // Total de pokemon disponibles
  terminoBusqueda: '',        // Término de búsqueda actual
  tipoSeleccionado: 'all',   // Tipo seleccionado actualmente
  paginaActual: 0,        // Página actual (empieza en 0)
  cargando: true,         // Estado de carga global
  error: null            // Captura de errores de red o API
};

// Elementos del DOM seleccionados con getElementById
const contenedorResultados = document.getElementById('resultados');
const inputBusqueda = document.getElementById('busqueda-input');
const filtrosTipo = document.getElementById('type-filters');
const btnAnterior = document.getElementById('prev-btn');
const btnSiguiente = document.getElementById('next-btn');
const paginaActualDisplay = document.getElementById('current-page');
const modal = document.getElementById('pokemon-modal');
const contenidoModal = document.getElementById('modal-content');
const overlayModal = document.getElementById('modal-overlay');
const btnCerrarModal = document.getElementById('close-modal');

/**
 * Muestra los detalles de un pokemon en un modal
 */
window.mostrarDetalles = function (pokemonId) {
  const pokemon = estado.todosLosDetalles.find(p => p.id === pokemonId);
  if (!pokemon || !modal || !contenidoModal) return;

  const primaryType = pokemon.types[0].type.name;
  const imageUrl = pokemon.sprites.other['official-artwork'].front_default;

  const estadisticasBaseHTML = pokemon.stats.map(s => `
    <div class="w-full">
      <div class="flex justify-between mb-1">
        <span class="text-[10px] uppercase font-bold text-white/40 tracking-widest">${s.stat.name}</span>
        <span class="text-[10px] font-black text-primary">${s.base_stat}</span>
      </div>
      <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div class="h-full bg-primary shadow-[0_0_10px_rgba(255,203,5,0.5)]" style="width: ${Math.min(100, (s.base_stat / 150) * 100)}%"></div>
      </div>
    </div>
  `).join('');

  const habilidadesHtml = pokemon.abilities.map(a => `
    <span class="px-4 py-2 glass-card rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60">
      ${a.ability.name}
    </span>
  `).join('');

  contenidoModal.innerHTML = `
    <div class="w-full md:w-1/2 p-12 flex flex-col items-center justify-center relative">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent blur-3xl opacity-50"></div>
      <span class="absolute top-12 left-12 font-spline font-black text-white/5 text-8xl md:text-9xl tracking-tighter">#${pokemon.id.toString().padStart(3, '0')}</span>
      <img src="${imageUrl}" alt="${pokemon.name}" class="relative z-10 w-full max-w-[320px] drop-shadow-[0_35px_60px_rgba(0,0,0,0.8)] animate-fade-in">
    </div>
    <div class="w-full md:w-1/2 p-12 bg-white/5 border-l border-white/5 overflow-y-auto custom-scrollbar">
      <div class="flex flex-col gap-8">
        <div>
          <h2 class="text-5xl font-black italic tracking-tighter text-white uppercase mb-4">${pokemon.name}</h2>
          <div class="flex flex-wrap gap-2">
            ${pokemon.types.map(t => `<span class="px-6 py-2 bg-primary text-black rounded-full text-xs font-black uppercase tracking-widest">${t.type.name}</span>`).join('')}
          </div>
        </div>
        
        <div class="flex flex-col gap-4">
          <h4 class="text-xs font-black uppercase tracking-[0.3em] text-white/20">Estadísticas Base</h4>
          <div class="grid grid-cols-1 gap-4">
            ${estadisticasBaseHTML}
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <h4 class="text-xs font-black uppercase tracking-[0.3em] text-white/20">Habilidades</h4>
          <div class="flex flex-wrap gap-2">
            ${habilidadesHtml}
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-4">
            <div class="glass-card p-4 rounded-2xl flex flex-col gap-1">
                <span class="text-[9px] uppercase font-bold text-white/20 tracking-widest">Peso</span>
                <span class="text-xl font-spline font-bold text-white">${pokemon.weight / 10} kg</span>
            </div>
            <div class="glass-card p-4 rounded-2xl flex flex-col gap-1">
                <span class="text-[9px] uppercase font-bold text-white/20 tracking-widest">Altura</span>
                <span class="text-xl font-spline font-bold text-white">${pokemon.height / 10} m</span>
            </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
};

/**
 * Cierra el modal
 */
window.closeModal = function () {
  if (!modal) return;
  modal.classList.remove('flex');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
};

// Eventos para cerrar el modal
if (overlayModal) overlayModal.addEventListener('click', window.closeModal);
if (btnCerrarModal) btnCerrarModal.addEventListener('click', window.closeModal);

/**
 * Inicializa la aplicación
 */
async function inicializar() {
  await handleTypeSelection('all');
  setupEventListeners();
}

/**
 * Función que maneja el click en el botón anterior
 */
function handlePrevClick() {
  if (estado.paginaActual > 0) {
    cargarDatos(estado.paginaActual - 1);
  }
}

/**
 * Función que maneja el click en el botón siguiente
 */
function handleNextClick() {
  const totalPages = Math.ceil(estado.total / TARJETAS_POR_PAGINA);
  if (estado.paginaActual < totalPages - 1) {
    cargarDatos(estado.paginaActual + 1);
  }
}

/**
 * Función que maneja el cambio en el input de búsqueda
 */
function handleinputBusqueda(e) {
  estado.terminoBusqueda = e.target.value;
  render(); // Búsqueda rápida sobre los elementos ya cargados (limpia y vuelve a cargar)
}

/**
 * Maneja la selección de tipo (filtrado global)
 */
async function handleTypeSelection(type) {
  estado.cargando = true;
  estado.error = null; // Reiniciar estado de error
  estado.tipoSeleccionado = type;
  estado.paginaActual = 0;
  estado.terminoBusqueda = ''; // Reiniciar búsqueda al cambiar de tipo
  if (inputBusqueda) inputBusqueda.value = '';
  render();

  try {
    if (type === 'all') {
      // Para 'all', obtenemos el conteo total primero
      const response = await fetch(`${URL_API_BASE}/pokemon?limit=1`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      estado.total = data.count;
      estado.listaUrlsPokemon = [];
    } else {
      const response = await fetch(`${URL_API_BASE}/type/${type}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      // data.pokemon es un arreglo de { pokemon: { name, url } }
      estado.listaUrlsPokemon = data.pokemon.map(p => p.pokemon);
      estado.total = estado.listaUrlsPokemon.length;
    }
    await cargarDatos(0);
  } catch (error) {
    console.error('Error al manejar cambio de tipo:', error);
    estado.error = "Hubo un error al intentar filtrar por este tipo. Inténtalo de nuevo más tarde.";
    estado.cargando = false;
    render();
  }
}

/**
 * Función async cargarDatos() que hace fetch al endpoint del API elegida.
 * Maneja la lógica de paginación y obtención de detalles.
 */
async function cargarDatos(page) {
  estado.cargando = true;
  estado.error = null;
  estado.paginaActual = page;
  render();

  try {
    let urlsToFetch = [];
    const offset = page * TARJETAS_POR_PAGINA;

    if (estado.tipoSeleccionado === 'all') {
      // Orden estándar por ID/Alfabeto
      urlsToFetch = await fetchlistaUrlsPokemon(TARJETAS_POR_PAGINA, offset);
    } else {
      // Subconjunto de la lista filtrada por tipo
      urlsToFetch = estado.listaUrlsPokemon.slice(offset, offset + TARJETAS_POR_PAGINA);
    }

    // Obtener detalles de cada pokemon en paralelo (await response.json() dentro de fetchPokemonDetails)
    const details = await Promise.all(urlsToFetch.map(p => fetchPokemonDetails(p.url)));

    estado.todosLosDetalles = details;
    estado.cargando = false;

    render();
    updatePaginationUI();
  } catch (error) {
    console.error('Error al cargar la página:', error);
    estado.error = "Falla al cargar la petición de datos. Por favor verifica tu conexión.";
    estado.cargando = false;
    render();
  }
}

/**
 * Obtiene una lista básica de pokemon {name, url}
 */
async function fetchlistaUrlsPokemon(limit = 15, offset = 0) {
  const response = await fetch(`${URL_API_BASE}/pokemon?limit=${limit}&offset=${offset}`);
  const data = await response.json();
  return data.results;
}

/**
 * Obtiene los detalles específicos de un pokemon
 */
async function fetchPokemonDetails(url) {
  const response = await fetch(url);
  return await response.json();
}

/**
 * Actualiza los elementos de paginación en el DOM
 */
function updatePaginationUI() {
  const totalPages = Math.ceil(estado.total / TARJETAS_POR_PAGINA);

  if (paginaActualDisplay) paginaActualDisplay.textContent = estado.paginaActual + 1;
  const totalPagesDisplay = document.getElementById('total-pages');
  if (totalPagesDisplay) totalPagesDisplay.textContent = totalPages || 1;

  if (btnAnterior) {
    btnAnterior.disabled = estado.paginaActual === 0;
    btnAnterior.style.opacity = estado.paginaActual === 0 ? '0.3' : '1';
  }

  if (btnSiguiente) {
    btnSiguiente.disabled = estado.paginaActual >= totalPages - 1;
    btnSiguiente.style.opacity = estado.paginaActual >= totalPages - 1 ? '0.3' : '1';
  }
}

/**
 * Renderiza la cuadrícula de Pokemon en el contenedor #resultados
 * Limpia el contenedor antes de insertar.
 */
function render() {
  if (!contenedorResultados) return;

  // Limpieza implícita al asignar innerHTML o uso de mensaje de error
  if (estado.error) {
    contenedorResultados.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-32 gap-6 text-center">
        <span class="material-symbols-outlined text-secondary text-5xl">error</span>
        <p class="text-white font-bold uppercase tracking-widest text-sm">${estado.error}</p>
        <button onclick="inicializar()" class="btn-primary px-8 py-3 rounded-full text-xs">Reintentar</button>
      </div>
    `;
    return;
  }

  if (estado.cargando) {
    contenedorResultados.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-32 gap-4 animate-pulse">
        <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p class="text-white/40 font-spline uppercase tracking-widest text-xs font-bold">Iniciando escaneo biométrico...</p>
      </div>
    `;
    return;
  }

  // Filtrado local para la barra de búsqueda (sobre los 15 items actuales)
  const filtered = estado.todosLosDetalles.filter(pokemon => {
    return pokemon.name.toLowerCase().includes(estado.terminoBusqueda.toLowerCase()) ||
      pokemon.id.toString().includes(estado.terminoBusqueda);
  });

  if (filtered.length === 0) {
    contenedorResultados.innerHTML = '<div class="col-span-full text-center py-20 text-white/40 font-bold uppercase tracking-widest text-xs">No se encontraron resultados.</div>';
    return;
  }

  // Generación de tarjetas mediante template literals e inserción masiva
  contenedorResultados.innerHTML = filtered.map(pokemon => {
    const primaryType = pokemon.types[0].type.name;
    const typeConfigs = {
      fire: 'from-orange-900/20 hover:border-orange-500/50',
      water: 'from-blue-900/20 hover:border-blue-500/50',
      grass: 'from-emerald-900/20 hover:border-emerald-500/50',
      electric: 'from-yellow-900/20 hover:border-yellow-500/50',
      psychic: 'from-purple-900/20 hover:border-purple-500/50',
      poison: 'from-violet-900/20 hover:border-violet-500/50',
      normal: 'from-slate-900/20 hover:border-slate-500/50'
    };

    const colorClass = typeConfigs[primaryType] || 'from-gray-900/20 hover:border-white/20';
    const imageUrl = pokemon.sprites.other['official-artwork'].front_default;

    return `
      <div class="glass-card rounded-[2rem] p-6 flex flex-col gap-6 cursor-pointer group animate-fade-in shadow-xl" onclick="mostrarDetalles(${pokemon.id})">
        <div class="bg-gradient-to-br ${colorClass} rounded-2xl aspect-square flex items-center justify-center relative overflow-hidden transition-all duration-500">
          <span class="absolute top-4 left-6 font-spline font-black text-white/5 text-4xl">#${pokemon.id.toString().padStart(3, '0')}</span>
          <img src="${imageUrl}" alt="${pokemon.name}" class="w-40 h-40 object-contain transform group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
        </div>
        <div class="flex flex-col gap-4">
          <div>
            <h3 class="font-spline text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors capitalize">${pokemon.name}</h3>
            <div class="flex flex-wrap gap-2">
              ${pokemon.types.map(t => `
                <span class="bg-white/5 text-white/60 text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-md border border-white/10 group-hover:border-primary/30 transition-colors">
                  ${t.type.name}
                </span>
              `).join('')}
            </div>
          </div>
          <button class="btn-primary w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
            Ver Detalles
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Configuración de escuchas de eventos (addEventListener)
 */
function setupEventListeners() {
  // Evento de búsqueda (Llama a función handleinputBusqueda)
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', handleinputBusqueda);
  }

  // Eventos de filtros de tipo
  if (filtrosTipo) {
    const buttons = filtrosTipo.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Actualización puramente visual del botón activo
        buttons.forEach(b => {
          b.classList.remove('bg-primary', 'text-black');
          b.classList.add('glass-card', 'text-white/60');
        });
        btn.classList.remove('glass-card', 'text-white/60');
        btn.classList.add('bg-primary', 'text-black');

        // Llama a la función que maneja la selección global (Lógica principal)
        handleTypeSelection(btn.dataset.type || 'all');
      });
    });
  }

  // Eventos de Paginación (Llaman a funciones handlePrev/NextClick)
  if (btnAnterior) {
    btnAnterior.addEventListener('click', handlePrevClick);
  }

  if (btnSiguiente) {
    btnSiguiente.addEventListener('click', handleNextClick);
  }
}
function irABusqueda() {
  const input = document.getElementById('busqueda-input');

  if (!input) {
    console.error('No existe el input busqueda-input');
    return;
  }

  input.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });

  setTimeout(() => {
    input.focus();
  }, 500);
}

// Iniciar aplicación
inicializar();
