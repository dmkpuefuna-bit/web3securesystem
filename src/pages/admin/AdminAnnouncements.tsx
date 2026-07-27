import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { cn, timeAgo } from '@/lib/utils';
import type { Announcement } from '@/lib/types';

export function AdminAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('info');

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setItems((data as unknown as Announcement[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setTitle(''); setContent(''); setType('info'); setEditing(null); setShowForm(false); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await supabase.from('announcements').update({ title, content, type }).eq('id', editing.id);
    } else {
      await supabase.from('announcements').insert({ title, content, type, is_active: true });
    }
    resetForm();
    await load();
  };

  const toggleActive = async (item: Announcement) => {
    await supabase.from('announcements').update({ is_active: !item.is_active }).eq('id', item.id);
    await load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    await load();
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-muted-foreground">Manage platform announcements</p>
        </div>
        <Button variant="gradient" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editing ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button onClick={resetForm} className="rounded-lg p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={3}
                  className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select id="type" value={type} onChange={(e) => setType(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-secondary/50 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <Button type="submit"><Save className="h-4 w-4" /> {editing ? 'Update' : 'Create'}</Button>
            </form>
          </Card>
        </motion.div>
      )}

      <Card className="glass">
        <CardHeader><CardTitle>Announcements ({items.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant={item.type === 'critical' ? 'destructive' : item.type === 'warning' ? 'warning' : item.type === 'success' ? 'success' : 'default'}>{item.type}</Badge>
                    <Badge variant={item.is_active ? 'success' : 'secondary'}>{item.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(item.created_at)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(item)}
                    className={cn('rounded-lg px-3 py-1 text-xs font-medium', item.is_active ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground')}>
                    {item.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => { setEditing(item); setTitle(item.title); setContent(item.content); setType(item.type); setShowForm(true); }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
