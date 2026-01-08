import { toast } from "sonner";

export const showSuccess = (message: string) => {
  toast.success(message, { duration: 3500 });
};

export const showError = (message: string) => {
  toast.error(message, { duration: 4500 });
};

// Retourne un ID; auto-dismiss de secours après 60 s au cas où un chemin ne le ferme pas.
export const showLoading = (message: string) => {
  const id = toast.loading(message, { duration: Infinity });
  // Secours: on ferme au bout de 60s si le code appelant ne l'a pas fait
  const timer = window.setTimeout(() => {
    try {
      toast.dismiss(id);
    } catch {}
  }, 60000);
  // Optionnel: stocker le timer si besoin, mais ici on laisse simplement le garde-fou
  return String(id);
};

export const dismissToast = (toastId: string | number) => {
  toast.dismiss(toastId);
};

export const dismissAllToasts = () => {
  toast.dismiss();
};