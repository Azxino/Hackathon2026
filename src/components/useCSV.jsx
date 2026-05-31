import { useEffect, useState } from "react";

export default function useCSV(url) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(url);
                const text = await res.text();

                const clean = (v) => (v || "").replace(/\r/g, "").trim();

                const [headerLine, ...rows] = text.trim().split("\n");

                const headers = headerLine
                    .split(",")
                    .map(clean);

                const parsed = rows.map((row, index) => {
                    const values = row.split(",").map(clean);

                    const obj = Object.fromEntries(
                        headers.map((h, i) => [h, values[i]])
                    );

                    obj._id = `${obj.NODO}-${obj.FECHA}-${obj.HORA}-${obj.COORDENADAX}-${obj.COORDENADAY}-${index}`;

                    return obj;
                });

                setData(parsed);
            } catch (e) {
                console.error(e);
                setData([]);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [url]);

    return { data, loading };
}