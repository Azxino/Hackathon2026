/**
 * @file useSmartRoutes.js
 * @description Hook personalizado de React para gestionar la obtención de rutas inteligentes.
 * Encapsula la lógica de asincronía, el estado de carga (loading) y la actualización
 * de rutas cuando cambian las coordenadas de origen o destino.
 * @dependencies [React Hooks, getSmartRoutes service]
 */

import { useEffect, useState } from "react";
import getSmartRoutes from "../services/getSmartRoutes";

/**
 * Hook para obtener y gestionar rutas entre dos puntos.
 * @param {Array<number>} start - Coordenadas de inicio [lat, lng].
 * @param {Array<number>} end - Coordenadas de destino [lat, lng].
 * @param {string} key - Clave de API para el servicio de TomTom.
 * @returns {{routes: {fast: Object, eco: Object}|null, loading: boolean}}
 * Retorna un objeto con las rutas (rápida y ecológica) y el estado de carga actual.
 */
export default function useSmartRoutes(start, end, key) {
    const [routes, setRoutes] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Evita ejecuciones innecesarias si los parámetros no están definidos
        if (!start || !end) return;

        const run = async () => {
            setLoading(true);

            // Obtiene las rutas desde el servicio externo
            const result = await getSmartRoutes(start, end, key);

            if (result) {
                // Asigna la primera ruta como 'fast' y la segunda como 'eco' (fallback a 'fast' si no hay 2)
                const fast = result[0];
                const eco = result[1] || result[0];

                setRoutes({
                    fast,
                    eco,
                });
            }

            setLoading(false);
        };

        run();
    }, [start, end]); // Se añade 'key' a las dependencias para evitar desactualización

    return { routes, loading };
}