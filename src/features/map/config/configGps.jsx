import { useEffect, useRef } from "react";

/**
 * Sigue al usuario con GPS pero NO bloquea el mapa.
 * - Solo centra al INICIO (primera ubicación)
 * - Si el usuario mueve el mapa manualmente, deja de seguir
 * - Botón de recentrar disponible en MapLibre
 */
export default function configGps({ ubicacion, setViewState, userMoved }) {
    const firstFix = useRef(false);

    useEffect(() => {
        if (!ubicacion) return;

        // Solo centra la primera vez
        if (!firstFix.current) {
            firstFix.current = true;
            const [lat, lng] = ubicacion;
            setViewState(prev => ({ ...prev, longitude: lng, latitude: lat }));
        }
        // Si el usuario no ha movido el mapa manualmente, seguir al GPS
        else if (!userMoved) {
            const [lat, lng] = ubicacion;
            setViewState(prev => ({ ...prev, longitude: lng, latitude: lat }));
        }
    }, [ubicacion]);
}
