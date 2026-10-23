/**
 * Fragmento de vite.config.ts: el plugin de Tailwind (lo pide el CSS del paquete) y el alias `@/` que
 * usan las plantillas. En un arranque reemplaza al de Vite; en una adopción se suma lo que falte. El
 * alias de TypeScript va aparte, en tsconfig.app.json.
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
});
