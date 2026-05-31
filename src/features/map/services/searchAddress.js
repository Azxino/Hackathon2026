export default async function searchAddress(query) {

    const KEY =
        import.meta.env.VITE_MAPTILER_KEY;

    const url =
        `https://api.maptiler.com/geocoding/` +
        `${encodeURIComponent(query)}.json` +
        `?key=${KEY}` +
        `&language=es` +
        `&country=co` +
        `&limit=10`;

    const res = await fetch(url);

    const data = await res.json();

    return (
        data.features?.map((item) => ({
            label: item.place_name,
            lat: item.center[1],
            lng: item.center[0],
        })) || []
    );
}