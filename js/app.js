const POKE_API_BASE = 'https://pokeapi.co/api/v2';
const ITEMS_PER_PAGE = 15; // Tarjetas por página

//Elementos del Dom 
const resultsContainer = document.getElementById('resultados');
const searchInput = document.getElementById('search-input');
const typeFilters = document.getElementById('type-filters');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const currentPageDisplay = document.getElementById('current-page');
const modal = document.getElementById('pokemon-modal');
const modalContent = document.getElementById('modal-content');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal');

const state = {
  allPokemonDetails: [], 
  pokemonUrlList: [],    
  totalCount: 0,         
  searchTerm: '',       
  selectedType: 'all',   
  currentPage: 0,        
  loading: true,        
  error: null            
};

//Inicializar la aplicación
async function init() {
  await handleTypeSelection('all');
  setupEventListeners();
}

//Mostrar Modal
window.showDetails = function (pokemonId) {
  const pokemon = state.allPokemonDetails.find(p => p.id === pokemonId);
  if (!pokemon || !modal || !modalContent) return;

  const primaryType = pokemon.types[0].type.name;
  const imageUrl = pokemon.sprites.other['official-artwork'].front_default;

  const statsHtml = pokemon.stats.map(s => `
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

  const abilitiesHtml = pokemon.abilities.map(a => `
    <span class="px-4 py-2 glass-card rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/60">
      ${a.ability.name}
    </span>
  `).join('');

  modalContent.innerHTML = `
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
            ${statsHtml}
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <h4 class="text-xs font-black uppercase tracking-[0.3em] text-white/20">Habilidades</h4>
          <div class="flex flex-wrap gap-2">
            ${abilitiesHtml}
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

//Función Cerrar Modal
window.closeModal = function () {
  if (!modal) return;
  modal.classList.remove('flex');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
};

//Eeventos para cerrar modal
if (modalOverlay) modalOverlay.addEventListener('click', window.closeModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', window.closeModal);
