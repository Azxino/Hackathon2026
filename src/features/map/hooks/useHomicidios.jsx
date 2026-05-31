/**
 * @file useHomicidios.js
 * @description Hook personalizado para cargar y agrupar (cluster) datos de homicidios 
 * desde un archivo CSV. Agrupa incidentes por ubicación geográfica utilizando una 
 * cuadrícula para facilitar la visualización en mapas de alta densidad.
 * @dependencies [React Hooks]
 */

import { useEffect, useState } from "react";

/**
 * Agrupa una lista de puntos geográficos en una cuadrícula.
 * @param {Array<{lat: number, lng: number, barrio: string}>} points - Lista de incidentes.
 * @param {number} [gridSize=0.003] - Tamaño de la celda de la cuadrícula en grados.
 * @returns {Array<{lat: number, lng: number, count: number, barrio: string}>} Lista de clusters.
 */
function clusterPoints(points, gridSize = 0.003) {
    const grid = new Map();
    points.forEach((p) => {
        // La clave de la cuadrícula agrupa los puntos por cercanía
        const key = `${Math.round(p.lat / gridSize)},${Math.round(p.lng / gridSize)}`;

        if (!grid.has(key)) grid.set(key, { lat: 0, lng: 0, count: 0, barrio: p.barrio });
        
        const cell = grid.get(key);
        cell.lat += p.lat; 
        cell.lng += p.lng; 
        cell.count += 1;
    });

    // Calcula el promedio (centroide) de cada grupo
    return Array.from(grid.values()).map(c => ({
        lat: c.lat / c.count, 
        lng: c.lng / c.count, 
        count: c.count, 
        barrio: c.barrio,
    }));
}

/**
 * Hook para gestionar la carga y el procesamiento de los incidentes de homicidio.
 * @returns {{clusters: Array, total: number, loading: boolean}}
 * Datos agrupados, cantidad total de registros y estado de carga.
 */
export default function useHomicidios() {
    const [clusters, setClusters] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/data/homicidio.csv");
                const text = await res.text();
                const lines = text.trim().split("\n");

                // Mapeo de índices basado en los encabezados del CSV
                const headers = lines[0].split(",").map(h => h.trim().replace(/\r/g, ""));
                const latIdx = headers.indexOf("latitud");
                const lngIdx = headers.indexOf("longitud");
                const barrioIdx = headers.indexOf("nombre_barrio");

                const points = [];
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",");
                    const lat = parseFloat(cols[latIdx]);
                    const lng = parseFloat(cols[lngIdx]);

                    // Validación básica de coordenadas para descartar datos corruptos
                    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                        points.push({ lat, lng, barrio: (cols[barrioIdx] || "").trim().replace(/\r/g, "") });
                    }
                }
                setTotal(points.length);
                setClusters(clusterPoints(points));
            } catch (e) { console.error("Error homicidios:", e); }
            finally { setLoading(false); }
        }
        load();
    }, []);

    return { clusters, total, loading };
}
