/**
 * @file LayerControls.jsx
 * @description Panel de control para la activación/desactivación de capas geoespaciales.
 * Muestra el conteo de elementos en cada categoría (homicidios, incidentes, etc.).
 */

/**
 * Renderiza los botones de control de capas.
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.layers - Objeto proveniente del hook useMapLayers.
 * @param {number} props.homTotal - Total de homicidios.
 * @param {boolean} props.homLoading - Estado de carga de homicidios.
 * @param {number} props.incTotal - Total de accidentes viales.
 * @param {boolean} props.incLoading - Estado de carga de accidentes.
 * @param {Array} props.policias - Array de estaciones de policía.
 * @param {boolean} props.polLoading - Estado de carga de policías.
 */
export default function LayerControls({ layers, homTotal, homLoading, incTotal, incLoading, policias, polLoading }) {
    const { showTraffic, setShowTraffic, showHomicidios, setShowHomicidios,
        showIncidentes, setShowIncidentes, showPolicias, setShowPolicias,
        showRadar, setShowRadar } = layers;

    return (
        <div className="map-layers">
            <button className={`map-layers__btn ${showTraffic ? "map-layers__btn--tra" : ""}`} onClick={() => setShowTraffic(v => !v)}>
                <span className="map-layers__dot" style={{ background: "#4aef44" }} />Tráfico
            </button>
            <button className={`map-layers__btn ${showHomicidios ? "map-layers__btn--hom" : ""}`} onClick={() => setShowHomicidios(v => !v)}>
                <span className="map-layers__dot" style={{ background: "#ef4444" }} />Homicidios
                <span className="map-layers__count">{!showHomicidios ? "—" : homLoading ? "..." : homTotal.toLocaleString()}</span>
            </button>
            <button className={`map-layers__btn ${showIncidentes ? "map-layers__btn--inc" : ""}`} onClick={() => setShowIncidentes(v => !v)}>
                <span className="map-layers__dot" style={{ background: "#f97316" }} />Accidentes
                <span className="map-layers__count">{!showIncidentes ? "—" : incLoading ? "..." : incTotal.toLocaleString()}</span>
            </button>
            <button className={`map-layers__btn ${showPolicias ? "map-layers__btn--pol" : ""}`} onClick={() => setShowPolicias(v => !v)}>
                <span className="map-layers__dot" style={{ background: "#3b82f6" }} />Policías
                <span className="map-layers__count">{!showPolicias ? "—" : polLoading ? "..." : policias.length}</span>
            </button>
            <button className={`map-layers__btn ${showRadar ? "map-layers__btn--rain" : ""}`} onClick={() => setShowRadar(v => !v)}>
                <span className="map-layers__dot" style={{ background: "#60a5fa" }} />Radar lluvia
            </button>
        </div>
    );
}