import { useEffect, useState } from "react";

// Parser CSV que respeta campos entre comillas
function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
            result.push(current.trim().replace(/\r/g, ""));
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current.trim().replace(/\r/g, ""));
    return result;
}

function clusterPoints(points, gridSize = 0.003) {
    const grid = new Map();
    points.forEach((p) => {
        const key = `${Math.round(p.lat / gridSize)},${Math.round(p.lng / gridSize)}`;
        if (!grid.has(key)) {
            grid.set(key, { lat: 0, lng: 0, count: 0, clase: p.clase, gravedad: p.gravedad });
        }
        const cell = grid.get(key);
        cell.lat += p.lat;
        cell.lng += p.lng;
        cell.count += 1;
    });
    return Array.from(grid.values()).map(cell => ({
        lat: cell.lat / cell.count,
        lng: cell.lng / cell.count,
        count: cell.count,
        clase: cell.clase,
        gravedad: cell.gravedad,
    }));
}

export default function useIncidentes() {
    const [clusters, setClusters] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/data/total_incidentes_transito.csv");
                const text = await res.text();
                const lines = text.trim().split("\n");

                const headers = parseCSVLine(lines[0]);
                const latIdx = headers.indexOf("latitud");
                const lngIdx = headers.indexOf("longitud");
                const claseIdx = headers.indexOf("clase");
                const gravedadIdx = headers.indexOf("gravedad");

                const points = [];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const cols = parseCSVLine(lines[i]);
                    const lat = parseFloat(cols[latIdx]);
                    const lng = parseFloat(cols[lngIdx]);
                    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                        points.push({
                            lat, lng,
                            clase: cols[claseIdx] || "",
                            gravedad: cols[gravedadIdx] || "",
                        });
                    }
                }
                setTotal(points.length);
                setClusters(clusterPoints(points));
            } catch (e) {
                console.error("Error cargando incidentes:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return { clusters, total, loading };
}
