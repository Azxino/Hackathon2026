import { useState, useRef, useEffect } from "react";
import "@/style/css/Map/Agent.css";

// Herramientas que el agente puede ejecutar
const TOOLS = [
    {
        name: "toggle_layer",
        description: "Activa o desactiva una capa del mapa. Capas disponibles: homicidios, incidentes, policias, radar",
        input_schema: {
            type: "object",
            properties: {
                layer: { type: "string", enum: ["homicidios", "incidentes", "policias", "radar"] },
                visible: { type: "boolean" }
            },
            required: ["layer", "visible"]
        }
    },
    {
        name: "navigate_to",
        description: "Navega a una dirección o lugar en Medellín buscando sus coordenadas",
        input_schema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Nombre del lugar o dirección en Medellín, Colombia" }
            },
            required: ["query"]
        }
    },
    {
        name: "get_map_state",
        description: "Obtiene el estado actual del mapa: ubicación del usuario, destino activo, capas visibles y clima",
        input_schema: { type: "object", properties: {} }
    },
    {
        name: "query_security",
        description: "Consulta estadísticas de seguridad de una zona o barrio usando los datos reales de homicidios e incidentes",
        input_schema: {
            type: "object",
            properties: {
                zona: { type: "string", description: "Nombre del barrio o zona de Medellín" }
            },
            required: ["zona"]
        }
    }
];

const SYSTEM_PROMPT = `Eres EVA, un asistente de navegación y seguridad inteligente para Medellín, Colombia. 
Tienes acceso a datos reales de homicidios, accidentes viales y estaciones de policía de la ciudad.
Puedes controlar el mapa, navegar a lugares y responder preguntas de seguridad.
Sé conciso, amigable y útil. Responde siempre en español.
Cuando el usuario pida ir a un lugar, usa navigate_to. 
Cuando pida ver datos, usa toggle_layer.
Cuando pregunten por seguridad de una zona, usa query_security.`;

export default function Agent({
    mapState,           // { ubicacion, destination, weather, showHomicidios, showIncidentes, showPolicias, showRadar }
    homClusters,        // datos de homicidios
    incClusters,        // datos de incidentes  
    onToggleLayer,      // (layer, visible) => void
    onNavigateTo,       // ([lat, lng]) => void
}) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Ejecuta una tool call y retorna el resultado
    async function executeTool(name, input) {
        switch (name) {
            case "toggle_layer": {
                onToggleLayer(input.layer, input.visible);
                const estado = input.visible ? "activada" : "desactivada";
                const nombres = { homicidios: "Homicidios", incidentes: "Accidentes viales", policias: "Estaciones de policía", radar: "Radar de lluvia" };
                return `Capa "${nombres[input.layer]}" ${estado} en el mapa.`;
            }

            case "navigate_to": {
                try {
                    const KEY = import.meta.env.VITE_MAPTILER_KEY;
                    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(input.query + ", Medellín, Colombia")}.json?key=${KEY}&language=es&limit=1`;
                    const res = await fetch(url);
                    const data = await res.json();
                    if (!data.features?.length) return "No encontré ese lugar en Medellín.";
                    const [lng, lat] = data.features[0].center;
                    const nombre = data.features[0].place_name.split(",")[0];
                    onNavigateTo([lat, lng]);
                    return `Navigando hacia "${nombre}". La ruta aparece en el mapa.`;
                } catch {
                    return "No pude buscar esa dirección en este momento.";
                }
            }

            case "get_map_state": {
                const s = mapState;
                const capas = [
                    s.showHomicidios && "Homicidios",
                    s.showIncidentes && "Accidentes viales",
                    s.showPolicias && "Policías",
                    s.showRadar && "Radar lluvia",
                ].filter(Boolean);

                return JSON.stringify({
                    ubicacion: s.ubicacion ? `${s.ubicacion[0].toFixed(4)}, ${s.ubicacion[1].toFixed(4)}` : "No disponible",
                    destino: s.destination ? "Activo" : "Sin destino",
                    capas_activas: capas.length ? capas : ["Ninguna"],
                    clima: s.weather ? `${s.weather.temperature}°C, viento ${s.weather.windspeed}km/h` : "No disponible",
                });
            }

            case "query_security": {
                const zona = input.zona.toLowerCase();

                const homZona = homClusters.filter(c =>
                    c.barrio && c.barrio.toLowerCase().includes(zona)
                );
                const totalHom = homZona.reduce((sum, c) => sum + c.count, 0);

                // Buscar incidentes por proximidad si hay clusters de hom en esa zona
                let totalInc = 0;
                if (homZona.length > 0) {
                    const centroLat = homZona.reduce((s, c) => s + c.lat, 0) / homZona.length;
                    const centroLng = homZona.reduce((s, c) => s + c.lng, 0) / homZona.length;
                    totalInc = incClusters.filter(c =>
                        Math.abs(c.lat - centroLat) < 0.02 && Math.abs(c.lng - centroLng) < 0.02
                    ).reduce((sum, c) => sum + c.count, 0);
                }

                if (totalHom === 0) {
                    return `No encontré datos específicos para "${input.zona}" en la base de datos. Puede que el nombre del barrio sea diferente o no haya registros.`;
                }

                const nivel = totalHom > 50 ? "alto" : totalHom > 20 ? "moderado" : "bajo";
                return JSON.stringify({
                    zona: input.zona,
                    homicidios_registrados: totalHom,
                    accidentes_viales: totalInc,
                    nivel_riesgo: nivel,
                    clusters_encontrados: homZona.length,
                });
            }

            default:
                return "Herramienta no reconocida.";
        }
    }

    async function sendMessage() {
        const text = input.trim();
        if (!text || loading) return;

        const userMsg = { role: "user", content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:3001/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system: SYSTEM_PROMPT,
                    prompt: text,
                    mapState: {
                        ubicacion: mapState?.ubicacion,
                        destination: mapState?.destination,
                        weather: mapState?.weather,
                        capas: {
                            homicidios: mapState?.showHomicidios,
                            incidentes: mapState?.showIncidentes,
                            policias: mapState?.showPolicias,
                            radar: mapState?.showRadar,
                        }
                    }
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            setMessages(prev => [...prev, {
                role: "assistant",
                content: data.reply
            }]);

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Error conectando con EVA."
            }]);
        } finally {
            setLoading(false);
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    const suggestions = [
        "¿Qué tan seguro es el barrio Laureles?",
        "Llévame al centro de Medellín",
        "Activa la capa de homicidios",
        "¿Cómo está el clima?",
    ];

    return (
        <>
            {/* Botón flotante */}
            <button className="agent-fab" onClick={() => setOpen(v => !v)} aria-label="Abrir asistente EVA">
                {open ? "✕" : "✦"}
            </button>

            {/* Panel del chat */}
            {open && (
                <div className="agent-panel">
                    <div className="agent-panel__header">
                        <div className="agent-panel__avatar">✦</div>
                        <div>
                            <div className="agent-panel__name">EVA</div>
                            <div className="agent-panel__sub">Asistente de navegación</div>
                        </div>
                    </div>

                    <div className="agent-panel__messages">
                        {messages.length === 0 && (
                            <div className="agent-welcome">
                                <p>Hola, soy <b>EVA</b>. Puedo ayudarte a navegar, mostrarte zonas de riesgo y responder preguntas sobre Medellín.</p>
                                <div className="agent-suggestions">
                                    {suggestions.map((s, i) => (
                                        <button key={i} className="agent-suggestion" onClick={() => { setInput(s); inputRef.current?.focus(); }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div key={i} className={`agent-msg agent-msg--${m.role}`}>
                                {typeof m.content === "string" ? m.content : ""}
                            </div>
                        ))}

                        {loading && (
                            <div className="agent-msg agent-msg--assistant">
                                <span className="agent-typing"><span /><span /><span /></span>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    <div className="agent-panel__input">
                        <input
                            ref={inputRef}
                            className="agent-input"
                            placeholder="Escribe algo..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            disabled={loading}
                        />
                        <button className="agent-send" onClick={sendMessage} disabled={loading || !input.trim()}>
                            ↑
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
