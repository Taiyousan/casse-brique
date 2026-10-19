import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Chemins relatifs : le site fonctionne à la racine d'un domaine comme dans un sous-dossier
  // (GitHub Pages, par exemple), sans configuration supplémentaire
  base: './',
  build: {
    // three.js seul pèse environ 700 Ko minifié : inévitable pour un jeu 3D
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        // Bibliothèques dans des fichiers séparés : mises en cache par le navigateur,
        // elles ne sont pas retéléchargées quand seul le code du jeu change
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'r3f', test: /node_modules[\\/](@react-three|zustand|its-fine|suspend-react)[\\/]/ },
          ],
        },
      },
    },
  },
})
