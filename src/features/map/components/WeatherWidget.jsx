export default function WeatherWidget({ weather, loading }) {
    if (loading) {
        return (
            <div className="weather-widget">
                <div className="weather-widget__icon">⏳</div>
            </div>
        );
    }

    if (!weather) return null;

    return (
        <div className="weather-widget">
            <div className="weather-widget__icon">{weather.icon}</div>
            <div className="weather-widget__info">
                <div className="weather-widget__temp">{weather.temp}°C</div>
                <div className="weather-widget__label">{weather.label}</div>
                <div className="weather-widget__meta">
                    💧 {weather.humidity}% · 💨 {weather.wind} km/h
                </div>
            </div>
        </div>
    );
}
