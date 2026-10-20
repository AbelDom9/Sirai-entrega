import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Como el ejemplo de clase: fs lee el certificado para servir el frontend con HTTPS.
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: true,
    // WSL no siempre recibe los eventos de archivos editados desde Windows.
    watch: {
      usePolling: process.platform === "linux",
      interval: 500,
    },
    // Como el ejemplo de clase: frontend.key y frontend.crt se generan con openssl
    // (ver README.md) y no se suben a GitHub.
    https: {
      key: fs.readFileSync("./frontend.key"),
      cert: fs.readFileSync("./frontend.crt"),
    },
  },
  build: {
    sourcemap: mode === "development",
  },
  base: "./",
}));
