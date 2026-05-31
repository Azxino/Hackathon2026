
/**
 * @file useRouteProgress.js
 * @description Hook para monitorear el progreso de una ruta y detectar desviaciones.
 * Utiliza la fórmula de Haversine para calcular la distancia mínima entre la posición 
 * actual y el trazado de la ruta.
 */

import { useState, useRef, useEffect } from 'react';

const R = 6371e3; // Radio de la Tierra en metros

/**
 * Calcula la distancia en metros entre dos puntos geográficos usando la fórmula de Haversine.
 * @param {Array<number>} a - Punto de origen [lat, lng].
 * @param {Array<number>} b - Punto de destino [lat, lng].
 * @returns {number} Distancia en metros.
 */
function haversine(a, b) {
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

// Umbral base de desviación en metros y conteo para evitar falsos positivos por errores de GPS
const DEVIATION_THRESHOLD = 10;
const PERSISTENCE_COUNT = 3;

/**
 * Hook para evaluar si el usuario se ha desviado de su ruta planeada.
 * @param {Array<number>} ubicacion     - Posición actual del usuario [lat, lng].
 * @param {Array<Array<number>>} route  - Array de coordenadas que conforman la ruta.
 * @param {number} [accuracy=0]         - Nivel de precisión del GPS en metros para ajustar el umbral.
 * @returns {{desviacion: boolean, distanciaAlPuntoMasCercano: number}}
 */
export default function useRouteProgress(ubicacion, route, accuracy = 0) {
    const [desviacion, setDesviacion] = useState(false);
    const [distancia, setDistancia] = useState(0);
    const contadorDesviacion = useRef(0);

    useEffect(() => {
        if (!ubicacion || !route || route.length < 2) return;

        // 1. Calcular la distancia mínima al punto más cercano
        let minDist = Infinity;
        for (let i = 0; i < route.length; i++) {
            const d = haversine(ubicacion, route[i]);
            if (d < minDist) minDist = d;
        }

        setDistancia(Math.round(minDist));

        // 2. Lógica de umbral y persistencia
        const effectiveThreshold = Math.max(DEVIATION_THRESHOLD, accuracy);
        const estaFuera = minDist > effectiveThreshold;

        // 3. Sistema de persistencia: se requiere superar el umbral varias veces consecutivas 
        // para marcar una desviación real (evita lecturas erráticas del GPS)
        if (estaFuera) {
            contadorDesviacion.current += 1;
        } else {
            contadorDesviacion.current = 0;
            setDesviacion(false);
        }

        if (contadorDesviacion.current >= PERSISTENCE_COUNT) {
            setDesviacion(true);
        }
    }, [ubicacion, route, accuracy]);

    return { 
        desviacion, 
        distanciaAlPuntoMasCercano: distancia 
    };
}