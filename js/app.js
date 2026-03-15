/**
 * PokéDex — app.js
 * Autor: Taller Ingeniería Web 2026
 *
 * Descripción:
 *   Lógica principal de la aplicación. Consume la PokéAPI para listar
 *   y buscar pokémon, y muestra una tarjeta flotante (modal) con los
 *   detalles de cada pokémon al hacer clic en su tarjeta.
 *   Incluye paginación para navegar por los 1025 pokémon disponibles.
 *
 * Organización:
 *   1. Constantes y configuración
 *   2. Referencias al DOM
 *   3. Estado de la aplicación
 *   4. Funciones de la API
 *   5. Funciones de renderizado (HTML)
 *   6. Funciones de paginación
 *   7. Funciones del modal
 *   8. Funciones auxiliares
 *   9. Manejadores de eventos
 *  10. Inicialización
 */

/* ================================================================
   1. CONSTANTES Y CONFIGURACIÓN
   ================================================================ */

/** URL base de la PokéAPI */
const API_BASE = "https://pokeapi.co/api/v2";

/** Cantidad de pokémon por página */
const PAGE_SIZE = 20;

/** Total de pokémon disponibles en la API (gen 1–9) */
const TOTAL_POKEMON = 1025;

/** Total de páginas calculado automáticamente */
const TOTAL_PAGES = Math.ceil(TOTAL_POKEMON / PAGE_SIZE);

/**
 * Mapeo de nombres de estadísticas para mostrarlas
 * en el modal de forma más amigable al usuario.
 */
const STAT_LABELS = {
  hp: "HP",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "Sp. Atq",
  "special-defense": "Sp. Def",
  speed: "Velocidad",
};

/* ================================================================
   2. REFERENCIAS AL DOM
   ================================================================ */

// Sección de búsqueda
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const resetBtn = document.getElementById("reset-btn");
const statusMsg = document.getElementById("status-msg");

// Grid de tarjetas
const pokemonGrid = document.getElementById("pokemon-grid");

// Paginación
const pagination = document.getElementById("pagination");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageNumbers = document.getElementById("page-numbers");

// Elementos del modal
const modalOverlay = document.getElementById("modal-overlay");
const modalClose = document.getElementById("modal-close");
const modalImg = document.getElementById("modal-img");
const modalId = document.getElementById("modal-id");
const modalName = document.getElementById("modal-name");
const modalTypes = document.getElementById("modal-types");
const modalHeight = document.getElementById("modal-height");
const modalWeight = document.getElementById("modal-weight");
const modalAbilities = document.getElementById("modal-abilities");
const modalStatsList = document.getElementById("modal-stats-list");

/* ================================================================
   3. ESTADO DE LA APLICACIÓN
   ================================================================ */

/** Pokémon actualmente abierto en el modal */
let currentPokemon = null;

/** Página activa en la paginación */
let currentPage = 1;

/** true cuando el usuario hizo una búsqueda puntual (oculta paginación) */
let isSearchMode = false;

/* ================================================================
   4. FUNCIONES DE LA API
   ================================================================ */

/**
 * Obtiene una página de pokémon según el número de página.
 * Usa offset para la paginación: offset = (page - 1) * PAGE_SIZE
 *
 * @param {number} page - Número de página (empieza en 1)
 * @returns {Promise<Array>} Lista de objetos con datos del pokémon
 */
async function fetchPokemonList(page = 1) {
  const offset = (page - 1) * PAGE_SIZE;
  const listUrl = `${API_BASE}/pokemon?limit=${PAGE_SIZE}&offset=${offset}`;
  const listRes = await fetch(listUrl);

  if (!listRes.ok) {
    throw new Error(`Error al obtener la lista: ${listRes.status}`);
  }

  const listData = await listRes.json();

  // Solicitar los detalles de cada pokémon en paralelo para mayor velocidad
  const detailPromises = listData.results.map((p) =>
    fetchPokemonDetail(p.name),
  );
  return Promise.all(detailPromises);
}

/**
 * Obtiene los detalles completos de un pokémon por nombre o ID.
 *
 * @param {string|number} nameOrId - Nombre o número del pokémon
 * @returns {Promise<Object>} Datos completos del pokémon desde la API
 */
async function fetchPokemonDetail(nameOrId) {
  const url = `${API_BASE}/pokemon/${String(nameOrId).toLowerCase().trim()}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Pokémon "${nameOrId}" no encontrado (${res.status})`);
  }

  return res.json();
}

/* ================================================================
   5. FUNCIONES DE RENDERIZADO
   ================================================================ */

/**
 * Renderiza el grid completo de pokémon a partir de una lista.
 *
 * @param {Array} pokemonList - Lista de objetos de pokémon de la API
 */
function renderPokemonGrid(pokemonList) {
  pokemonGrid.innerHTML = "";

  pokemonList.forEach((pokemon) => {
    const card = createPokemonCard(pokemon);
    pokemonGrid.appendChild(card);
  });
}

/**
 * Crea y retorna el elemento DOM de una tarjeta de pokémon.
 *
 * @param {Object} pokemon - Datos del pokémon obtenidos de la API
 * @returns {HTMLElement} Elemento article con la tarjeta
 */
function createPokemonCard(pokemon) {
  const id = pokemon.id;
  const name = pokemon.name;
  const imageUrl =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default ||
    "";
  const types = pokemon.types.map((t) => t.type.name);
  const mainType = types[0];

  const card = document.createElement("article");
  card.className = `pokemon-card type-${mainType}`;
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Ver detalles de ${name}`);
  card.dataset.pokemonId = id;

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
      ${types
        .map(
          (type) => `
        <span class="type-badge type-${type}" style="background:var(--type-color)">${type}</span>
      `,
        )
        .join("")}
    </div>
  `;

  card.addEventListener("click", () => openModal(pokemon));

  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openModal(pokemon);
    }
  });

  return card;
}

/**
 * Muestra tarjetas skeleton mientras se espera la respuesta de la API.
 *
 * @param {number} count - Número de skeletons a mostrar
 */
function showSkeletons(count = PAGE_SIZE) {
  pokemonGrid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton skeleton-card";
    pokemonGrid.appendChild(skeleton);
  }
}

/* ================================================================
   6. FUNCIONES DE PAGINACIÓN
   ================================================================ */

/**
 * Renderiza los botones de número de página con lógica de ellipsis.
 * Muestra máximo 5 números visibles alrededor de la página actual.
 */
function renderPageNumbers() {
  pageNumbers.innerHTML = "";

  let start = Math.max(1, currentPage - 2);
  let end = Math.min(TOTAL_PAGES, currentPage + 2);

  if (currentPage <= 3) end = Math.min(5, TOTAL_PAGES);
  if (currentPage >= TOTAL_PAGES - 2) start = Math.max(TOTAL_PAGES - 4, 1);

  if (start > 1) {
    addPageBtn(1);
    if (start > 2) addEllipsis();
  }

  for (let i = start; i <= end; i++) {
    addPageBtn(i);
  }

  if (end < TOTAL_PAGES) {
    if (end < TOTAL_PAGES - 1) addEllipsis();
    addPageBtn(TOTAL_PAGES);
  }

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === TOTAL_PAGES;
}

/**
 * Crea y agrega un botón numérico de página al contenedor.
 *
 * @param {number} num - Número de página que representa el botón
 */
function addPageBtn(num) {
  const btn = document.createElement("button");
  btn.className = `page-number${num === currentPage ? " active" : ""}`;
  btn.textContent = num;
  btn.setAttribute("aria-label", `Ir a página ${num}`);
  if (num === currentPage) btn.setAttribute("aria-current", "page");
  btn.addEventListener("click", () => goToPage(num));
  pageNumbers.appendChild(btn);
}

/**
 * Crea y agrega un elemento "…" entre números de página.
 */
function addEllipsis() {
  const span = document.createElement("span");
  span.className = "page-ellipsis";
  span.textContent = "…";
  span.setAttribute("aria-hidden", "true");
  pageNumbers.appendChild(span);
}

/**
 * Navega a una página específica: actualiza el estado,
 * muestra skeletons, solicita los datos y re-renderiza.
 *
 * @param {number} page - Número de página destino
 */
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
    console.error("Error en goToPage:", error);
  }
}

/* ================================================================
   7. FUNCIONES DEL MODAL
   ================================================================ */

/**
 * Abre el modal con los datos del pokémon seleccionado.
 * El overlay aplica backdrop-filter blur sobre el contenido de fondo.
 *
 * @param {Object} pokemon - Datos completos del pokémon desde la API
 */
function openModal(pokemon) {
  currentPokemon = pokemon;

  const id = pokemon.id;
  const name = pokemon.name;
  const imageUrl =
    pokemon.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon.sprites?.front_default ||
    "";
  const types = pokemon.types.map((t) => t.type.name);
  const mainType = types[0];
  const heightM = (pokemon.height / 10).toFixed(1); // decímetros → metros
  const weightKg = (pokemon.weight / 10).toFixed(1); // hectogramos → kg
  const abilities = pokemon.abilities
    .map((a) => a.ability.name.replace("-", " "))
    .join(", ");

  modalImg.src = imageUrl;
  modalImg.alt = name;
  modalId.textContent = `#${String(id).padStart(4, "0")}`;
  modalName.textContent = name;
  modalHeight.textContent = `${heightM} m`;
  modalWeight.textContent = `${weightKg} kg`;
  modalAbilities.textContent = abilities;

  modalTypes.innerHTML = types
    .map(
      (type) => `
    <span class="type-badge type-${type}" style="background:var(--type-color)">${type}</span>
  `,
    )
    .join("");

  // Barras de estadísticas con animación escalonada
  modalStatsList.innerHTML = pokemon.stats
    .map((statObj, index) => {
      const statName = STAT_LABELS[statObj.stat.name] || statObj.stat.name;
      const statValue = statObj.base_stat;
      const percentage = Math.min((statValue / 255) * 100, 100);

      return `
      <li class="stat-item">
        <span class="stat-name">${statName}</span>
        <span class="stat-value">${statValue}</span>
        <div class="stat-bar-bg">
          <div
            class="stat-bar-fill type-${mainType}"
            style="
              width: ${percentage}%;
              --type-color: var(--type-${mainType}-color, var(--accent-red));
              --bar-delay: ${index * 0.07}s;
            "
          ></div>
        </div>
      </li>
    `;
    })
    .join("");

  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  modalClose.focus();
}

/**
 * Cierra el modal y restaura el scroll de la página.
 */
function closeModal() {
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
  currentPokemon = null;
}

/* ================================================================
   8. FUNCIONES AUXILIARES
   ================================================================ */

/**
 * Actualiza el mensaje de estado visible bajo el buscador.
 *
 * @param {string} message - Texto a mostrar
 * @param {'default'|'error'|'success'} type - Clase visual del mensaje
 */
function setStatus(message, type = "default") {
  statusMsg.textContent = message;
  statusMsg.className = `status-msg ${type !== "default" ? type : ""}`.trim();
}

/**
 * Ejecuta la búsqueda según el valor del input.
 * Si el input está vacío, recarga la lista paginada.
 */
async function handleSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    currentPage = 1;
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
      <div style="grid-column: 1/-1; text-align:center; padding: 3rem 1rem; color: var(--text-secondary);">
        <p style="font-size:3rem; margin-bottom:1rem;">😕</p>
        <p style="font-weight:700; font-size:1.1rem; color:var(--text-primary)">Pokémon no encontrado</p>
        <p style="font-size:0.88rem; margin-top:0.5rem; font-family:var(--font-mono)">
          Intenta con otro nombre o número
        </p>
      </div>
    `;
    setStatus(`No se encontró "${query}"`, "error");
    console.error("Error de búsqueda:", error);
  } finally {
    searchBtn.disabled = false;
  }
}

/**
 * Carga la página actual de pokémon e inicializa la paginación.
 */
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
    console.error("Error al cargar lista:", error);
  }
}

/* ================================================================
   9. MANEJADORES DE EVENTOS
   ================================================================ */

// Búsqueda al hacer clic en el botón
searchBtn.addEventListener("click", handleSearch);

// Búsqueda al presionar Enter en el input
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});

// Reset: limpia el input y vuelve a página 1
resetBtn.addEventListener("click", () => {
  searchInput.value = "";
  currentPage = 1;
  loadDefaultList();
});

// Paginación: página anterior
prevBtn.addEventListener("click", () => goToPage(currentPage - 1));

// Paginación: página siguiente
nextBtn.addEventListener("click", () => goToPage(currentPage + 1));

// Modal: botón cerrar
modalClose.addEventListener("click", closeModal);

// Modal: clic en el overlay (fuera de la tarjeta)
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Modal: tecla Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
});

document.getElementById("site-title").addEventListener("click", () => {
  searchInput.value = "";
  currentPage = 1;
  loadDefaultList();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ================================================================
   10. INICIALIZACIÓN
   ================================================================ */

currentPage = 1;
loadDefaultList();
