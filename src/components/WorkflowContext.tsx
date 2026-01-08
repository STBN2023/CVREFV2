import React, { createContext, useContext, useState, ReactNode } from "react";

type ReferenceAssociation = Record<string, string[]>; // { [employeeId]: [referenceId, ...] }
type TemplateAssociation = Record<string, string>; // { [employeeId]: templateId }

interface WorkflowContextType {
  selectedTeam: any[];
  setSelectedTeam: (team: any[]) => void;
  selectedReferences: any[];
  setSelectedReferences: (references: any[]) => void;
  referenceAssociation: { [key: number]: number[] };
  setReferenceAssociation: (association: { [key: number]: number[] }) => void;
  useDefaultReferences: boolean;
  setUseDefaultReferences: (use: boolean) => void;
  resetWorkflow: () => void;
  templateAssociation: TemplateAssociation;
  setTemplateAssociation: (assoc: TemplateAssociation) => void;
};

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTeam, setSelectedTeam] = useState<any[]>([]);
  const [selectedReferences, setSelectedReferences] = useState<any[]>([]);
  const [referenceAssociation, setReferenceAssociation] = useState<{ [key: number]: number[] }>({});
  const [useDefaultReferences, setUseDefaultReferences] = useState<boolean>(true);
  const [templateAssociation, setTemplateAssociation] = useState<TemplateAssociation>({});

  const resetWorkflow = () => {
    setSelectedTeam([]);
    setSelectedReferences([]);
    setReferenceAssociation({});
    setUseDefaultReferences(true);
    setTemplateAssociation({});
  };

  return (
    <WorkflowContext.Provider
      value={{
        selectedTeam,
        setSelectedTeam,
        selectedReferences,
        setSelectedReferences,
        referenceAssociation,
        setReferenceAssociation,
        useDefaultReferences,
        setUseDefaultReferences,
        resetWorkflow,
        templateAssociation,
        setTemplateAssociation,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within WorkflowProvider");
  return ctx;
};