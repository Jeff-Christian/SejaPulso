/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        pulso: {
          bg: '#0B132B',      // Fundo Azul Marinho Profundo
          card: '#111D3A',    // Card / Elementos em camada
          border: '#1E2D50',  // Bordas e divisores
          cyan: '#00F5D4',    // Ciano Elétrico da onda
        }
      }
    },
  },
  plugins: [],
}