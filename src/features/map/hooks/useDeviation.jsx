import { useEffect, useState } from "react";

function distance(a, b) {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
}

export default function useDeviation(ubicacion, route) {
    const [desviacion, setDesviacion] = useState(false);

    useEffect(() => {
        if (!ubicacion || !route?.length) return;

        let minDist = Infinity;

        route.forEach((p) => {
            const d = distance(ubicacion, p);
            if (d < minDist) minDist = d;
        });

        setDesviacion(minDist > 0.001); // sensibilidad

    }, [ubicacion, route]);

    return desviacion;
}