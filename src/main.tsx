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

createRoot(document.getElementById("root")!).render(<App />);
