/**
 * @file usePolicias.js
 * @description Hook personalizado de React para cargar y normalizar datos de estaciones
 * de policía desde un archivo CSV local. Realiza la lectura, el parseo de encabezados
 * y la conversión de coordenadas a números.
 * @dependencies [React Hooks]
 */

import { useEffect, useState } from "react";

/**
 * Hook para obtener la lista de estaciones de policía.
 * @returns {{policias: Array<{lat: number, lng: number, nombre: string, direccion: string}>, loading: boolean}}
 * Objeto con la lista de policías normalizada y el estado de carga actual.
 */
export default function usePolicias() {
    const [policias, setPolicias] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                // Petición al archivo CSV ubicado en la carpeta public/data
                const res = await fetch("/data/policias.csv");
                const text = await res.text();

                // Parseo básico del CSV
                const lines = text.trim().split("\n");
                
                // Limpieza de encabezados para identificar columnas
                const headers = lines[0].split(",").map(h => h.trim().replace(/\r/g, ""));
                
                const latIdx = headers.indexOf("latitud");
                const lngIdx = headers.indexOf("longitud");
                const nombreIdx = headers.indexOf("nombre");
                const dirIdx = headers.indexOf("direccion");

                const points = [];
                // Iteración sobre cada fila de datos (saltando el encabezado)
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(",").map(c => c.trim().replace(/\r/g, ""));
                    const lat = parseFloat(cols[latIdx]);
                    const lng = parseFloat(cols[lngIdx]);

                    // Validación de coordenadas para asegurar la integridad de los datos
                    if (!isNaN(lat) && !isNaN(lng)) {
                        points.push({ lat, lng, nombre: cols[nombreIdx] || "", direccion: cols[dirIdx] || "" });
                    }
                }
                setPolicias(points);
            } catch (e) { console.error("Error policias:", e); }
            finally { setLoading(false); }
        }
        load();
    }, []);

    return { policias, loading };
}
