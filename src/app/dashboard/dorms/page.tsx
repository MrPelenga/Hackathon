import { BedDouble } from "lucide-react";
import { ModulePlaceholder } from "../_placeholder/ModulePlaceholder";

export default function DormsPage() {
  return (
    <ModulePlaceholder
      title="Résidences Universitaires"
      description="Gestion des chambres, attributions, équipements et contrôle d'accès des dortoirs."
      icon={BedDouble}
      features={[
        "Liste des chambres et occupants",
        "Attribution chambre ↔ étudiant",
        "Équipements par chambre",
        "Contrôle d'accès par badge",
        "Taux d'occupation résidence",
        "Gestion des fins de contrat",
      ]}
    />
  );
}
