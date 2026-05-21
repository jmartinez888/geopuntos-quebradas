// Definición de proyecciones para convertir UTM a Latitud/Longitud
proj4.defs("EPSG:32718", "+proj=utm +zone=18 +south +datum=WGS84 +units=m +no_defs");
const utm = "EPSG:32718";
const wgs84 = "EPSG:4326";

// Datos de las quebradas
const data = [
    { id: 1, via: "Fluvial", nombre: "Quebrada Llanchama", x: 677177.56, y: 9573519.00 },
    { id: 2, via: "Fluvial", nombre: "Quebrada Agua negra", x: 674901.38, y: 9573676.00 },
    { id: 3, via: "Fluvial", nombre: "Quebrada Tambishi", x: 672807.25, y: 9572889.00 },
    { id: 4, via: "Fluvial", nombre: "Quebrada Santa Cruz", x: 671437.69, y: 9572504.00 },
    { id: 5, via: "Fluvial", nombre: "Quebrada San Pedro", x: 668580.57, y: 9572508.97 },
    { id: 6, via: "Carretera", nombre: "Quebrada Paujil", x: 676058.00, y: 9562471.65 },
    { id: 7, via: "Carretera", nombre: "Quebrada Tocón", x: 672190.94, y: 9549237.00 },
    { id: 8, via: "Carretera", nombre: "Quebrada Pintuyacu", x: 671407.56, y: 9547551.00 },
    { id: 9, via: "Carretera", nombre: "Quebrada Lindero", x: 669210.69, y: 9541697.00 },
    { id: 10, via: "Carretera", nombre: "Quebrada Habanillo", x: 668931.14, y: 9537116.03 }
];

// Preprocesar datos
const quebradas = data.map(item => {
    const coords = proj4(utm, wgs84, [item.x, item.y]);
    return { ...item, lng: coords[0], lat: coords[1] };
});

// ==========================================
// MAPA PRINCIPAL
// ==========================================
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    opacity: 0.6 // Ligeramente transparente para que se mezcle con el fondo amarillento
});

const map = L.map('map', {
    zoomControl: true,
    layers: [osmLayer]
});

// Iconos
const blueIcon = L.divIcon({ className: 'blue-marker', iconSize: [14, 14], iconAnchor: [7, 7] });
const orangeIcon = L.divIcon({ className: 'orange-marker', iconSize: [14, 14], iconAnchor: [7, 7] });
const cityIcon = L.divIcon({ className: 'city-marker', iconSize: [10, 10], iconAnchor: [5, 5] });

const bounds = L.latLngBounds();

// Dibujar Quebradas (Diferenciar por vía de acceso)
quebradas.forEach(q => {
    const pointIcon = q.via.toLowerCase().includes('fluvial') ? blueIcon : orangeIcon;
    const marker = L.marker([q.lat, q.lng], { icon: pointIcon }).addTo(map);
    
    // Configuración condicional para evitar que los nombres se superpongan
    // Ampliamos el offset (distancia) para que el triángulo no se superponga al círculo verde
    let dir = 'right';
    let offset = [12, 0];

    if (q.nombre === 'Quebrada San Pedro') {
        dir = 'left';
        offset = [-12, 0];
    } else if (q.nombre === 'Quebrada Santa Cruz') {
        dir = 'bottom';
        offset = [0, 12];
    } else if (q.nombre === 'Quebrada Tambishi') {
        dir = 'top';
        offset = [0, -12];
    } else if (q.nombre === 'Quebrada Agua negra') {
        dir = 'top';
        offset = [0, -12];
    } else if (q.nombre === 'Quebrada Llanchama') {
        dir = 'right';
        offset = [12, 0];
    }

    marker.bindTooltip(q.nombre, { 
        permanent: true, 
        direction: dir, 
        offset: offset,
        className: 'map-label' 
    });
    bounds.extend([q.lat, q.lng]);
});

// Agregar Iquitos y Nauta (Centros Poblados)
const iquitosLat = -3.7491, iquitosLng = -73.2444;
const nautaLat = -4.5061, nautaLng = -73.5757;

L.marker([iquitosLat, iquitosLng], { icon: cityIcon }).addTo(map)
    .bindTooltip("<b>IQUITOS</b>", { permanent: true, direction: 'top', offset: [0, -5] });
bounds.extend([iquitosLat, iquitosLng]);

L.marker([nautaLat, nautaLng], { icon: cityIcon }).addTo(map)
    .bindTooltip("<b>NAUTA</b>", { permanent: true, direction: 'bottom', offset: [0, 5] });
bounds.extend([nautaLat, nautaLng]);

// Zona de Muestreo (Rectángulo Rojo)
// Expandimos un poco los límites de los puntos de las quebradas para hacer el marco
const padding = 0.05; 
const zonaBounds = [
    [bounds.getSouth() - padding, bounds.getWest() - padding],
    [bounds.getNorth() + padding, bounds.getEast() + padding]
];
L.rectangle(zonaBounds, { color: "red", weight: 2, fill: false }).addTo(map);

// Reserva Nacional Allpahuayo-Mishana (Placeholder Polígono)
// Como no tenemos el GeoJSON exacto, dibujamos un polígono representativo al oeste de Iquitos
const reservaCoords = [
    [-3.80, -73.40],
    [-3.85, -73.50],
    [-3.95, -73.45],
    [-4.00, -73.35],
    [-3.90, -73.30]
];
L.polygon(reservaCoords, {
    color: '#6b72e0',
    weight: 1,
    fillColor: '#6b72e0',
    fillOpacity: 0.5
}).addTo(map).bindTooltip("Reserva Nacional Allpahuayo-Mishana", { permanent: true, direction: 'center', className: 'reserva-label' });

// Ajustar vista del mapa principal
map.fitBounds(zonaBounds, { padding: [30, 30] });


// ==========================================
// MINIMAPA PERÚ
// ==========================================
const mapPeru = L.map('minimap-peru', {
    zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false
});
if (typeof peruGeoJSON !== 'undefined') {
    const peruLayer = L.geoJSON(peruGeoJSON, {
        style: { color: 'black', weight: 1, fillColor: 'white', fillOpacity: 1 }
    }).addTo(mapPeru);
    mapPeru.fitBounds(peruLayer.getBounds());
}

// ==========================================
// MINIMAPA LORETO
// ==========================================
const mapLoreto = L.map('minimap-loreto', {
    zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false
});
if (typeof loretoGeoJSON !== 'undefined') {
    const loretoLayer = L.geoJSON(loretoGeoJSON, {
        style: { color: 'black', weight: 1, fillColor: 'white', fillOpacity: 1 }
    }).addTo(mapLoreto);
    mapLoreto.fitBounds(loretoLayer.getBounds());
    
    // Punto rojo para Iquitos en minimapa de Loreto
    L.circleMarker([iquitosLat, iquitosLng], {
        color: 'red', fillColor: 'red', fillOpacity: 1, radius: 4
    }).addTo(mapLoreto).bindTooltip("Iquitos", { permanent: true, direction: 'top', offset: [0, -3] });
}
