import { Zap } from "lucide-react";
import { ModulePlaceholder } from "../_placeholder/ModulePlaceholder";

export default function EnergyPage() {
  return (
    <ModulePlaceholder
      title="Énergie"
      description="Tableau de bord de consommation électrique avec prédiction IA et recommandations d'économies."
      icon={Zap}
      features={[
        "Consommation en temps réel par bâtiment",
        "Graphiques sur 7/30/90 jours",
        "Suivi des économies réalisées",
        "Prédiction de consommation (IA heuristique)",
        "Alertes de consommation anormale",
        "Recommandations d'optimisation",
        "Export CSV des données",
      ]}
    />
  );
}
