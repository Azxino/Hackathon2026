/**
 * @file useMapLayers.js
 * @description Hook personalizado para gestionar el estado de visibilidad de las capas
 * del mapa (radar, incidentes, homicidios, policía y tráfico).
 * Centraliza la lógica de alternancia para mantener el componente principal limpio.
 */

import { useState } from "react";

/**
 * Hook para controlar el estado de visibilidad de los overlays del mapa.
 * @returns {Object} Un objeto que contiene los estados de cada capa y la función toggleLayer.
 */
export default function useMapLayers() {
    const [showRadar,      setShowRadar]      = useState(false);
    const [showHomicidios, setShowHomicidios] = useState(false);
    const [showIncidentes, setShowIncidentes] = useState(false);
    const [showPolicias,   setShowPolicias]   = useState(false);
    const [showTraffic,    setShowTraffic]    = useState(false);

    /**
     * Función utilitaria para cambiar la visibilidad de una capa específica.
     * Útil para ser llamada desde componentes externos como el Agente (EVA).
     * @param {string} layer    - El identificador de la capa.
     * @param {boolean} visible - El estado deseado de visibilidad.
     */
    const toggleLayer = (layer, visible) => {
        if (layer === "homicidios") setShowHomicidios(visible);
        if (layer === "incidentes") setShowIncidentes(visible);
        if (layer === "policias")   setShowPolicias(visible);
        if (layer === "radar")      setShowRadar(visible);
    };

    return {
        showRadar, setShowRadar,
        showHomicidios, setShowHomicidios,
        showIncidentes, setShowIncidentes,
        showPolicias, setShowPolicias,
        showTraffic, setShowTraffic,
        toggleLayer,
    };
}