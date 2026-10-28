/* ============================================================
   ESTADO DE LA APLICACIÓN
   ============================================================ */
let categoriaSeleccionada = "todos";
let terminoBusqueda = "";
let soloFavoritos = false;

// Persistencia en localStorage
let favoritos = JSON.parse(localStorage.getItem("libros_favoritos")) || [];
let carrito = JSON.parse(localStorage.getItem("libros_carrito")) || [];

/* ============================================================
   UTILIDAD DE PRECIOS
   ============================================================ */
function parsePrecio(strPrecio) {
    if (!strPrecio) return 0;
    const soloNumeros = strPrecio.replace(/[^0-9.]/g, "");
    return parseFloat(soloNumeros) || 0;
}

/* ============================================================
   REFERENCIAS AL DOM
   ============================================================ */
const contenedorLibros = document.getElementById("contenedor-libros");
const inputBuscador = document.getElementById("input-buscador");
const contenedorCategorias = document.getElementById("contenedor-categorias");
const sinResultados = document.getElementById("sin-resultados");
const btnLimpiar = document.getElementById("btn-limpiar-busqueda");
const contadorFavoritosEl = document.getElementById("contador-favoritos");
const btnVerFavoritos = document.getElementById("btn-ver-favoritos");

// Modal de detalles
const modal = document.getElementById("modal-libro");
const modalFondo = document.getElementById("modal-fondo");
const modalCerrar = document.getElementById("btn-cerrar-modal");
const modalContenido = document.getElementById("modal-contenido");

// Drawer del Carrito
const btnAbrirCarrito = document.getElementById("btn-abrir-carrito");
const btnCerrarCarrito = document.getElementById("btn-cerrar-carrito");
const drawerCarrito = document.getElementById("drawer-carrito");
const fondoCarrito = document.getElementById("fondo-carrito");
const itemsCarritoContenedor = document.getElementById("items-carrito");
const contadorCarritoBadge = document.getElementById("contador-carrito");
const carritoTotalMonto = document.getElementById("carrito-total-monto");
const btnVaciarCarrito = document.getElementById("btn-vaciar-carrito");
const btnCheckoutWhatsapp = document.getElementById("btn-checkout-whatsapp");

/* ============================================================
   FUNCIÓN PARA EXTRAER DATOS DE UNA TARJETA HTML
   ============================================================ */
function obtenerDatosTarjeta(tarjeta) {
    return {
        id: parseInt(tarjeta.dataset.id),
        categoria: tarjeta.dataset.categoria || "todos",
        editorial: tarjeta.dataset.editorial || "No disponible",
        ano: tarjeta.dataset.ano || "No disponible",
        paginas: tarjeta.dataset.paginas || "No disponible",
        titulo: tarjeta.querySelector(".titulo-libro")?.textContent.trim() || "",
        autor: tarjeta.querySelector(".autor-libro")?.textContent.trim() || "",
        sinopsis: tarjeta.querySelector(".sinopsis-corta")?.textContent.trim() || "",
        precio: tarjeta.querySelector(".precio-libro")?.textContent.trim() || "$0 MXN",
        imagen: tarjeta.querySelector(".portada-contenedor img")?.getAttribute("src") || "",
        categoriaNombre: tarjeta.querySelector(".etiqueta-categoria")?.textContent.trim() || "",
        categoriaClase: tarjeta.querySelector(".etiqueta-categoria")?.className || "etiqueta-categoria"
    };
}

function buscarLibroPorId(id) {
    const tarjeta = document.querySelector(`.tarjeta-libro[data-id="${id}"]`);
    return tarjeta ? obtenerDatosTarjeta(tarjeta) : null;
}

/* ============================================================
   FILTRADO Y BÚSQUEDA DIRECTA EN EL DOM
   ============================================================ */
function filtrarCatalogo() {
    const tarjetas = document.querySelectorAll(".tarjeta-libro");
    let visibles = 0;

    tarjetas.forEach(tarjeta => {
        const id = parseInt(tarjeta.dataset.id);
        const categoria = tarjeta.dataset.categoria;
        const titulo = tarjeta.querySelector(".titulo-libro")?.textContent.toLowerCase() || "";
        const autor = tarjeta.querySelector(".autor-libro")?.textContent.toLowerCase() || "";
        const sinopsis = tarjeta.querySelector(".sinopsis-corta")?.textContent.toLowerCase() || "";
        const textoCompleto = `${titulo} ${autor} ${sinopsis}`;

        const coincideCategoria = (categoriaSeleccionada === "todos" || categoria === categoriaSeleccionada);
        const coincideBusqueda = textoCompleto.includes(terminoBusqueda.toLowerCase().trim());
        const coincideFavorito = soloFavoritos ? favoritos.includes(id) : true;

        if (coincideCategoria && coincideBusqueda && coincideFavorito) {
            tarjeta.classList.remove("oculto");
            visibles++;
        } else {
            tarjeta.classList.add("oculto");
        }
    });

    if (visibles === 0) {
        sinResultados.classList.remove("oculto");
    } else {
        sinResultados.classList.add("oculto");
    }
}

/* ============================================================
   SISTEMA DE FAVORITOS
   ============================================================ */
function actualizarEstadoFavoritos() {
    const tarjetas = document.querySelectorAll(".tarjeta-libro");
    tarjetas.forEach(tarjeta => {
        const id = parseInt(tarjeta.dataset.id);
        const btnFav = tarjeta.querySelector(".btn-favorito-tarjeta");
        const esFav = favoritos.includes(id);

        if (btnFav) {
            if (esFav) {
                btnFav.classList.add("marcado");
                btnFav.textContent = "♥";
                btnFav.title = "Quitar de favoritos";
            } else {
                btnFav.classList.remove("marcado");
                btnFav.textContent = "♡";
                btnFav.title = "Agregar a favoritos";
            }
        }
    });

    if (contadorFavoritosEl) {
        contadorFavoritosEl.textContent = favoritos.length;
    }
}

function alternarFavorito(id) {
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(favId => favId !== id);
    } else {
        favoritos.push(id);
    }
    localStorage.setItem("libros_favoritos", JSON.stringify(favoritos));
    actualizarEstadoFavoritos();
    filtrarCatalogo();
}

/* ============================================================
   SISTEMA DE CARRITO DE COMPRAS Y SUMA DEL TOTAL
   ============================================================ */
function guardarCarrito() {
    localStorage.setItem("libros_carrito", JSON.stringify(carrito));
    renderizarCarrito();
}

function agregarAlCarrito(id) {
    const itemExistente = carrito.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({ id: id, cantidad: 1 });
    }

    guardarCarrito();
    abrirCarrito();
}

function cambiarCantidadItem(id, cambio) {
    const item = carrito.find(i => i.id === id);
    if (!item) return;

    item.cantidad += cambio;

    if (item.cantidad <= 0) {
        carrito = carrito.filter(i => i.id !== id);
    }

    guardarCarrito();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(i => i.id !== id);
    guardarCarrito();
}

function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
}

function renderizarCarrito() {
    const totalArticulos = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    if (contadorCarritoBadge) {
        contadorCarritoBadge.textContent = totalArticulos;
    }

    if (!itemsCarritoContenedor) return;

    itemsCarritoContenedor.innerHTML = "";

    if (carrito.length === 0) {
        itemsCarritoContenedor.innerHTML = `
            <div class="carrito-vacio">
                <span style="font-size: 2.4rem; display: block; margin-bottom: 0.5rem;">🛍️</span>
                <p>Tu carrito está vacío.</p>
                <small>Agrega libros del catálogo con el botón 🛒</small>
            </div>
        `;
        if (carritoTotalMonto) carritoTotalMonto.textContent = "$0.00 MXN";
        if (btnCheckoutWhatsapp) btnCheckoutWhatsapp.classList.add("disabled");
        return;
    }

    if (btnCheckoutWhatsapp) btnCheckoutWhatsapp.classList.remove("disabled");

    let subtotalGeneral = 0;

    carrito.forEach(item => {
        const libro = buscarLibroPorId(item.id);
        if (!libro) return;

        const precioUnitario = parsePrecio(libro.precio);
        const subtotal = precioUnitario * item.cantidad;
        subtotalGeneral += subtotal;

        const elemento = document.createElement("div");
        elemento.className = "carrito-item";
        elemento.innerHTML = `
            <img src="${libro.imagen}" alt="${libro.titulo}" class="carrito-item-img">
            <div class="carrito-item-info">
                <h4>${libro.titulo}</h4>
                <span class="carrito-item-precio">${libro.precio}</span>
                <div class="carrito-item-controles">
                    <button class="btn-qty" type="button" onclick="cambiarCantidadItem(${libro.id}, -1)">-</button>
                    <span class="qty-num">${item.cantidad}</span>
                    <button class="btn-qty" type="button" onclick="cambiarCantidadItem(${libro.id}, 1)">+</button>
                    <button class="btn-eliminar-item" type="button" onclick="eliminarDelCarrito(${libro.id})" title="Eliminar">🗑</button>
                </div>
            </div>
        `;

        itemsCarritoContenedor.appendChild(elemento);
    });

    if (carritoTotalMonto) {
        carritoTotalMonto.textContent = `$${subtotalGeneral.toFixed(2)} MXN`;
    }
}

function abrirCarrito() {
    renderizarCarrito();
    if (drawerCarrito && fondoCarrito) {
        drawerCarrito.classList.add("abierto");
        fondoCarrito.classList.remove("oculto");
    }
}

function cerrarCarrito() {
    if (drawerCarrito && fondoCarrito) {
        drawerCarrito.classList.remove("abierto");
        fondoCarrito.classList.add("oculto");
    }
}

function finalizarCompraWhatsApp() {
    if (carrito.length === 0) return;

    let mensaje = "¡Hola! Quisiera realizar el pedido de los siguientes libros en El Rincón del Lector:\n\n";
    let totalGeneral = 0;

    carrito.forEach(item => {
        const libro = buscarLibroPorId(item.id);
        if (libro) {
            const precioUnitario = parsePrecio(libro.precio);
            const subtotal = precioUnitario * item.cantidad;
            totalGeneral += subtotal;
            mensaje += `• ${item.cantidad}x "${libro.titulo}" - $${subtotal.toFixed(2)} MXN\n`;
        }
    });

    mensaje += `\n*Total a pagar:* $${totalGeneral.toFixed(2)} MXN`;
    mensaje += "\n\n¿Tienen disponibilidad para entrega en Puebla?";

    const url = `https://wa.me/522213637565?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
}

/* ============================================================
   MODAL DE DETALLES
   ============================================================ */
function abrirModalDesdeTarjeta(tarjeta) {
    const libro = obtenerDatosTarjeta(tarjeta);

    modalContenido.innerHTML = `
        <div class="modal-grid">
            <img class="modal-img" src="${libro.imagen}" alt="${libro.titulo}">
            <div class="modal-info">
                <span class="${libro.categoriaClase}">${libro.categoriaNombre}</span>
                <h3>${libro.titulo}</h3>
                <p class="autor">Por <strong>${libro.autor}</strong></p>
                <p>${libro.sinopsis}</p>
                <div class="modal-meta">
                    <div><strong>Editorial:</strong> ${libro.editorial}</div>
                    <div><strong>Año:</strong> ${libro.ano}</div>
                    <div><strong>Extensión:</strong> ${libro.paginas}</div>
                    <div><strong>Precio:</strong> ${libro.precio}</div>
                </div>
                <div class="modal-acciones">
                    <button class="boton-primario" type="button" onclick="agregarAlCarrito(${libro.id}); cerrarModal();">
                        🛒 Añadir al carrito
                    </button>
                    <a href="https://wa.me/522213637565?text=Hola,%20me%20interesa%20apartar%20el%20libro:%20${encodeURIComponent(libro.titulo)}" target="_blank" class="boton-secundario" style="text-decoration:none;">
                        💬 Apartar por WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove("oculto");
}

function cerrarModal() {
    modal.classList.add("oculto");
}

/* ============================================================
   EVENT LISTENERS
   ============================================================ */

// Buscador
inputBuscador.addEventListener("input", (e) => {
    terminoBusqueda = e.target.value;
    filtrarCatalogo();
});

// Filtro de Categorías
contenedorCategorias.addEventListener("click", (e) => {
    const boton = e.target.closest(".btn-categoria");
    if (!boton) return;

    document.querySelectorAll(".btn-categoria").forEach(b => b.classList.remove("activa"));
    boton.classList.add("activa");

    categoriaSeleccionada = boton.dataset.categoria;
    filtrarCatalogo();
});

// Clics delegados en las tarjetas
contenedorLibros.addEventListener("click", (e) => {
    const tarjeta = e.target.closest(".tarjeta-libro");
    if (!tarjeta) return;

    const id = parseInt(tarjeta.dataset.id);

    // Clic en favoritos
    if (e.target.closest(".btn-favorito-tarjeta")) {
        alternarFavorito(id);
        return;
    }

    // Clic en agregar al carrito
    if (e.target.closest(".btn-agregar-carrito")) {
        agregarAlCarrito(id);
        return;
    }

    // Clic en ver detalles
    if (e.target.closest(".btn-detalles")) {
        abrirModalDesdeTarjeta(tarjeta);
    }
});

// Alternar vista de favoritos
btnVerFavoritos.addEventListener("click", () => {
    soloFavoritos = !soloFavoritos;
    btnVerFavoritos.style.backgroundColor = soloFavoritos ? '#e06c75' : '';
    btnVerFavoritos.style.color = soloFavoritos ? '#ffffff' : '';
    filtrarCatalogo();
});

// Botón para resetear búsqueda
btnLimpiar.addEventListener("click", () => {
    inputBuscador.value = "";
    terminoBusqueda = "";
    categoriaSeleccionada = "todos";
    soloFavoritos = false;
    btnVerFavoritos.style.backgroundColor = '';
    btnVerFavoritos.style.color = '';
    document.querySelectorAll(".btn-categoria").forEach(b => b.classList.remove("activa"));
    document.querySelector('[data-categoria="todos"]').classList.add("activa");
    filtrarCatalogo();
});

// Modal de detalles
modalCerrar.addEventListener("click", cerrarModal);
modalFondo.addEventListener("click", cerrarModal);

// Drawer del Carrito
btnAbrirCarrito.addEventListener("click", abrirCarrito);
btnCerrarCarrito.addEventListener("click", cerrarCarrito);
fondoCarrito.addEventListener("click", cerrarCarrito);
btnVaciarCarrito.addEventListener("click", vaciarCarrito);
btnCheckoutWhatsapp.addEventListener("click", finalizarCompraWhatsApp);

// Tecla ESC para cerrar todo
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        cerrarModal();
        cerrarCarrito();
    }
});

// Inicialización
actualizarEstadoFavoritos();
filtrarCatalogo();
renderizarCarrito();