/**
 * @file useHeading.js
 * @description Hook personalizado de React para obtener la orientación (heading) del dispositivo
 * en tiempo real utilizando la API 'deviceorientation'.
 * @dependencies [React Hooks, Web Device Orientation API]
 */

import { useEffect, useState } from "react";

/**
 * Hook para monitorear la dirección hacia la que apunta el dispositivo.
 * @returns {number} El ángulo de orientación (alpha) en grados (0° a 360°).
 */
export default function useHeading() {
    const [heading, setHeading] = useState(0);

    useEffect(() => {
        /**
         * Manejador para el evento de orientación del dispositivo.
         * @param {DeviceOrientationEvent} event - Evento de orientación.
         */
        const handler = (event) => {
            // 'alpha' representa el giro alrededor del eje Z (dirección de la brújula)
            if (event.alpha !== null) {
                setHeading(event.alpha); // dirección del dispositivo
            }
        };

        // Escucha el cambio de orientación del dispositivo
        window.addEventListener("deviceorientation", handler);

        // Limpieza: elimina el listener al desmontar el componente para evitar fugas de memoria
        return () =>
            window.removeEventListener("deviceorientation", handler);
    }, []);

    return heading;
}