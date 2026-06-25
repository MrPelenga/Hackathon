import { TrendingUp } from "lucide-react";
import { ModulePlaceholder } from "../_placeholder/ModulePlaceholder";

export default function AffluencePage() {
  return (
    <ModulePlaceholder
      title="Affluence"
      description="Prédiction d'affluence du resto U et de la cafétéria pour éviter les pics."
      icon={TrendingUp}
      features={[
        "Affluence en temps réel (capteurs + badges)",
        "Prédiction J+1 basée sur l'historique",
        "Courbe d'affluence par créneau horaire",
        "Alertes saturation (>80% capacité)",
        "Recommandation du meilleur horaire",
        "Historique sur 30 jours",
      ]}
    />
  );
}
