/**
 * @file useMapRoutes.js
 * @description Hook personalizado para gestionar el cálculo, almacenamiento y selección
 * de rutas de navegación. Implementa lógica para calcular rutas "rápidas" (óptimas)
 * y rutas "seguras" (alternativas).
 * @dependencies [React, services/getRoute]
 */

import { useState, useRef } from "react";
import getRoute from "../services/getRoute";

/**
 * Gestiona el estado de la navegación en el mapa.
 * @param {Array} ubicacion - Coordenadas actuales del usuario [lat, lng].
 * @returns {Object}        - Estados y funciones para controlar la navegación.
 */
export default function useMapRoutes(ubicacion) {
    const [routeFast,    setRouteFast]    = useState(null);
    const [routeSafe,    setRouteSafe]    = useState(null);
    const [routeInfo,    setRouteInfo]    = useState(null);
    const [routeType,    setRouteType]    = useState("fast");
    const [routeLoading, setRouteLoading] = useState(false);
    const [destination,  setDestination]  = useState(null);

    // Ref para evitar llamadas concurrentes a la API mientras una está en curso
    const fetchingRoute = useRef(false);

    /**
     * Define el destino y resetea las rutas previas.
     * @param {Array|null} pos - Coordenadas de destino.
     */
    const handleSelectDestino = (pos) => {
        setDestination(pos);
        if (!pos) { setRouteFast(null); setRouteSafe(null); setRouteInfo(null); }
    };

    /**
     * Calcula rutas rápidas y seguras simultáneamente.
     * @param {Array} dest - Coordenadas de destino.
     */
    const fetchRoutes = async (dest) => {
        if (!ubicacion || !dest || fetchingRoute.current) return;
        fetchingRoute.current = true;
        setRouteLoading(true);
        try {
            // Cálculo de ruta rápida directa
            const fast = await getRoute(ubicacion, dest);
            setRouteFast(fast.geometry);
            setRouteInfo({ distance: fast.distance, duration: fast.duration });

            // Cálculo de ruta "segura" mediante un punto de desviación (waypoint)
            const midLat = (ubicacion[0] + dest[0]) / 2 + 0.005;
            const midLng = (ubicacion[1] + dest[1]) / 2 + 0.005;
            const leg1 = await getRoute(ubicacion, [midLat, midLng]);
            const leg2 = await getRoute([midLat, midLng], dest);
            setRouteSafe({ type: "LineString", coordinates: [...(leg1.geometry.coordinates || []), ...(leg2.geometry.coordinates || [])] });
        } catch (err) {
            console.error("Error calculando rutas:", err);
        } finally {
            setRouteLoading(false);
            fetchingRoute.current = false;
        }
    };

    return {
        routeFast, routeSafe, routeInfo,
        routeType, setRouteType,
        routeLoading, destination,
        handleSelectDestino, fetchRoutes,
    };
}