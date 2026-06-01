/**
 * @file useWeather.js
 * @description Hook personalizado para obtener y gestionar los datos del clima
 * basados en la ubicación geográfica del usuario.
 * @dependencies [React, services/getWeather]
 */
import { useState, useEffect } from "react";
import getWeather from "../services/getWeather";

/**
 * Obtiene el clima para una coordenada dada.
 * @param {Array|null} ubicacion - Coordenadas [latitud, longitud].
 * @returns {Object} Contiene el estado del clima 'weather'.
 */
export default function useWeather(ubicacion) {
    const [weather, setWeather] = useState(null);

    useEffect(() => {
        // Solo realizar la petición si existe una ubicación válida
        if (!ubicacion) return;

        // Llama al servicio de clima (se asume que es una función asíncrona o callback)
        getWeather(ubicacion[0], ubicacion[1], setWeather); 
    }, [ubicacion]); // El efecto se dispara cada vez que la ubicación cambia

    return { weather };
}