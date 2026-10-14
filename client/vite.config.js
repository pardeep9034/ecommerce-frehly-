import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Dev only: the browser talks to this origin, so the refresh-token cookie stays first-party (SameSite=Lax drops it
  // on localhost -> 127.0.0.1). Used when client/.env.local sets VITE_API_BASE_URL=/api. 127.0.0.1: localhost resets here.
  server: {
    proxy: {
      "/api": { target: "http://127.0.0.1:4000", rewrite: (p) => p.replace(/^\/api/, "") },
    },
  },
})
