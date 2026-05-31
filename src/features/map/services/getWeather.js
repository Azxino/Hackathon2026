/**
 * @file getWeather.js
 * @description Servicio encargado de interactuar con la API de Open-Meteo 
 * para obtener datos meteorológicos en tiempo real.
 * @dependencies [fetch API]
 * @author Zero
 */

/**
 * Obtiene el estado meteorológico actual para unas coordenadas específicas
 * utilizando la API de Open-Meteo.
 * @async
 * @param {number} lat          - Latitud de la ubicación.
 * @param {number} lon          - Longitud de la ubicación.
 * @param {Function} setWeather - Función de callback (usualmente un setter de React)
 * para actualizar el estado con los datos del clima obtenidos.
 * @returns {Promise<void>}     - No retorna un valor directamente, actualiza el estado mediante el callback.
 */
export default async function getWeather(lat, lon, setWeather) {
    // Consulta la API de Open-Meteo para obtener el clima actual
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );

        const data = await res.json();

        // Se invoca el callback con el objeto 'current_weather' de la respuesta
        setWeather(data.current_weather);

    } catch (err) {
        // Registro de error en caso de fallo en la red o en el procesamiento de datos
        console.error("Error clima:", err);
    }
}