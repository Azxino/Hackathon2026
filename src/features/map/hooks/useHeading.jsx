import { useEffect, useState } from "react";

export default function useHeading() {
    const [heading, setHeading] = useState(0);

    useEffect(() => {
        const handler = (event) => {
            if (event.alpha !== null) {
                setHeading(event.alpha); // dirección del dispositivo
            }
        };

        window.addEventListener("deviceorientation", handler);

        return () =>
            window.removeEventListener("deviceorientation", handler);
    }, []);

    return heading;
}