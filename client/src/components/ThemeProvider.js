import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext();

const LIGHT = "light";
const DARK = "dark";
const SYSTEM = "system";

function ThemeProvider({ children }) {
  const [theme, _setTheme] = useState(
    localStorage.theme ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? DARK
      : LIGHT
  );

  useEffect(() => {
    // useEffect hook updates theme as and when it is changed
    if (
      theme === DARK ||
      (theme === SYSTEM &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    )
      document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  const setTheme = useCallback(
    (newTheme) => {
      // Set theme state
      _setTheme(newTheme);

      // Save to localStorage
      localStorage.theme = newTheme;
    },
    [_setTheme]
  );

  const contextValue = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeProvider, ThemeContext, LIGHT, DARK, SYSTEM };
