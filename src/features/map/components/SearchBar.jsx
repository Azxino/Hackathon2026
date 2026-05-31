import { useState, useRef, useEffect } from "react";
import useSearchAddress from "../hooks/useSearchAddress";

export default function SearchBar({ onSelectOrigin, onSelectDestino, originLabel, destinoLabel }) {
    const [originQuery, setOriginQuery] = useState("");
    const [destinoQuery, setDestinoQuery] = useState("");
    const [activeField, setActiveField] = useState(null); // "origin" | "destino"

    const { search, results, loading, clear } = useSearchAddress();
    const debounceRef = useRef(null);

    function handleInput(field, value) {
        if (field === "origin") setOriginQuery(value);
        else setDestinoQuery(value);
        setActiveField(field);

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(value), 400);
    }

    function handleSelect(result) {
        if (activeField === "origin") {
            setOriginQuery(result.label.split(",")[0]);
            onSelectOrigin([result.lat, result.lng]);
        } else {
            setDestinoQuery(result.label.split(",")[0]);
            onSelectDestino([result.lat, result.lng]);
        }
        clear();
        setActiveField(null);
    }

    // Sync labels from outside
    useEffect(() => { if (originLabel) setOriginQuery(originLabel); }, [originLabel]);
    useEffect(() => { if (destinoLabel) setDestinoQuery(destinoLabel); }, [destinoLabel]);

    return (
        <div className="search-bar">
            {/* Origen */}
            <div className="search-bar__field">
                <span className="search-bar__dot search-bar__dot--blue" />
                <input
                    className="search-bar__input"
                    placeholder="Origen (tu ubicación actual)"
                    value={originQuery}
                    onChange={e => handleInput("origin", e.target.value)}
                    onFocus={() => setActiveField("origin")}
                />
            </div>

            <div className="search-bar__divider" />

            {/* Destino */}
            <div className="search-bar__field">
                <span className="search-bar__dot search-bar__dot--red" />
                <input
                    className="search-bar__input"
                    placeholder="¿A dónde vas?"
                    value={destinoQuery}
                    onChange={e => handleInput("destino", e.target.value)}
                    onFocus={() => setActiveField("destino")}
                />
            </div>

            {/* Resultados */}
            {results.length > 0 && activeField && (
                <ul className="search-bar__results">
                    {results.map((r, i) => (
                        <li
                            key={i}
                            className="search-bar__result"
                            onClick={() => handleSelect(r)}
                        >
                            <span className="search-bar__result-icon">📍</span>
                            <span className="search-bar__result-text">
                                {r.label.split(",").slice(0, 2).join(",")}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {loading && <div className="search-bar__loading">Buscando...</div>}
        </div>
    );
}
