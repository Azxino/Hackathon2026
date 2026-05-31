import { useEffect, useState } from "react";

export default function useOrientation() {
    const [heading, setHeading] = useState(null);

    useEffect(() => {
        // iOS 13+ requires permission
        if (typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function") {
            DeviceOrientationEvent.requestPermission()
                .then(permission => {
                    if (permission === "granted") listen();
                })
                .catch(console.error);
        } else {
            listen();
        }

        function listen() {
            function handler(e) {
                // webkitCompassHeading is iOS, alpha is Android (need to invert)
                if (e.webkitCompassHeading != null) {
                    setHeading(e.webkitCompassHeading);
                } else if (e.alpha != null) {
                    setHeading(360 - e.alpha);
                }
            }
            window.addEventListener("deviceorientationabsolute", handler, true);
            window.addEventListener("deviceorientation", handler, true);
            return () => {
                window.removeEventListener("deviceorientationabsolute", handler, true);
                window.removeEventListener("deviceorientation", handler, true);
            };
        }
    }, []);

    return heading;
}
