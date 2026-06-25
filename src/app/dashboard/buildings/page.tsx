import { Building2 } from "lucide-react";
import { ModulePlaceholder } from "../_placeholder/ModulePlaceholder";

export default function BuildingsPage() {
  return (
    <ModulePlaceholder
      title="Bâtiments & Salles"
      description="Gestion des équipements connectés par salle (volets, lumières, capteurs de présence)."
      icon={Building2}
      features={[
        "Liste de toutes les salles par bâtiment",
        "État des équipements en temps réel",
        "Contrôle volets et lumières",
        "Capteur de présence par salle",
        "Historique d'utilisation",
        "Filtres par type de salle",
      ]}
    />
  );
}
