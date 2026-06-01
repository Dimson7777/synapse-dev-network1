import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Take over scroll restoration from the browser so a refresh / back-forward
// return never reopens the page scrolled partway down. <ScrollToTop> then
// decides between "top" and an explicit #section deep link. Guarded for older
// browsers that don't expose this API.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

// Apply the saved (or default dark) theme to <html> BEFORE the first paint so
// auth, onboarding and the dashboard never flash a light background while the
// in-app <useTheme> effect catches up. Same key/default as use-theme.ts:
// dark unless the user explicitly chose light.
document.documentElement.classList.toggle(
  "dark",
  localStorage.getItem("devcircle-theme") !== "light",
);

createRoot(document.getElementById("root")!).render(<App />);
