import Mapa from "@/features/map/components/Map"
import useCSV from "@/components/useCSV";

function Home() {
    const { data, loading } = useCSV("/data/Aforos_Vehiculares.csv");
    const ready = !loading && data.length > 0;

    if (!ready) {
        return <div>Cargando datos...</div>;
    }

    return (
        <Mapa accidents={data}/>
    )
}

export default Home