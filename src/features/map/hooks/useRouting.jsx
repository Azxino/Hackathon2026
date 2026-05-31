import { useEffect, useRef, useState } from "react";
import { getRoute } from "../services/routeService";

const RECALC_THRESHOLD = 0.001; // ~100m, para la primera carga

function useRouting(start, end, desviacion = false) {
    const [route, setRoute] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const prevStartRef = useRef(null);
    const prevEndRef = useRef(null);
    const isRecalculating = useRef(false);

    useEffect(() => {
        if (!start || !end) return;

        const startChanged =
            !prevStartRef.current ||
            Math.abs(prevStartRef.current[0] - start[0]) > RECALC_THRESHOLD ||
            Math.abs(prevStartRef.current[1] - start[1]) > RECALC_THRESHOLD;

        const endChanged =
            !prevEndRef.current ||
            prevEndRef.current[0] !== end[0] ||
            prevEndRef.current[1] !== end[1];

        // Recalcular si: primera vez, cambió destino, o está desviado
        const shouldFetch = startChanged || endChanged || desviacion;

        if (!shouldFetch) return;
        if (isRecalculating.current) return; // evitar fetch doble

        prevStartRef.current = start;
        prevEndRef.current = end;
        isRecalculating.current = true;

        const fetchRoute = async () => {
            try {
                setLoading(true);
                setError(null);

                const { coordinates, distance, duration } = await getRoute(start, end);

                setRoute(coordinates);
                setRouteInfo({ distance, duration });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
                isRecalculating.current = false;
            }
        };

        fetchRoute();
    }, [start, end, desviacion]);

    return { route, routeInfo, loading, error };
}

export default useRouting;