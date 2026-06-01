/**
 * @file SearchAddress.jsx
 * @description Componente de interfaz de usuario para la búsqueda interactiva de direcciones.
 * Implementa una técnica de 'debouncing' para optimizar las peticiones a la API mientras el
 * usuario escribe.
 * @dependencies [React Hooks, searchAddress service]
 */

import { useState, useRef } from "react";
import searchAddress from "../services/searchAddress";
import '@/style/css/Map/SearchBar.css'

/**
 * Campo de búsqueda con autocompletado de direcciones.
 * @param {Object} props                                - Propiedades del componente.
 * @param {Function} [props.onSelect]                   - Callback que se ejecuta al seleccionar una dirección, retorna [lat, lng].
 * @param {string} [props.placeholder="¿A dónde vas?"]  - Texto sugerido en el input.
 */
export default function SearchAddress({
    onSelect,
    placeholder = "¿A dónde vas?"
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Referencia para gestionar el temporizador del debounce y evitar peticiones en cada tecla pulsada
    const debounceRef = useRef(null);

    /**
     * Maneja el cambio en el input, limpiando el timeout anterior y creando uno nuevo.
     * @param {string} value - Valor actual del input.
     */
    async function handleChange(value) {
        setQuery(value);
        clearTimeout(debounceRef.current);

        // Si el campo está vacío, resetea los resultados
        if (!value.trim()) {
            setResults([]);
            onSelect?.(null);
            return;
        }
    
        // Ejecuta la búsqueda después de 400ms de inactividad del usuario
        debounceRef.current = setTimeout(async () => {
            try {
                setLoading(true);
                const data =
                    await searchAddress(value);
                setResults(data);
            } catch (err) {
                console.error(err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 400);
    }

    /**
     * Selecciona un resultado y notifica al componente padre.
     * @param {Object} result - Objeto con la información de la ubicación seleccionada.
     */
    function handleSelect(result) {
        setQuery(
            result.label
        );
        setResults([]);
        // Retorna las coordenadas en el formato esperado por el mapa [lat, lng]
        onSelect?.([
            result.lat,
            result.lng
        ]);
    }

    return (
        <div className="search-bar">
            <div className="search-bar__field">
                <span className="search-bar__dot search-bar__dot--red" />
                <input
                    className="search-bar__input"
                    value={query}
                    placeholder={placeholder}
                    onChange={(e) =>
                        handleChange(
                            e.target.value
                        )
                    }
                />
            </div>

            {loading && (
                <div className="search-bar__loading">
                    Buscando...
                </div>
            )}

            {results.length > 0 && (
                <ul className="search-bar__results">
                    {results.map((result, index) => (
                        <li
                            key={index}
                            className="search-bar__result"
                            onClick={() =>
                                handleSelect(result)
                            }
                        >
                            <span className="search-bar__result-text">
                                <strong>
                                    {result.label.split(",")[0]}
                                </strong>

                                <br />

                                <small>
                                    {result.label.split(",").slice(1, 3).join(",")}
                                </small>
                            </span>

                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}