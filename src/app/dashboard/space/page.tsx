import { LayoutGrid } from "lucide-react";
import { ModulePlaceholder } from "../_placeholder/ModulePlaceholder";

export default function SpacePage() {
  return (
    <ModulePlaceholder
      title="Gestion des Espaces"
      description="Occupation, capacité, taux d'utilisation et recommandations IA d'optimisation des salles."
      icon={LayoutGrid}
      features={[
        "Taux d'occupation en temps réel par salle",
        "Historique sur 7/30 jours",
        "Identification des espaces sous-utilisés",
        "Alertes saturation (>90% capacité)",
        "Recommandations IA de regroupement",
        "Vue thermique d'occupation du campus",
        "Export des données d'usage",
      ]}
    />
  );
}
