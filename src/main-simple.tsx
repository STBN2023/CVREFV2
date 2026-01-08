import { createRoot } from "react-dom/client";
import "./globals.css";

const SimpleApp = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: 'lightblue' }}>
      <h1>APPLICATION REACT FONCTIONNE</h1>
      <p>Si vous voyez ce texte, React fonctionne correctement.</p>
      <p>Date: {new Date().toLocaleString()}</p>
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<SimpleApp />);
