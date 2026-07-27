import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import type { Faq } from '@/lib/types';

export function AdminFaq() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const load = async () => {
    const { data } = await supabase.from('faqs').select('*').order('sort_order', { ascending: true });
    setFaqs((data as unknown as Faq[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setQuestion(''); setAnswer(''); setEditing(null); setShowForm(false); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await supabase.from('faqs').update({ question, answer }).eq('id', editing.id);
    } else {
      await supabase.from('faqs').insert({ question, answer, is_published: true, sort_order: faqs.length });
    }
    resetForm();
    await load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('faqs').delete().eq('id', id);
    await load();
  };

  const togglePublished = async (faq: Faq) => {
    await supabase.from('faqs').update({ is_published: !faq.is_published }).eq('id', faq.id);
    await load();
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FAQ Management</h1>
          <p className="text-sm text-muted-foreground">Manage frequently asked questions</p>
        </div>
        <Button variant="gradient" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> New FAQ
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editing ? 'Edit FAQ' : 'New FAQ'}</h3>
              <button onClick={resetForm} className="rounded-lg p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} required rows={4}
                  className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <Button type="submit"><Save className="h-4 w-4" /> {editing ? 'Update' : 'Create'}</Button>
            </form>
          </Card>
        </motion.div>
      )}

      <Card className="glass">
        <CardHeader><CardTitle>FAQs ({faqs.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <div key={faq.id} className="flex items-start justify-between rounded-lg border border-border/50 p-4">
                <div className="flex-1">
                  <p className="font-medium">{faq.question}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => togglePublished(faq)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium ${faq.is_published ? 'bg-success/15 text-success' : 'bg-secondary text-muted-foreground'}`}>
                    {faq.is_published ? 'Published' : 'Hidden'}
                  </button>
                  <button onClick={() => { setEditing(faq); setQuestion(faq.question); setAnswer(faq.answer); setShowForm(true); }}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(faq.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
