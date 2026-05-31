import { useEffect, useState, useCallback } from "react";

const GEO_OPTIONS = {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 15000,
};

function useLocation() {
    const [ubicacion, setUbicacion] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const start = useCallback(() => {
        setCargando(true);
        setError(null);

        // Primero intentamos getCurrentPosition para tener algo rápido
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUbicacion([pos.coords.latitude, pos.coords.longitude]);
                setCargando(false);
            },
            () => {
                // Si falla getCurrentPosition no mostramos error todavía,
                // watchPosition puede aún funcionar
            },
            { ...GEO_OPTIONS, timeout: 8000 }
        );

        // watchPosition actualiza la posición continuamente
        const id = navigator.geolocation.watchPosition(
            (pos) => {
                setUbicacion([pos.coords.latitude, pos.coords.longitude]);
                setCargando(false);
                setError(null);
            },
            (err) => {
                // Solo mostramos error si aún no tenemos ubicación
                setUbicacion((prev) => {
                    if (!prev) setError(err.message);
                    return prev;
                });
                setCargando(false);
            },
            GEO_OPTIONS
        );

        return id;
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Tu navegador no soporta geolocalización");
            setCargando(false);
            return;
        }

        const id = start();
        return () => navigator.geolocation.clearWatch(id);
    }, [start]);

    const reintentar = useCallback(() => {
        start();
    }, [start]);

    return { ubicacion, cargando, error, reintentar };
}

export default useLocation;