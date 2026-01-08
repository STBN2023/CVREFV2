import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useWorkflow } from "@/components/WorkflowContext";

const Home = () => {
  const navigate = useNavigate();
  const { resetWorkflow } = useWorkflow();

  // Réinitialiser le workflow par défaut au démarrage (arrivée sur la Home)
  useEffect(() => {
    resetWorkflow();
    // Nettoyage de la persistance de la sélection équipe pour repartir de zéro
    try {
      localStorage.removeItem("teamV2State");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(var(--brand-lightblue))] to-[hsl(var(--brand-pale))]">
      <div className="bg-white/80 rounded-2xl shadow-xl p-10 flex flex-col items-center gap-8">
        <h1 className="text-5xl font-extrabold text-[hsl(var(--brand-dark))] mb-2 drop-shadow">Bienvenue</h1>
        <p className="text-lg text-[hsl(var(--brand-dark))/0.8] mb-4 text-center max-w-md">
          Lancez la constitution d’équipe et la sélection de références, ou accédez aux paramètres administrateur.
        </p>
        <div className="flex gap-6">
          <Button
            size="lg"
            className="rounded-full px-8 py-3 text-xl font-bold bg-[hsl(var(--brand-blue))] text-white shadow-lg hover:bg-[hsl(var(--brand-blue))/0.9] transition"
            onClick={() => navigate("/team")}
          >
            Go 🚀
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8 py-3 text-xl font-bold border-2 border-[hsl(var(--brand-dark))] text-[hsl(var(--brand-dark))] bg-white hover:bg-[hsl(var(--brand-pale))] transition"
            onClick={() => navigate("/admin")}
          >
            Admin
          </Button>
        </div>
      </div>
      <div className="mt-12">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Home;