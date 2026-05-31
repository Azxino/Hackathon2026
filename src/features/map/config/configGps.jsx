import { useEffect } from "react";

export default function configGps({
    ubicacion,
    setViewState
}) {
    useEffect(() => {
        if (!ubicacion) return

        const [lat, lng] = ubicacion

        setViewState((prev) => ({
            ...prev,
            longitude: lng,
            latitude: lat,
            zoom: 16
        }))
    }, [ubicacion, setViewState])
}