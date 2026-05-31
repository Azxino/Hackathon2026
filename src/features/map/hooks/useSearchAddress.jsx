import { useState, useCallback } from "react";

export default function useSearchAddress() {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const search = useCallback(async (query) => {
        if (!query || query.trim().length < 3) { setResults([]); return; }
        setLoading(true);
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=co&viewbox=-75.65,6.18,-75.50,6.35&bounded=1`;
            const res = await fetch(url, {
                headers: { "Accept-Language": "es" }
            });
            const data = await res.json();
            setResults(data.map(r => ({
                label: r.display_name,
                lat: parseFloat(r.lat),
                lng: parseFloat(r.lon),
            })));
        } catch (e) {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const clear = useCallback(() => setResults([]), []);

    return { search, results, loading, clear };
}
