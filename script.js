// Definición de proyecciones para convertir UTM a Latitud/Longitud
// Zona UTM 18 Sur corresponde a la zona de Loreto (Iquitos)
proj4.defs("EPSG:32718", "+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs");
const utm = "EPSG:32718";
const wgs84 = "EPSG:4326";

// Datos de las quebradas proporcionados en la tabla
const data = [
    { id: 1, via: "Fluvial (río Nanay)", nombre: "Quebrada Llanchama", x: 677177.56, y: 9573519.00 },
    { id: 2, via: "Fluvial (río Nanay)", nombre: "Quebrada Agua negra", x: 674901.38, y: 9573676.00 },
    { id: 3, via: "Fluvial (río Nanay)", nombre: "Quebrada Tambishi", x: 672807.25, y: 9572889.00 },
    { id: 4, via: "Fluvial (río Nanay)", nombre: "Quebrada Santa Cruz", x: 671437.69, y: 9572504.00 },
    { id: 5, via: "Fluvial (río Nanay)", nombre: "Quebrada San Pedro", x: 668580.57, y: 9572508.97 },
    { id: 6, via: "Carretera (Carretera Iquitos-Nauta)", nombre: "Quebrada Paujil", x: 676058.00, y: 9562471.65 },
    { id: 7, via: "Carretera (Carretera Iquitos-Nauta)", nombre: "Quebrada Tocón", x: 672190.94, y: 9549237.00 },
    { id: 8, via: "Carretera (Carretera Iquitos-Nauta)", nombre: "Quebrada Pintuyacu", x: 671407.56, y: 9547551.00 },
    { id: 9, via: "Carretera (Carretera Iquitos-Nauta)", nombre: "Quebrada Lindero", x: 669210.69, y: 9541697.00 },
    { id: 10, via: "Carretera (Carretera Iquitos-Nauta)", nombre: "Quebrada Habanillo", x: 668931.14, y: 9537116.03 }
];

// Preprocesar datos: convertir UTM a Lat/Lng
const quebradas = data.map(item => {
    // proj4 recibe [x, y] y devuelve [longitud, latitud]
    const coords = proj4(utm, wgs84, [item.x, item.y]);
    return {
        ...item,
        lng: coords[0],
        lat: coords[1],
        tipo: item.via.toLowerCase().includes('fluvial') ? 'fluvial' : 'carretera'
    };
});

// Mapas Base (OpenStreetMap usa idioma local, en este caso español para Perú)
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 20
});

const esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 20
});

// Inicializar el mapa
const map = L.map('map', {
    center: [-3.85, -73.35], // Centro inicial aproximado en Iquitos
    zoom: 6,
    layers: [osmLayer]
});

// Control de capas base
const baseMaps = {
    "Mapa Claro (Calles)": osmLayer,
    "Satélite (Terreno)": esriSatellite
};
L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

// Crear estilos de íconos para cada tipo de vía
const createIcon = (color) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
};

const iconFluvial = createIcon('#0284c7'); // Azul para fluvial
const iconCarretera = createIcon('#d97706'); // Naranja para carretera

// Grupo de marcadores
const markersGroup = L.featureGroup().addTo(map);
const markers = {};

// Renderizar marcadores en el mapa
function renderMarkers(filter = 'all') {
    markersGroup.clearLayers();
    
    quebradas.forEach(q => {
        if (filter !== 'all' && q.tipo !== filter) return;

        const icon = q.tipo === 'fluvial' ? iconFluvial : iconCarretera;
        
        const marker = L.marker([q.lat, q.lng], { icon: icon });
        
        // Popup con detalles que se muestra al dar clic
        marker.bindPopup(`
            <div class="popup-title">${q.nombre}</div>
            <div class="popup-via"><b>Vía de acceso:</b> ${q.via}</div>
            <div class="popup-via" style="margin-top:8px; font-size:0.75rem;">
                <b>Coordenadas UTM:</b><br>X: ${q.x} | Y: ${q.y}
            </div>
        `);
        
        // Tooltip (etiqueta) con el nombre visible de forma permanente
        marker.bindTooltip(q.nombre, {
            permanent: true,
            direction: 'right',
            offset: [10, 0],
            className: 'custom-tooltip'
        });

        marker.addTo(markersGroup);
        markers[q.id] = marker; // Guardar referencia para interactuar desde la lista
    });

    // Ajustar el zoom para que se vean todos los puntos filtrados (solo si usamos un filtro)
    if (Object.keys(markersGroup._layers).length > 0 && filter !== 'all') {
        map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] });
    }
}

// Renderizar lista en la barra lateral
const listContainer = document.getElementById('quebradas-list');

function renderList(filter = 'all') {
    listContainer.innerHTML = '';
    
    quebradas.forEach(q => {
        if (filter !== 'all' && q.tipo !== filter) return;

        const li = document.createElement('li');
        li.className = 'quebrada-item';
        
        const badgeClass = q.tipo;
        const badgeText = q.tipo === 'fluvial' ? 'Fluvial' : 'Carretera';
        
        li.innerHTML = `
            <span class="badge ${badgeClass}">${badgeText}</span>
            <h3>${q.nombre}</h3>
            <div class="quebrada-via">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                ${q.via}
            </div>
        `;
        
        // Al hacer clic en un elemento de la lista, hacer zoom y abrir el popup en el mapa
        li.addEventListener('click', () => {
            const marker = markers[q.id];
            if (marker) {
                map.setView([q.lat, q.lng], 16);
                marker.openPopup();
            }
        });
        
        listContainer.appendChild(li);
    });
}

// Inicializar interfaz
renderMarkers();
renderList();

// Interacción con los botones de filtro
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Estilos del botón activo
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // Ejecutar el filtro
        const filter = e.target.getAttribute('data-filter');
        renderMarkers(filter);
        renderList(filter);
    });
});

// Renderizar la capa del polígono de Loreto desde el archivo js incluido
if (typeof loretoGeoJSON !== 'undefined') {
    // Creamos la capa GeoJSON
    const loretoLayer = L.geoJSON(loretoGeoJSON, {
        style: {
            color: '#064e3b', // Verde oscuro para el borde
            weight: 3,
            opacity: 0.8,
            fillColor: '#047857', // Relleno verde esmeralda
            fillOpacity: 0.4,
            dashArray: '' // Línea continua
        }
    }).addTo(map);
    
    // Enviamos la capa del polígono al fondo para que no cubra los marcadores
    loretoLayer.bringToBack();

    // Ajustar el zoom inicial del mapa para que se vea todo Loreto
    map.fitBounds(loretoLayer.getBounds(), { padding: [20, 20] });
} else {
    console.error("No se encontró la variable loretoGeoJSON. Asegúrate de incluir loreto.js en el HTML.");
}
