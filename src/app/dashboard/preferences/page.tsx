export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/server-auth";
import { PreferencesForm } from "./_components/PreferencesForm";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  TEACHER: "Enseignant",
  STUDENT: "Étudiant",
  MAINTENANCE: "Agent de maintenance",
};

export default async function PreferencesPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Préférences</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gérez votre profil et vos paramètres</p>
      </div>

      <div className="rounded-md border p-4 space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Mon compte</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <span className="text-xs bg-muted px-2 py-1 rounded-full">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </div>
        {user.role === "STUDENT" && (
          <p className="text-[11px] text-muted-foreground">
            Pour changer de rôle, contactez un administrateur.
          </p>
        )}
      </div>

      <PreferencesForm
        initialFirstName={user.name.split(" ")[0] ?? ""}
        initialLastName={user.name.split(" ").slice(1).join(" ") ?? ""}
        email={user.email}
      />
    </div>
  );
}
