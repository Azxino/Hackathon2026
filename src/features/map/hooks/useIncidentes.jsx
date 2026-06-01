/**
 * @file useIncidentes.js
 * @description Hook personalizado para cargar, procesar y agrupar (cluster) puntos de 
 * incidentes de tránsito desde un archivo CSV. Optimiza la visualización agrupando 
 * puntos cercanos en celdas de cuadrícula.
 * @dependencies [React Hooks]
 */

import { useEffect, useState } from "react";

/**
 * Parsea una línea de CSV compleja, soportando valores entre comillas.
 * @param {string} line - Línea cruda del archivo CSV.
 * @returns {Array<string>} Array de columnas limpias.
 */
function parseCSVLine(line) {
    const result = []; let current = ""; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === "," && !inQuotes) { result.push(current.trim().replace(/\r/g, "")); current = ""; }
        else { current += ch; }
    }
    result.push(current.trim().replace(/\r/g, ""));
    return result;
}

/**
 * Agrupa una lista de puntos geográficos en una cuadrícula para optimizar el renderizado.
 * @param {Array<{lat: number, lng: number}>} points - Lista original de incidentes.
 * @param {number} [gridSize=0.003] - Tamaño de la celda de la cuadrícula en grados.
 * @returns {Array<{lat: number, lng: number, count: number}>} Lista de clusters calculados.
 */
function clusterPoints(points, gridSize = 0.003) {
    const grid = new Map();
    points.forEach((p) => {
        // Genera una clave única para cada celda de la cuadrícula
        const key = `${Math.round(p.lat / gridSize)},${Math.round(p.lng / gridSize)}`;

        if (!grid.has(key)) grid.set(key, { lat: 0, lng: 0, count: 0 });

        const cell = grid.get(key);
        cell.lat += p.lat; 
        cell.lng += p.lng; 
        cell.count += 1;
    });
    // Devuelve el centroide (promedio) de cada cluster con su frecuencia (count)
    return Array.from(grid.values()).map(c => ({
        lat: c.lat / c.count, lng: c.lng / c.count, count: c.count,
    }));
}

/**
 * Hook para cargar incidentes de tránsito y obtener clusters para el mapa.
 * @returns {{clusters: Array, total: number, loading: boolean}}
 * Datos agrupados, cantidad total de incidentes y estado de carga.
 */
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> d82ac0b (Preparando sincronización de versión 3.1.2)
export default function useIncidentes() {
    const [clusters, setClusters] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
<<<<<<< HEAD
=======
=======
export default function useIncidentes(enabled = false) {
    const [clusters, setClusters] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!enabled) return

        setLoading(true)

>>>>>>> cd387a5 (Update a v3.0.5: Mejoras en navegación e integración IA)
>>>>>>> d82ac0b (Preparando sincronización de versión 3.1.2)
        async function load() {
            try {
                const res = await fetch("/data/total_incidentes_transito.csv");
                const text = await res.text();
                const lines = text.trim().split("\n");

                // Identifica índices de columnas por encabezado
                const headers = parseCSVLine(lines[0]);
                const latIdx = headers.indexOf("latitud");
                const lngIdx = headers.indexOf("longitud");

                const points = [];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const cols = parseCSVLine(lines[i]);
                    const lat = parseFloat(cols[latIdx]);
                    const lng = parseFloat(cols[lngIdx]);

                    // Valida que los datos sean numéricos y no nulos (0)
                    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                        points.push({ lat, lng });
                    }
                }
                setTotal(points.length);
                setClusters(clusterPoints(points));
            } catch (e) { console.error("Error incidentes:", e); }
            finally { setLoading(false); }
        }
        load();
<<<<<<< HEAD
    }, []);
=======
<<<<<<< HEAD
    }, []);
=======
    }, [enabled]);
>>>>>>> cd387a5 (Update a v3.0.5: Mejoras en navegación e integración IA)
>>>>>>> d82ac0b (Preparando sincronización de versión 3.1.2)

    return { clusters, total, loading };
}
