import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import TeamPage from "./pages/Index";
import NotFound from "./pages/NotFound";
import ReferenceSelection from "./pages/ReferenceSelection";
import Recap from "./pages/RecapNew";
import AdminHome from "./pages/AdminHome";
import AdminSalaries from "./pages/AdminSalaries";
import AdminReferences from "./pages/AdminReferences";
import AdminTools from "./pages/AdminTools";
import { BurgerMenu } from "@/components/BurgerMenu";
import ReferenceAssociation from "./pages/ReferenceAssociation";
import Downloads from "./pages/Downloads";
import Referentials from "./pages/Referentials";
import DefaultReferences from './pages/DefaultReferences';
import TeamV2 from "./pages/TeamV2";
import { RainbowThemeButton } from "@/components/RainbowThemeButton";
import { WorkflowProvider } from "@/components/WorkflowContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import DebugCv from "./pages/DebugCv";
import BackendStatus from "@/components/BackendStatus";
import AdminMaintenance from "./pages/AdminMaintenance";
import AdminConfig from "./pages/AdminConfig";
import AdminExports from "./pages/AdminExports";
import AutoBackup from "@/components/AutoBackup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <WorkflowProvider>
          {/* Actions globales invisibles */}
          <AutoBackup />
          <BurgerMenu />
          <RainbowThemeButton />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/team" element={<TeamV2 />} />
              <Route path="/team-old" element={<TeamPage />} />
              <Route path="/references" element={<ReferenceSelection />} />
              <Route path="/association" element={<ReferenceAssociation />} />
              <Route path="/recap" element={<Recap />} />
              <Route path="/referentials" element={<Referentials />} />
              <Route path="/default-references" element={<DefaultReferences />} />
              <Route path="/downloads" element={<Downloads />} />
              <Route path="/admin" element={<AdminHome />} />
              <Route path="/admin/salaries" element={<AdminSalaries />} />
              <Route path="/admin/references" element={<AdminReferences />} />
              <Route path="/admin/tools" element={<AdminTools />} />
              <Route path="/admin/maintenance" element={<AdminMaintenance />} />
              <Route path="/admin/config" element={<AdminConfig />} />
              <Route path="/admin/exports" element={<AdminExports />} />
              <Route path="/debug-cv" element={<DebugCv />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
          <BackendStatus />
        </WorkflowProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;