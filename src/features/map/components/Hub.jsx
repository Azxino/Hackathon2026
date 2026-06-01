/**
 * @file Hub.jsx
 * @description Componente de interfaz tipo HUD (Heads-Up Display) que muestra información 
 * crítica de la navegación, como el estado de la ruta, distancia restante y tiempo estimado.
 * @dependencies [React]
 */

/**
 * Formatea una distancia en metros a una representación legible (metros o km).
 * @param {number|null} meters  - Distancia en metros.
 * @returns {string}            - Distancia formateada.
 */
function formatDistance(meters) {
    if (meters == null) return "—";

    return meters >= 1000
        ? (meters / 1000).toFixed(1) + " km"
        : Math.round(meters) + " m";
}

/**
 * Formatea una duración en segundos a una representación legible (minutos u horas y minutos).
 * @param {number|null} seconds - Duración en segundos.
 * @returns {string}            - Duración formateada.
 */
function formatDuration(seconds) {
    if (seconds == null) return "—";

    const m = Math.round(seconds / 60);

    if (m < 60) return `${m} min`;

    const h = Math.floor(m / 60);
    const min = m % 60;

    return `${h}h ${min}min`;
}

/**
 * Componente HUD para visualización de métricas de navegación.
 * @param {Object} props                - Propiedades del componente.
 * @param {boolean} props.desviacion    - Indica si el usuario se ha salido de la ruta trazada.
 * @param {Object} [props.routeInfo]    - Objeto con datos de la ruta (distance en metros, duration en segundos).
 */
export default function HUD({ desviacion, routeInfo }) {
    return (
        <div className="map-hud">

            {/* Estado */}
            <div className="map-hud__label">Estado</div>

            <div style={{ marginBottom: 10 }}>
                <span
                    className={`map-hud__badge ${desviacion
                            ? "map-hud__badge--warn"
                            : "map-hud__badge--ok"
                        }`}
                >
                    {desviacion ? "⚠ Fuera de ruta" : "✓ En ruta"}
                </span>
            </div>

            <hr className="map-hud__divider" />

            {/* Distancia */}
            <div className="map-hud__label">Distancia</div>
            <div className="map-hud__value--sm">
                {formatDistance(routeInfo?.distance)}
            </div>

            {/* Tiempo */}
            <div className="map-hud__label">Tiempo estimado</div>
            <div className="map-hud__value--sm">
                {formatDuration(routeInfo?.duration)}
            </div>

        </div>
    );
}