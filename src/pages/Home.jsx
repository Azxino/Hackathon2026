/**
 * @file Home.jsx
 * @description Página principal de la aplicación. Actúa como el punto de montaje 
 * para el componente 'MapLibre', el cual contiene toda la lógica de visualización 
 * espacial y herramientas de IA.
 */

import MapLibre from "@/features/map/components/MapLibre"

/**
 * Componente funcional principal de la página Home.
 */
export default function Home() {
    return (
        <>
            <MapLibre />
        </>
    )
}