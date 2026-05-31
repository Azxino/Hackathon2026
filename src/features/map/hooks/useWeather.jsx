import { useEffect, useState } from "react";

const WEATHER_ICONS = {
    0: { icon: "☀️", label: "Despejado" },
    1: { icon: "🌤️", label: "Mayormente despejado" },
    2: { icon: "⛅", label: "Parcialmente nublado" },
    3: { icon: "☁️", label: "Nublado" },
    45: { icon: "🌫️", label: "Neblina" },
    48: { icon: "🌫️", label: "Niebla con escarcha" },
    51: { icon: "🌦️", label: "Llovizna leve" },
    53: { icon: "🌦️", label: "Llovizna" },
    55: { icon: "🌧️", label: "Llovizna intensa" },
    61: { icon: "🌧️", label: "Lluvia leve" },
    63: { icon: "🌧️", label: "Lluvia moderada" },
    65: { icon: "🌧️", label: "Lluvia intensa" },
    80: { icon: "🌦️", label: "Chubascos leves" },
    81: { icon: "🌧️", label: "Chubascos" },
    82: { icon: "⛈️", label: "Chubascos fuertes" },
    95: { icon: "⛈️", label: "Tormenta" },
    96: { icon: "⛈️", label: "Tormenta con granizo" },
    99: { icon: "⛈️", label: "Tormenta fuerte" },
};

export default function useWeather(ubicacion) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!ubicacion) return;

        const [lat, lng] = ubicacion;

        async function fetchWeather() {
            setLoading(true);
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&timezone=auto`;
                const res = await fetch(url);
                const data = await res.json();

                const code = data.current.weathercode;
                const meta = WEATHER_ICONS[code] || { icon: "🌡️", label: "Desconocido" };

                setWeather({
                    temp: Math.round(data.current.temperature_2m),
                    humidity: data.current.relativehumidity_2m,
                    wind: Math.round(data.current.windspeed_10m),
                    code,
                    icon: meta.icon,
                    label: meta.label,
                });
            } catch (e) {
                console.error("Weather error:", e);
            } finally {
                setLoading(false);
            }
        }

        fetchWeather();

        // Refresh cada 10 minutos
        const interval = setInterval(fetchWeather, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, [ubicacion?.[0], ubicacion?.[1]]);

    return { weather, loading };
}
