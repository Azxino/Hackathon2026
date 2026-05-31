import { calculateRisk, applyTrafficPenalty } from "./getCalculateRisk";

export default async function getRoute(start, end) {
    if (!start || !end) return null;

    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("OSRM request failed");
    }

    const data = await res.json();

    if (!data.routes || !data.routes.length) {
        throw new Error("No route found");
    }

    const route = data.routes[0];

    return {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
    };
}

export async function getBaseRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) throw new Error("No route");

    return data.routes[0];
}

export function buildSmartRoutes(baseRoute, riskZones) {
    const riskScore = calculateRisk(baseRoute, riskZones);

    return {
        fast: {
            ...baseRoute,
            score: riskScore * 0.5,
        },

        safe: {
            ...baseRoute,
            score: riskScore * 2,
        },

        balanced: {
            ...baseRoute,
            score: riskScore,
        }
    };
}

export function scoreRoute(route, riskZones, trafficData) {
    const risk = calculateRisk(route, riskZones);
    const traffic = applyTrafficPenalty(route, trafficData);

    return risk + traffic;
}