/**
 * app.js — PokéDex
 * Taller Ingeniería Web 2026
 * Consume la PokéAPI para mostrar, buscar y filtrar pokémon.
 */

// URL base de la API
const API_BASE = "https://pokeapi.co/api/v2";

// Cuántos pokémon mostrar por página
const PAGE_SIZE = 20;

// Total de pokémon en la API y páginas resultantes
const TOTAL_POKEMON = 1025;
const TOTAL_PAGES = Math.ceil(TOTAL_POKEMON / PAGE_SIZE);

// Nombres más legibles para las estadísticas
const STAT_LABELS = {
  hp: "HP",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "Sp. Atq",
  "special-defense": "Sp. Def",
  speed: "Velocidad",
};

// Referencias a los elementos del HTML
const searchInput    = document.getElementById("search-input");
const searchBtn      = document.getElementById("search-btn");
const resetBtn       = document.getElementById("reset-btn");
const statusMsg      = document.getElementById("status-msg");
const pokemonGrid    = document.getElementById("pokemon-grid");
const pagination     = document.getElementById("pagination");
const prevBtn        = document.getElementById("prev-btn");
const nextBtn        = document.getElementById("next-btn");
const pageNumbers    = document.getElementById("page-numbers");
const typeFilters    = document.getElementById("type-filters");
const modalOverlay   = document.getElementById("modal-overlay");
const modalClose     = document.getElementById("modal-close");
const modalImg       = document.getElementById("modal-img");
const modalId        = document.getElementById("modal-id");
const modalName      = document.getElementById("modal-name");
const modalTypes     = document.getElementById("modal-types");
const modalHeight    = document.getElementById("modal-height");
const modalWeight    = document.getElementById("modal-weight");
const modalAbilities = document.getElementById("modal-abilities");
const modalStatsList = document.getElementById("modal-stats-list");

// Variables de estado de la app
let currentPokemon = null;
let currentPage    = 1;
let isSearchMode   = false;
let activeType     = "all";

// Colores por tipo, usados para darle color a cada tarjeta
function getTypeColor(type) {
  const colors = {
    fire:     "#FF6B35",
    water:    "#4CC9F0",
    grass:    "#57CC99",
    electric: "#FFD166",
    psychic:  "#F72585",
    ice:      "#90E0EF",
    dragon:   "#7B2FBE",
    dark:     "#564E57",
    fairy:    "#FF85A1",
    fighting: "#C77DFF",
    poison:   "#9B5DE5",
    ground:   "#D4A373",
    rock:     "#B5838D",
    bug:      "#95D5B2",
    ghost:    "#6A0572",
    steel:    "#ADB5BD",
    flying:   "#90DBF4",
    normal:   "#ADB5BD",
  };
  return colors[type] || "#e63946";
}

// Trae una página de pokémon de la API
async function fetchPokemonList(page = 1) {
  const offset  = (page - 1) * PAGE_SIZE;
  const res     = await fetch(`${API_BASE}/pokemon?limit=${PAGE_SIZE}&offset=${offset}`);

  if (!res.ok) throw new Error(`Error al obtener la lista: ${res.status}`);

  const data = await res.json();
  // Pedir los detalles de todos en paralelo es más rápido que uno por uno
  return Promise.all(data.results.map((p) => fetchPokemonDetail(p.name)));
}

// Trae los datos completos de un pokémon por nombre o número
async function fetchPokemonDetail(nameOrId) {
  const res = await fetch(`${API_BASE}/pokemon/${String(nameOrId).toLowerCase().trim()}`);
  if (!res.ok) throw new Error(`Pokémon "${nameOrId}" no encontrado`);
  return res.json();
}

// Trae los pokémon de un tipo específico
async function fetchPokemonByType(type) {
  const res = await fetch(`${API_BASE}/type/${type}`);
  if (!res.ok) throw new Error(`Error al obtener tipo ${type}`);

  const data = await res.json();
  // Solo tomamos los primeros PAGE_SIZE para no hacer demasiadas peticiones
  const slice = data.pokemon.slice(0, PAGE_SIZE);
  return Promise.all(slice.map((entry) => fetchPokemonDetail(entry.pokemon.name)));
}

// Dibuja todas las tarjetas en el grid
function renderPokemonGrid(list) {
  pokemonGrid.innerHTML = "";
  list.forEach((pokemon) => {
    pokemonGrid.appendChild(createPokemonCard(pokemon));
  });
}

// Crea y devuelve la tarjeta HTML de un pokémon
function createPokemonCard(pokemon) {
  const id       = pokemon.id;
  const name     = pokemon.name;
  const imageUrl = pokemon.sprites?.other?.["official-artwork"]?.front_default
                || pokemon.sprites?.front_default
                || "";
  const types    = pokemon.types.map((t) => t.type.name);
  const mainType = types[0];

  const card = document.createElement("article");
  card.className = `pokemon-card type-${mainType}`;
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Ver detalles de ${name}`);
  card.dataset.pokemonId = id;

  // Aplicar el color del tipo como variable CSS para usarlo en el hover
  card.style.setProperty("--card-type-color", getTypeColor(mainType));

  card.innerHTML = `
    <span class="card-id">#${String(id).padStart(4, "0")}</span>
    <div class="card-img-wrapper">
      <img
        class="card-img"
        src="${imageUrl}"
        alt="${name}"
        loading="lazy"
        onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png'"
      />
    </div>
    <h3 class="card-name">${name}</h3>
    <div class="card-types">
      ${types.map((type) => `
        <span class="type-badge type-${type}" style="background:var(--type-color)">${type}</span>
      `).join("")}
    </div>
  `;

  // Al hacer clic abre el modal con los detalles
  card.addEventListener("click", () => openModal(pokemon));

  // También funciona con teclado (accesibilidad)
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(pokemon);
    }
  });

  return card;
}

// Muestra tarjetas vacías animadas mientras carga la API
function showSkeletons(count = PAGE_SIZE) {
  pokemonGrid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.className = "skeleton skeleton-card";
    pokemonGrid.appendChild(s);
  }
}

// Renderiza los botones de paginación con "..." cuando hay muchas páginas
function renderPageNumbers() {
  pageNumbers.innerHTML = "";

  let start = Math.max(1, currentPage - 2);
  let end   = Math.min(TOTAL_PAGES, currentPage + 2);

  if (currentPage <= 3)               end   = Math.min(5, TOTAL_PAGES);
  if (currentPage >= TOTAL_PAGES - 2) start = Math.max(TOTAL_PAGES - 4, 1);

  if (start > 1) {
    addPageBtn(1);
    if (start > 2) addEllipsis();
  }

  for (let i = start; i <= end; i++) addPageBtn(i);

  if (end < TOTAL_PAGES) {
    if (end < TOTAL_PAGES - 1) addEllipsis();
    addPageBtn(TOTAL_PAGES);
  }

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === TOTAL_PAGES;
}

// Crea un botón de número de página
function addPageBtn(num) {
  const btn = document.createElement("button");
  btn.className = `page-number${num === currentPage ? " active" : ""}`;
  btn.textContent = num;
  btn.setAttribute("aria-label", `Ir a página ${num}`);
  if (num === currentPage) btn.setAttribute("aria-current", "page");
  btn.addEventListener("click", () => goToPage(num));
  pageNumbers.appendChild(btn);
}

// Crea el "..." entre números de página
function addEllipsis() {
  const span = document.createElement("span");
  span.className = "page-ellipsis";
  span.textContent = "…";
  span.setAttribute("aria-hidden", "true");
  pageNumbers.appendChild(span);
}

// Navega a una página específica
async function goToPage(page) {
  if (page === currentPage || page < 1 || page > TOTAL_PAGES) return;

  currentPage = page;
  showSkeletons(PAGE_SIZE);
  setStatus(`Cargando página ${page}…`);
  pokemonGrid.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const list = await fetchPokemonList(page);
    renderPokemonGrid(list);
    renderPageNumbers();
    setStatus(`Página ${page} de ${TOTAL_PAGES}`, "success");
  } catch (error) {
    setStatus("Error al cargar la página", "error");
    console.error(error);
  }
}

// Abre el modal con la información detallada del pokémon
function openModal(pokemon) {
  currentPokemon = pokemon;

  const id        = pokemon.id;
  const name      = pokemon.name;
  const imageUrl  = pokemon.sprites?.other?.["official-artwork"]?.front_default
                 || pokemon.sprites?.front_default
                 || "";
  const types     = pokemon.types.map((t) => t.type.name);
  const mainType  = types[0];

  // La API devuelve altura en decímetros y peso en hectogramos
  const heightM   = (pokemon.height / 10).toFixed(1);
  const weightKg  = (pokemon.weight / 10).toFixed(1);
  const abilities = pokemon.abilities
    .map((a) => a.ability.name.replace("-", " "))
    .join(", ");

  modalImg.src               = imageUrl;
  modalImg.alt               = name;
  modalId.textContent        = `#${String(id).padStart(4, "0")}`;
  modalName.textContent      = name;
  modalHeight.textContent    = `${heightM} m`;
  modalWeight.textContent    = `${weightKg} kg`;
  modalAbilities.textContent = abilities;

  modalTypes.innerHTML = types.map((type) => `
    <span class="type-badge type-${type}" style="background:var(--type-color)">${type}</span>
  `).join("");

  // Generar las barras de estadísticas
  modalStatsList.innerHTML = pokemon.stats.map((statObj) => {
    const statName   = STAT_LABELS[statObj.stat.name] || statObj.stat.name;
    const statValue  = statObj.base_stat;
    const percentage = Math.min((statValue / 255) * 100, 100);

    return `
      <li class="stat-item">
        <span class="stat-name">${statName}</span>
        <span class="stat-value">${statValue}</span>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill type-${mainType}"
            style="width:${percentage}%; --type-color:${getTypeColor(mainType)}">
          </div>
        </div>
      </li>
    `;
  }).join("");

  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  modalClose.focus();
}

// Cierra el modal
function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
  currentPokemon = null;
}

// Muestra un mensaje de estado debajo del buscador
function setStatus(message, type = "default") {
  statusMsg.textContent = message;
  statusMsg.className   = `status-msg ${type !== "default" ? type : ""}`.trim();
}

// Ejecuta la búsqueda por nombre o número
async function handleSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    currentPage  = 1;
    isSearchMode = false;
    await loadDefaultList();
    return;
  }

  isSearchMode = true;
  pagination.classList.add("hidden");
  searchBtn.disabled = true;
  setStatus(`Buscando "${query}"…`);
  showSkeletons(4);

  try {
    const pokemon = await fetchPokemonDetail(query);
    renderPokemonGrid([pokemon]);
    setStatus(`1 resultado para "${query}"`, "success");
  } catch (error) {
    pokemonGrid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem 1rem; color:var(--text-secondary)">
        <p style="font-size:3rem; margin-bottom:1rem">😕</p>
        <p style="font-weight:700; color:var(--text-primary)">Pokémon no encontrado</p>
        <p style="font-size:0.88rem; margin-top:0.5rem; font-family:var(--font-mono)">
          Intenta con otro nombre o número
        </p>
      </div>
    `;
    setStatus(`No se encontró "${query}"`, "error");
  } finally {
    searchBtn.disabled = false;
  }
}

// Carga la lista principal con paginación
async function loadDefaultList() {
  isSearchMode = false;
  pagination.classList.remove("hidden");
  showSkeletons(PAGE_SIZE);
  setStatus("Cargando pokémon…");

  try {
    const list = await fetchPokemonList(currentPage);
    renderPokemonGrid(list);
    renderPageNumbers();
    setStatus(`Página ${currentPage} de ${TOTAL_PAGES}`, "success");
  } catch (error) {
    pokemonGrid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem 1rem; color:var(--text-secondary)">
        <p style="font-size:3rem; margin-bottom:1rem">⚡</p>
        <p style="font-weight:700; color:var(--text-primary)">Error al cargar la PokéDex</p>
        <p style="font-size:0.88rem; margin-top:0.5rem; font-family:var(--font-mono)">
          Verifica tu conexión e intenta de nuevo
        </p>
      </div>
    `;
    setStatus("Error al conectar con la PokéAPI", "error");
  }
}

// Helper para resetear el filtro activo visualmente
function resetTypeFilter() {
  activeType = "all";
  document.querySelectorAll(".type-filter-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector('.type-filter-btn[data-type="all"]').classList.add("active");
}

/* --- Eventos --- */

searchBtn.addEventListener("click", handleSearch);

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentPage = 1;
  resetTypeFilter();
  loadDefaultList();
});

prevBtn.addEventListener("click", () => goToPage(currentPage - 1));
nextBtn.addEventListener("click", () => goToPage(currentPage + 1));

modalClose.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
});

// Clic en el título vuelve al inicio
document.getElementById("site-title").addEventListener("click", () => {
  searchInput.value = "";
  currentPage = 1;
  resetTypeFilter();
  loadDefaultList();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Filtros por tipo de pokémon
typeFilters.addEventListener("click", async (e) => {
  const btn = e.target.closest(".type-filter-btn");
  if (!btn || btn.dataset.type === activeType) return;

  activeType = btn.dataset.type;
  document.querySelectorAll(".type-filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  searchInput.value = "";

  if (activeType === "all") {
    currentPage  = 1;
    isSearchMode = false;
    await loadDefaultList();
    return;
  }

  pagination.classList.add("hidden");
  isSearchMode = true;
  showSkeletons(PAGE_SIZE);
  setStatus(`Cargando tipo ${activeType}…`);

  try {
    const list = await fetchPokemonByType(activeType);
    renderPokemonGrid(list);
    setStatus(`${list.length} pokémon de tipo ${activeType}`, "success");
  } catch (error) {
    pokemonGrid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem 1rem; color:var(--text-secondary)">
        <p style="font-size:3rem; margin-bottom:1rem">😕</p>
        <p style="font-weight:700; color:var(--text-primary)">Error al filtrar por tipo</p>
      </div>
    `;
    setStatus(`Error al cargar tipo ${activeType}`, "error");
  }
});

/* --- Inicio de la app --- */
loadDefaultList();