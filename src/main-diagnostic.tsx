import { createRoot } from "react-dom/client";

// Test ultra-minimal pour diagnostiquer le problème
const DiagnosticApp = () => {
  console.log("🔧 DIAGNOSTIC: Composant React monté");
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#ff0000', 
      color: 'white', 
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🚨 DIAGNOSTIC REACT</h1>
      <p>Si vous voyez ce texte rouge, React fonctionne !</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
      <div style={{ backgroundColor: '#000', padding: '10px', marginTop: '10px' }}>
        <p>✅ createRoot fonctionne</p>
        <p>✅ JSX fonctionne</p>
        <p>✅ Styles inline fonctionnent</p>
      </div>
    </div>
  );
};

console.log("🔧 DIAGNOSTIC: Démarrage de l'application");
const rootElement = document.getElementById("root");
console.log("🔧 DIAGNOSTIC: Element root trouvé:", rootElement);

if (rootElement) {
  createRoot(rootElement).render(<DiagnosticApp />);
  console.log("🔧 DIAGNOSTIC: Application montée");
} else {
  console.error("❌ DIAGNOSTIC: Element root non trouvé!");
}
