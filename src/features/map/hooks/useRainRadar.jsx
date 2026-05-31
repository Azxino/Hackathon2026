import { useEffect, useState } from "react";

export default function useRainRadar() {
    const [frames, setFrames] = useState([]);
    const [index, setIndex] = useState(0);

    useEffect(() => {
        async function load() {
            const res = await fetch(
                "https://api.rainviewer.com/public/weather-maps.json"
            );

            const data = await res.json();

            const past = data.radar.past || [];
            const nowcast = data.radar.nowcast || [];

            const allFrames = [...past, ...nowcast];

            setFrames(allFrames);
            setIndex(allFrames.length - 1);
        }

        load();
    }, []);

    return { frames, index, setIndex };
}