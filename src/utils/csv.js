import axios from "axios";
import Papa from "papaparse";

export async function loadCSV(url) {
    const response = await axios.get(url);

    const result = Papa.parse(response.data, {
        header: true,
        skipEmptyLines: true,
    });

    return result.data;
}