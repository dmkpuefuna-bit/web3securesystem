import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Edit2, Trash2, X, Save, Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/lib/types";

export function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [avatarUrl, setAvatarUrl] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });
    setItems((data as unknown as Testimonial[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setAuthorName("");
    setAuthorRole("");
    setContent("");
    setRating(5);
    setAvatarUrl("");
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await supabase
        .from("testimonials")
        .update({
          author_name: authorName,
          author_role: authorRole || null,
          content,
          rating,
          author_avatar_url: avatarUrl || null,
        })
        .eq("id", editing.id);
    } else {
      await supabase
        .from("testimonials")
        .insert({
          author_name: authorName,
          author_role: authorRole || null,
          content,
          rating,
          author_avatar_url: avatarUrl || null,
          is_published: true,
          sort_order: items.length,
        });
    }
    resetForm();
    await load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("testimonials").delete().eq("id", id);
    await load();
  };

  const togglePublished = async (item: Testimonial) => {
    await supabase
      .from("testimonials")
      .update({ is_published: !item.is_published })
      .eq("id", item.id);
    await load();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Testimonials</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer testimonials
          </p>
        </div>
        <Button
          variant="gradient"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4" /> New Testimonial
        </Button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {editing ? "Edit Testimonial" : "New Testimonial"}
              </h3>
              <button
                onClick={resetForm}
                className="rounded-lg p-2 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Author Name</Label>
                  <Input
                    id="name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Author Role</Label>
                  <Input
                    id="role"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    placeholder="CEO at Company"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                      >
                        <Star
                          className={cn(
                            "h-6 w-6",
                            n <= rating
                              ? "fill-warning text-warning"
                              : "text-muted-foreground",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL</Label>
                  <Input
                    id="avatar"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit">
                <Save className="h-4 w-4" /> {editing ? "Update" : "Create"}
              </Button>
            </form>
          </Card>
        </motion.div>
      )}

      <Card className="glass">
        <CardHeader>
          <CardTitle>Testimonials ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border/50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {item.author_avatar_url ? (
                      <img
                        src={item.author_avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                        {item.author_name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{item.author_name}</p>
                      {item.author_role && (
                        <p className="text-xs text-muted-foreground">
                          {item.author_role}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => togglePublished(item)}
                      className={cn(
                        "rounded-lg px-2 py-1 text-xs font-medium",
                        item.is_published
                          ? "bg-success/15 text-success"
                          : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {item.is_published ? "Live" : "Hidden"}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(item);
                        setAuthorName(item.author_name);
                        setAuthorRole(item.author_role ?? "");
                        setContent(item.content);
                        setRating(item.rating);
                        setAvatarUrl(item.author_avatar_url ?? "");
                        setShowForm(true);
                      }}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  "{item.content}"
                </p>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-warning text-warning"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
