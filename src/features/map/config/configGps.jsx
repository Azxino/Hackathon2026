/**
 * @file configGps.js
 * @description Hook de configuración para el seguimiento de ubicación en mapas (MapLibre).
 * Implementa una lógica de centrado inteligente: centra automáticamente al obtener
 * la primera ubicación y sigue al usuario mientras este no haya interactuado manualmente 
 * con el mapa.
 * @dependencies [React Hooks]
 */

import { useEffect, useRef } from "react";

/**
 * Configura el comportamiento de centrado del mapa basado en la ubicación del GPS.
 * @param {Object} params                       - Parámetros de configuración.
 * @param {Array<number>|null} params.ubicacion - Coordenadas actuales [lat, lng].
 * @param {Function} params.setViewState        - Función para actualizar la vista del mapa.
 * @param {boolean} params.userMoved            - Flag que indica si el usuario ha interactuado/desplazado el mapa manualmente.
 */
export default function configGps({ ubicacion, setViewState, userMoved }) {
    // Referencia para asegurar que solo se centre automáticamente en el primer fix de GPS
    const firstFix = useRef(false);

    useEffect(() => {
        if (!ubicacion) return;

        // Caso 1: Primera ubicación recibida
        // Centramos el mapa inmediatamente para mostrar al usuario dónde está
        if (!firstFix.current) {
            firstFix.current = true;
            const [lat, lng] = ubicacion;
            setViewState(prev => ({ ...prev, longitude: lng, latitude: lat }));
        }

        // Caso 2: Seguimiento activo
        // Si el usuario no ha realizado un movimiento manual (pan/zoom), seguimos actualizando el centro
        else if (!userMoved) {
            const [lat, lng] = ubicacion;
            setViewState(prev => ({ ...prev, longitude: lng, latitude: lat }));
        }
    }, [ubicacion]);
}
