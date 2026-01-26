import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    
    // Fix: Use middleware to set CORS headers
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/pdf.pdf') || req.url?.startsWith('/pdfjs/')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        }
        next();
      });
    },
    
  },
})