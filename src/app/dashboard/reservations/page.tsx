import { BookOpen } from "lucide-react";
import { ModulePlaceholder } from "../_placeholder/ModulePlaceholder";

export default function ReservationsPage() {
  return (
    <ModulePlaceholder
      title="Réservation de Salles"
      description="Réserver une salle libre sur un créneau horaire, avec validation admin."
      icon={BookOpen}
      features={[
        "Calendrier interactif des disponibilités",
        "Filtres par capacité, type de salle, équipements",
        "Réservation avec confirmation",
        "Validation par l'administration",
        "Annulation et modification",
        "Vue de mes réservations",
      ]}
    />
  );
}
