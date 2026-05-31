import { useState, useRef, useEffect } from "react";
import "@/style/css/Map/Agent.css";

export default function Agent({ mapState, homClusters, incClusters, onToggleLayer, onNavigateTo }) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    async function executeTool(action, data) {
        if (action === "toggle_layer") {
            onToggleLayer(data.layer, data.visible);
            const nombres = { homicidios: "Homicidios", incidentes: "Accidentes viales", policias: "Policías", radar: "Radar lluvia" };
            return `Capa "${nombres[data.layer]}" ${data.visible ? "activada ✓" : "desactivada"}.`;
        }
        if (action === "navigate_to") {
            try {
                const KEY = import.meta.env.VITE_MAPTILER_KEY;
                const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(data.query + ", Medellín, Colombia")}.json?key=${KEY}&language=es&limit=1`;
                const res = await fetch(url);
                const json = await res.json();
                if (!json.features?.length) return `No encontré "${data.query}".`;
                const [lng, lat] = json.features[0].center;
                onNavigateTo([lat, lng]);
                return `Navegando hacia "${json.features[0].place_name.split(",")[0]}" 🗺️`;
            } catch { return "No pude buscar esa dirección."; }
        }
        if (action === "query_security") {
            const zona = data.zona.toLowerCase();
            const homZona = homClusters.filter(c => c.barrio?.toLowerCase().includes(zona));
            const total = homZona.reduce((s, c) => s + c.count, 0);
            if (!total) return `No encontré datos para "${data.zona}". Intenta con el nombre exacto del barrio.`;
            const nivel = total > 50 ? "🔴 Alto" : total > 20 ? "🟡 Moderado" : "🟢 Bajo";
            return `Zona: ${data.zona}\nNivel de riesgo: ${nivel}\nHomicidios registrados: ${total}`;
        }
        return "Acción no reconocida.";
    }

    async function sendMessage() {
        const text = input.trim();
        if (!text || loading) return;

        setMessages(prev => [...prev, { role: "user", content: text }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:3001/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
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
                        },
                    },
                    homData: homClusters.slice(0, 50), // muestra reducida
                    incData: incClusters.slice(0, 50),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            let reply = data.reply?.trim() || "Sin respuesta.";
            let displayReply = reply;

            // Intentar parsear como acción JSON
            try {
                const match = reply.match(/\{[\s\S]*?\}/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (parsed.action) {
                        displayReply = await executeTool(parsed.action, parsed);
                    }
                }
            } catch (_) {}

            setMessages(prev => [...prev, { role: "assistant", content: displayReply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: "assistant", content: "❌ Error conectando con EVA. ¿Está corriendo `node server.js`?" }]);
        } finally {
            setLoading(false);
        }
    }

    function handleKey(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    }

    const suggestions = [
        "¿Qué tan peligroso es Manrique?",
        "Llévame al Parque El Poblado",
        "Activa homicidios",
        "¿Cómo está el clima?",
    ];

    return (
        <>
            <button className="agent-fab" onClick={() => setOpen(v => !v)} aria-label="Abrir EVA">
                {open
                    ? <span style={{ fontSize: 18 }}>✕</span>
                    : <img src="/cat.png" alt="EVA" className="agent-fab__img" />
                }
            </button>

            {open && (
                <div className="agent-panel">
                    <div className="agent-panel__header">
                        <img src="/cat.png" alt="EVA" className="agent-panel__avatar-img" />
                        <div>
                            <div className="agent-panel__name">EVA</div>
                            <div className="agent-panel__sub">Asistente · Gemini AI</div>
                        </div>
                        <button className="agent-panel__close" onClick={() => setOpen(false)}>✕</button>
                    </div>

                    <div className="agent-panel__messages">
                        {messages.length === 0 && (
                            <div className="agent-welcome">
                                <p>Hola, soy <b>EVA</b> Puedo navegar, mostrarte zonas de riesgo y responder preguntas sobre Medellín.</p>
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
                                {m.content}
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
                        <button className="agent-send" onClick={sendMessage} disabled={loading || !input.trim()}>↑</button>
                    </div>
                </div>
            )}
        </>
    );
}
