# PokéDex
 
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PokéAPI](https://img.shields.io/badge/PokéAPI-EF5350?style=for-the-badge&logo=pokemon&logoColor=white)
 
Aplicación web interactiva que consume la **PokéAPI** para explorar, buscar y filtrar pokémon. Desarrollada con HTML, CSS y JavaScript vanilla como parte del Taller Evaluativo 1 de Ingeniería Web 2026.
 

## Capturas de pantalla

### Vista principal


### Búsqueda de pokémon


### Filtro por tipo


### Detalle del pokémon 


---

## ¿Qué hace la app?

- Muestra un listado de pokémon paginado (20 por página, 1025 en total)
- Permite buscar cualquier pokémon por nombre o número
- Filtra pokémon por tipo (fuego, agua, planta, etc.)
- Al hacer clic en una tarjeta se abre un modal con imagen, tipos, altura, peso, habilidades y estadísticas base
- El fondo se desenfoca cuando el modal está abierto
- Botón de reset y clic en el logo vuelven a la página inicial
- Diseño responsivo que funciona en móvil, tablet y escritorio

---

## Estructura del proyecto

```
taller-html-nombre-apellidos/
│
├── index.html           # Estructura principal de la página
├── css/
│   └── style.css        # Todos los estilos
├── js/
│   └── app.js           # Lógica y consumo de la API
├── img/
│   └── pokeball.png     # Ícono del header
└── README.md
```

---

## Cómo ejecutarlo

No requiere instalación ni dependencias. Solo abre `index.html` en el navegador.

Si usas VS Code, la forma más cómoda es con la extensión **Live Server**:
1. Clic derecho sobre `index.html`
2. Selecciona *"Open with Live Server"*
3. Se abre en `http://127.0.0.1:5500`

También funciona con Python:
```bash
python -m http.server 8000
# Luego abre http://localhost:8000
```

---

## API utilizada

**PokéAPI** — `https://pokeapi.co/api/v2/`

| Endpoint | Uso |
|---|---|
| `/pokemon?limit=20&offset=N` | Lista paginada de pokémon |
| `/pokemon/{nombre_o_id}` | Detalles de un pokémon específico |
| `/type/{tipo}` | Pokémon filtrados por tipo |

No requiere autenticación ni API key.

---

## Tecnologías

- HTML5 semántico
- CSS3 (variables, grid, flexbox, animaciones, backdrop-filter)
- JavaScript ES2020+ (async/await, optional chaining, Promise.all)
- [PokéAPI](https://pokeapi.co) — API REST pública
- [Google Fonts](https://fonts.google.com) — Hanken Grotesk + Inter

---

## Autor

Taller Evaluativo 1 · Ingeniería Web 2026  
Profesor: Juan Pablo Arango
