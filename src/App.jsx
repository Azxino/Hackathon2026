/**
 * @file App.jsx
 * @description Componente raíz de la aplicación. 
 * Se encarga de cargar los estilos globales y renderizar el árbol principal de componentes.
 */

import '@/style/css/global.css'
import Home from './pages/Home'

/**
 * Componente principal de la aplicación.
 */
export default function App() {
    return (
        <>
            <Home />
        </>
    )
}