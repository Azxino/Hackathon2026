/**
 * @file RouteSelector.jsx
 * @description Componente de interfaz que permite al usuario alternar entre 
 * diferentes estrategias de enrutamiento (Rápida vs Segura).
 */

/**
 * Selector de tipo de ruta.
 * @param {Object} props - Propiedades del componente.
 * @param {string} props.routeType - Tipo actual seleccionado ("fast" o "safe").
 * @param {Function} props.setRouteType - Función para actualizar el tipo de ruta.
 * @param {Object|null} props.routeFast - Datos de la ruta rápida.
 * @param {Object|null} props.routeSafe - Datos de la ruta segura.
 * @param {Array|null} props.destination - Coordenadas del destino actual.
 */
export default function RouteSelector({ routeType, setRouteType, routeFast, routeSafe, destination }) {
    // Solo renderizamos si hay un destino y al menos una ruta calculada
    if (!destination || (!routeFast && !routeSafe)) return null;
    
    return (
        <div className="route-selector">
            <button className={`route-selector__btn ${routeType === "fast" ? "route-selector__btn--active-fast" : ""}`} onClick={() => setRouteType("fast")}>
                🟦 Rápida
            </button>
            <button className={`route-selector__btn ${routeType === "safe" ? "route-selector__btn--active-safe" : ""}`} onClick={() => setRouteType("safe")}>
                🟩 Segura
            </button>
        </div>
    );
}