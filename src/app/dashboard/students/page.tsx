import { Users } from "lucide-react";
import { ModulePlaceholder } from "../_placeholder/ModulePlaceholder";

export default function StudentsPage() {
  return (
    <ModulePlaceholder
      title="Étudiants & Présence"
      description="Check-in/check-out badge, présence en temps réel par bâtiment, historique de présence."
      icon={Users}
      features={[
        "Liste des étudiants présents sur le campus",
        "Localisation par bâtiment en temps réel",
        "Historique check-in/check-out",
        "Badge virtuel / QR code",
        "Statistiques de présence par programme",
        "Export de présence",
      ]}
    />
  );
}
