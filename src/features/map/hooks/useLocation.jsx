/**
 * @file useLocation.js
 * @description Hook personalizado de React para gestionar la geolocalización del usuario.
 * Utiliza la API nativa del navegador para obtener la posición actual y realizar un
 * seguimiento (watch) en tiempo real, incluyendo manejo de errores y reintentos.
 * @dependencies [React Hooks, Geolocation API]
 */

import { useEffect, useState, useCallback } from "react";

// Opciones de configuración para la precisión del GPS
const Geo_options = {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 15000,
}

/**
 * Hook para monitorear la ubicación geográfica del usuario.
 * @returns {{ubicacion: Array<number>|null, cargando: boolean, error: string|null, reintentar: Function}}
 * Retorna la latitud/longitud, estado de carga, posibles errores y una función para forzar el inicio/reintento.
 */
function useLocation() {
    const [ubicacion, setUbicacion] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)

    /**
     * Inicia el proceso de geolocalización.
     * Realiza una petición puntual (getCurrentPosition) y activa un observador continuo (watchPosition).
     */
    const start = useCallback(() => {
        setCargando(true)
        setError(null)

        // Intento inicial para obtener posición rápida
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUbicacion([
                    pos.coords.latitude,
                    pos.coords.longitude
                ])
                setCargando(false)
            },
            () => { }, // Silenciar error inicial si falla (el watchPosition se encargará después)
            { ...Geo_options, timeout: 8000 }
        )

        // Observador de cambios en tiempo real
        const id = navigator.geolocation.watchPosition(
            (pos) => {
                // Solo reporta error si aún no tenemos una ubicación previa
                setUbicacion([
                    pos.coords.latitude,
                    pos.coords.longitude
                ])
                setCargando(false)
                setError(null)
            },
            (err) => {
                setUbicacion((prev) => {
                    if (!prev) setError(err.message)
                    return prev
                })
                setCargando(false)
            },
            Geo_options
        )

        return id
    }, [])

    useEffect(() => {
        // Verificación de soporte de la API
        if (!navigator.geolocation) {
            setError("Tu navegador no soporta geolocalización");
            setCargando(false);
            return;
        }

        const id = start();

        // Limpieza del observador al desmontar el componente
        return () => navigator.geolocation.clearWatch(id);
    }, [start]);

    /**
     * Función expuesta para disparar manualmente el inicio de la geolocalización.
     */
    const reintentar = useCallback(() => {
        start();
    }, [start]);

    return { ubicacion, cargando, error, reintentar };
}

export default useLocation