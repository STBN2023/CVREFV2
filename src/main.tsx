import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { WorkflowProvider } from "@/components/WorkflowContext";

createRoot(document.getElementById("root")!).render(
  <WorkflowProvider>
    <App />
  </WorkflowProvider>
);