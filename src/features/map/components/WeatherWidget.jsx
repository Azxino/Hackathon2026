/**
 * @file WeatherWidget.jsx
 * @description Componente de presentación para mostrar información meteorológica
 * actual (temperatura, iconos, viento).
 */

/**
 * Función helper para mapear códigos meteorológicos (WMO) a iconos representativos.
 * @param {number} code - Código de clima (e.g. 0 para despejado, 67 para lluvia).
 * @returns {string} Emoji representativo del estado del clima.
 */
function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code <= 99) return "⛈️";
    return "🌍";
}

/**
 * Componente visual que despliega el widget de clima.
 * @param {Object} props - Propiedades del componente.
 * @param {Object|null} props.weather - Objeto con datos: temperature, weathercode, windspeed.
 */
export default function WeatherWidget({ weather }) {
    // Si no hay datos, no renderizamos nada (patrón guard-clause)
    if (!weather) return null;
    return (
        <div className="weather-widget">
            <div className="weather-widget__icon">{getWeatherIcon(weather.weathercode)}</div>
            <div>
                <div className="weather-widget__temp">{weather.temperature}°C</div>
                <div className="weather-widget__label">Clima actual</div>
                <div className="weather-widget__meta">💨 {weather.windspeed} km/h</div>
            </div>
        </div>
    );
}