import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

/**
 * El `ThemeProvider` del starter de Untitled UI con tres arreglos:
 * - `localStorage` va en `try/catch`: con el almacenamiento bloqueado (incógnito, cookies apagadas)
 *   leerlo lanza, y como este provider envuelve toda la app, tumbaba el render entero.
 * - «Sistema» se guarda como "system" en vez de borrar la clave: borrada, al recargar ganaba
 *   `defaultTheme` y la elección se perdía. El guardia de index.html ya lee "system".
 * - El efecto declara todas sus dependencias.
 */

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// El hook va junto a su provider, como en el starter: separarlo cambiaría el import en las apps.
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }

    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
    /**
     * The class to add to the root element when the theme is dark
     * @default "dark-mode"
     */
    darkModeClass?: string;
    /**
     * The default theme to use if no theme is stored in localStorage
     * @default "system"
     */
    defaultTheme?: Theme;
    /**
     * The key to use to store the theme in localStorage
     * @default "ui-theme"
     */
    storageKey?: string;
}

export const ThemeProvider = ({ children, defaultTheme = "system", storageKey = "ui-theme", darkModeClass = "dark-mode" }: ThemeProviderProps) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            try {
                const savedTheme = localStorage.getItem(storageKey) as Theme | null;
                return savedTheme || defaultTheme;
            } catch {
                return defaultTheme;
            }
        }
        return defaultTheme;
    });

    useEffect(() => {
        const applyTheme = () => {
            const root = window.document.documentElement;

            if (theme === "system") {
                const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

                root.classList.toggle(darkModeClass, systemTheme === "dark");
            } else {
                root.classList.toggle(darkModeClass, theme === "dark");
            }

            try {
                localStorage.setItem(storageKey, theme);
            } catch {
                // Sin almacenamiento el tema dura lo que la pestaña: no es motivo para fallar.
            }
        };

        applyTheme();

        // Listen for system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = () => {
            if (theme === "system") {
                applyTheme();
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme, storageKey, darkModeClass]);

    return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
