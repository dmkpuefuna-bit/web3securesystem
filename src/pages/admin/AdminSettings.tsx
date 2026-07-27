import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Save, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { supabase } from "@/lib/supabase";
import type { Setting } from "@/lib/types";

export function AdminSettings() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      const settingsData = (data as unknown as Setting[]) ?? [];
      setSettings(settingsData);
      const vals: Record<string, string> = {};
      settingsData.forEach((s) => {
        vals[s.key] =
          typeof s.value === "string"
            ? s.value.replace(/"/g, "")
            : JSON.stringify(s.value);
      });
      setValues(vals);
    } catch (err) {
      setError((err as Error).message || "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    for (const setting of settings) {
      const val = values[setting.key] ?? "";
      const jsonValue = setting.key === "social_links" ? val : `"${val}"`;
      await supabase
        .from("settings")
        .update({
          value: JSON.parse(jsonValue),
          updated_by: user?.id,
        })
        .eq("key", setting.key);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const categories = [...new Set(settings.map((s) => s.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage CMS settings and configuration
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {categories.map((category) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass">
              <CardHeader>
                <CardTitle className="capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings
                  .filter((s) => s.category === category)
                  .map((setting) => (
                    <div key={setting.key} className="space-y-2">
                      <Label htmlFor={setting.key}>
                        {setting.key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Label>
                      <Input
                        id={setting.key}
                        value={values[setting.key] ?? ""}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            [setting.key]: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save All Settings
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-success">
              <Check className="h-4 w-4" /> Settings saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
