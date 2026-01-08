import { ReferenceSelectionStep } from "@/components/ReferenceSelectionStep";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useWorkflow } from "@/components/WorkflowContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ReferenceSelection = () => {
  const { selectedReferences } = useWorkflow();
  const navigate = useNavigate();

  // Redirection automatique supprimée pour permettre l'utilisation du bouton "Valider"

  return (
    <div className="min-h-screen bg-[#FCE7B3] flex flex-col">
      <ReferenceSelectionStep />
      <MadeWithDyad />
    </div>
  );
};

export default ReferenceSelection;