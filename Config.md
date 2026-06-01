# Borra directorios de build, caché de Vite y dependencias
Remove-Item -Recurse -Force dist, node_modules, .vite, .rollup.cache -ErrorAction SilentlyContinue

# Borra archivos de bloqueo
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

npm install
npm run build