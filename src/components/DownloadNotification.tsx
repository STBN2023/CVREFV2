import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, X, FileText } from "lucide-react";

interface DownloadNotificationProps {
  isVisible: boolean;
  filename: string;
  referenceCount: number;
  onClose: () => void;
  onDownloadAgain?: () => void;
}

export const DownloadNotification = ({
  isVisible,
  filename,
  referenceCount,
  onClose,
  onDownloadAgain
}: DownloadNotificationProps) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
      // Auto-fermer après 10 secondes
      const timer = setTimeout(() => {
        setShouldShow(false);
        setTimeout(onClose, 300); // Délai pour l'animation de fermeture
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible && !shouldShow) return null;

  return (
    <div className={`fixed top-4 right-4 z-[9999] transition-all duration-500 ${
      shouldShow ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="w-96 bg-green-50 border-2 border-green-200 rounded-lg shadow-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-bold text-green-800">Téléchargement réussi !</h3>
          </div>
          <button
            onClick={() => {
              setShouldShow(false);
              setTimeout(onClose, 300);
            }}
            className="h-8 w-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Description */}
        <p className="text-green-700 mb-4">
          Votre CV enrichi a été généré et téléchargé avec succès
        </p>
        
        {/* Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Fichier :</span>
            <span className="font-mono text-xs bg-green-100 px-2 py-1 rounded break-all">
              {filename}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-green-700">
            <span className="font-medium">📊 Références ajoutées :</span>
            <span className="bg-green-100 px-2 py-1 rounded font-semibold">
              {referenceCount}
            </span>
          </div>
        </div>

        {/* Actions */}
        {onDownloadAgain && (
          <div className="mb-3">
            <button
              onClick={onDownloadAgain}
              className="w-full bg-green-100 hover:bg-green-200 text-green-700 font-medium py-2 px-4 rounded-lg border border-green-300 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger à nouveau
            </button>
          </div>
        )}
        
        {/* Auto-close info */}
        <div className="text-xs text-green-600 text-center">
          Cette notification se fermera automatiquement dans quelques secondes
        </div>
      </div>
    </div>
  );
};
