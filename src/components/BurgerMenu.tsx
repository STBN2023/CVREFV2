import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const NAV_SECTIONS = [
  {
    title: "Génération de CV",
    links: [
      { to: "/", label: "Accueil" },
      { to: "/team", label: "Équipe" },
      { to: "/references", label: "Références" },
      { to: "/recap", label: "Récapitulatif" },
      { to: "/downloads", label: "Téléchargements" },
    ]
  },
  {
    title: "Administration",
    links: [
      { to: "/admin", label: "Tableau de bord Admin" },
      { to: "/admin/salaries", label: "Gestion Salariés" },
      { to: "/admin/references", label: "Gestion Références" },
      { to: "/admin/tools", label: "Outils Admin" },
      // Lien Debug CV retiré
    ]
  },
  {
    title: "Référentiels",
    links: [
      { to: "/referentials", label: "Agences & Fonctions" },
      { to: "/default-references", label: "Références par défaut" },
    ]
  }
];

export const BurgerMenu = () => {
  const location = useLocation();

  return (
    <div className="fixed top-4 left-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-brand-dark bg-white hover:bg-brand-pale"
            aria-label="Ouvrir le menu"
          >
            <Menu className="text-brand-dark" size={28} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <nav className="flex flex-col gap-6 mt-8 px-4">
            {NAV_SECTIONS.map((section, sectionIndex) => (
              <div key={section.title} className="flex flex-col gap-2">
                <div className="px-2 py-1 text-sm font-bold text-brand-dark/70 uppercase tracking-wide border-b border-brand-dark/20">
                  {section.title}
                </div>
                <div className="flex flex-col gap-1">
                  {section.links.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`px-4 py-2 text-base font-medium rounded-lg transition-all duration-200
                        ${
                          location.pathname === link.to
                            ? "bg-brand-yellow text-brand-dark shadow-sm"
                            : "hover:bg-brand-pale text-brand-dark hover:shadow-sm"
                        }
                      `}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                {sectionIndex < NAV_SECTIONS.length - 1 && (
                  <div className="h-px bg-brand-dark/10 mx-2 mt-2" />
                )}
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
};