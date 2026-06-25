"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Lock } from "lucide-react";
import { toast } from "sonner";

interface Props {
  initialFirstName: string;
  initialLastName: string;
  email: string;
}

export function PreferencesForm({ initialFirstName, initialLastName, email }: Props) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Profil mis à jour.");
      } else {
        toast.error(data.error ?? "Erreur.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPwd.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setPwdLoading(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Mot de passe modifié avec succès.");
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
      } else {
        toast.error(data.error ?? "Erreur.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Profile form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations du profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-sm">Prénom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-sm">Nom</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input value={email} disabled className="opacity-60" />
              <p className="text-[11px] text-muted-foreground">L&apos;email ne peut pas être modifié.</p>
            </div>
            <Button type="submit" size="sm" disabled={profileLoading}>
              {profileLoading ? "Sauvegarde…" : "Sauvegarder le profil"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Changer le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="currentPwd" className="text-sm">Mot de passe actuel</Label>
              <Input
                id="currentPwd"
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPwd" className="text-sm">Nouveau mot de passe</Label>
              <Input
                id="newPwd"
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="8 caractères minimum"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPwd" className="text-sm">Confirmer</Label>
              <Input
                id="confirmPwd"
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="••••••••"
                required
              />
              {confirmPwd && newPwd !== confirmPwd && (
                <p className="text-[11px] text-destructive">Les mots de passe ne correspondent pas.</p>
              )}
            </div>
            <Button type="submit" size="sm" variant="outline" disabled={pwdLoading}>
              {pwdLoading ? "Modification…" : "Changer le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Language info — fixed French */}
      <div className="rounded-md border p-4">
        <p className="text-sm font-medium mb-1">Langue de l&apos;interface</p>
        <p className="text-sm text-muted-foreground">Français <span className="text-xs bg-muted px-2 py-0.5 rounded ml-1">Fixe</span></p>
        <p className="text-[11px] text-muted-foreground mt-1">L&apos;interface est disponible uniquement en français.</p>
      </div>
    </div>
  );
}
