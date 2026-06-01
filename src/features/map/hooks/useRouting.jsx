/**
 * @file useRouting.js
 * @description Hook personalizado de React para la gestión del enrutamiento geográfico.
 * Implementa una lógica de actualización eficiente comparando cambios en coordenadas 
 * contra un umbral (RECALC_THRESHOLD) para evitar peticiones innecesarias a la API de OSRM.
 * @dependencies [React Hooks, getRoute service]
 */

import { useEffect, useRef, useState } from "react";
import getRoute from "../services/getRoute";

// Umbral mínimo de movimiento en grados decimales para disparar un recálculo.
// Evita peticiones constantes si el usuario o el GPS se mueven ligeramente.
const RECALC_THRESHOLD = 0.001;

/**
 * Gestiona el ciclo de vida de una ruta entre dos puntos, incluyendo carga y manejo de errores.
 * @param {Array<number>} start - Coordenadas [lat, lng] de origen.
 * @param {Array<number>} end - Coordenadas [lat, lng] de destino.
 * @param {boolean} [desviacion=false] - Flag para forzar el recálculo incluso si el movimiento es pequeño.
 * @returns {{route: Object|null, routeInfo: Object|null, loading: boolean, error: string|null}}
 * Objeto con la geometría, metadatos, estado de carga y posibles errores.
 */
export default function useRouting(start, end, desviacion = false) {
    const [route, setRoute] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Refs para persistir valores entre renderizados sin disparar efectos
    const prevStartRef = useRef(null);
    const prevEndRef = useRef(null);
    const fetchingRef = useRef(false); // Flag para evitar llamadas concurrentes

    useEffect(() => {
        if (!start || !end) return;

        // Comprobación de cambios significativos según el umbral
        const startChanged =
            !prevStartRef.current ||
            Math.abs(prevStartRef.current[0] - start[0]) > RECALC_THRESHOLD ||
            Math.abs(prevStartRef.current[1] - start[1]) > RECALC_THRESHOLD;

        const endChanged =
            !prevEndRef.current ||
            prevEndRef.current[0] !== end[0] ||
            prevEndRef.current[1] !== end[1];

        // Regla de negocio: solo recalcular si hay cambio relevante o si se fuerza por desviación
        if (!startChanged && !endChanged && !desviacion) return;
        if (fetchingRef.current) return;

        prevStartRef.current = start;
        prevEndRef.current = end;
        fetchingRef.current = true;

        const fetchRoute = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getRoute(start, end);
                setRoute(data.geometry);
                setRouteInfo({ distance: data.distance, duration: data.duration });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
                fetchingRef.current = false;
            }
        };

        fetchRoute();
    }, [start, end, desviacion]);

    return { route, routeInfo, loading, error };
}
