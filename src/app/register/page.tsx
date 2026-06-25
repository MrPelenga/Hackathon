"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= 8, label: "8 caractères minimum" },
    { ok: /[A-Z]/.test(password), label: "Une majuscule" },
    { ok: /[0-9]/.test(password), label: "Un chiffre" },
  ];
  if (!password) return null;
  return (
    <div className="mt-1.5 space-y-0.5">
      {checks.map((c) => (
        <p key={c.label} className={`text-[11px] ${c.ok ? "text-emerald-600" : "text-muted-foreground"}`}>
          {c.ok ? "✓" : "○"} {c.label}
        </p>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'inscription.");
      } else {
        router.push("/login?registered=1");
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 text-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Campus</h1>
          <p className="text-sm text-slate-400">Créer un compte étudiant</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/60 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Inscription</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Tout nouvel inscrit obtient le rôle Étudiant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-slate-300 text-xs">Prénom</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="firstName"
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      placeholder="Alice"
                      className="pl-8 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-9 text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-slate-300 text-xs">Nom</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Dupont"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-slate-300 text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="alice.dupont@email.fr"
                    className="pl-8 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-slate-300 text-xs">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder="••••••••"
                    className="pl-8 pr-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-9 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm" className="text-slate-300 text-xs">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="confirm"
                    type="password"
                    value={form.confirm}
                    onChange={(e) => set("confirm", e.target.value)}
                    placeholder="••••••••"
                    className="pl-8 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 h-9 text-sm"
                    required
                  />
                </div>
                {form.confirm && form.password !== form.confirm && (
                  <p className="text-[11px] text-destructive">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              <Button type="submit" className="w-full mt-1" disabled={loading}>
                {loading ? "Création du compte…" : "Créer mon compte"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-400">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-slate-200 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
