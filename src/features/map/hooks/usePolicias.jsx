import { useEffect, useState } from "react";

export default function usePolicias() {
    const [policias, setPolicias] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/data/policias.csv");
                const text = await res.text();
                const lines = text.trim().split("\n");
                const headers = lines[0].split(",").map(h => h.trim().replace(/\r/g, ""));

                const latIdx = headers.indexOf("latitud");
                const lngIdx = headers.indexOf("longitud");
                const nombreIdx = headers.indexOf("nombre");
                const tipoIdx = headers.indexOf("tipo");
                const dirIdx = headers.indexOf("direccion");
                const telIdx = headers.indexOf("telefono");

                const points = [];
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",").map(c => c.trim().replace(/\r/g, ""));
                    const lat = parseFloat(cols[latIdx]);
                    const lng = parseFloat(cols[lngIdx]);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        points.push({
                            lat, lng,
                            nombre: cols[nombreIdx] || "",
                            tipo: cols[tipoIdx] || "",
                            direccion: cols[dirIdx] || "",
                            telefono: cols[telIdx] || "",
                        });
                    }
                }
                setPolicias(points);
            } catch (e) {
                console.error("Error cargando policias:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { policias, loading };
}
