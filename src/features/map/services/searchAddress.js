/**
 * @file searchAddress.js
 * @description Servicio de geocodificación que utiliza la API de MapTiler.
 * Permite buscar direcciones y convertir nombres de lugares en coordenadas [lat, lng].
 * Restringido geográficamente a Colombia (country=co).
 * @service MapTiler Geocoding API
 */

/**
 * Busca ubicaciones geográficas utilizando la API de MapTiler Geocoding.
 * Esta función realiza una petición GET a MapTiler para obtener hasta 10 resultados
 * de direcciones o lugares basados en una cadena de búsqueda, restringiendo los
 * resultados a Colombia (co) y en idioma español (es).
 *
 * @async
 * @param {string} query - El texto de la dirección o lugar a buscar.
 * @returns {Promise<Array<{label: string, lat: number, lng: number}>>} 
 * Una promesa que resuelve en un array de objetos normalizados, 
 * cada uno con una etiqueta (label) y coordenadas (lat, lng). 
 * Retorna un array vacío si no hay resultados o si la respuesta es inválida.
 */
export default async function searchAddress(query) {
    const KEY =
        import.meta.env.VITE_MAPTILER_KEY;

    // Construcción de la URL con parámetros de búsqueda:
    // - language: Fuerza los resultados en español.
    // - country: Restringe la búsqueda a Colombia ('co').
    // - limit: Define el número máximo de resultados (10).
    const url =
        `https://api.maptiler.com/geocoding/` +
        `${encodeURIComponent(query)}.json` +
        `?key=${KEY}` +
        `&language=es` +
        `&country=co` +
        `&limit=10`;

    const res = await fetch(url);
    const data = await res.json();

    // Mapeo de la respuesta de la API a un formato simplificado y consistente:
    // Se utiliza el encadenamiento opcional (?.) para evitar errores si 'features' no existe.
    return (
        data.features?.map((item) => ({
            label: item.place_name,
            lat: item.center[1], // MapTiler devuelve [lng, lat], invertimos para nuestro estándar
            lng: item.center[0],
        })) || []
    );
}