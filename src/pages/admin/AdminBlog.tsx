import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { slugify, timeAgo } from '@/lib/utils';
import type { BlogPost } from '@/lib/types';

export function AdminBlog() {
  const { profile } = useAuthStore();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const load = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    setPosts((data as unknown as BlogPost[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle(''); setExcerpt(''); setContent(''); setCategory(''); setCoverUrl('');
    setEditing(null); setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await supabase.from('blog_posts').update({
        title, excerpt, content, category, cover_image_url: coverUrl || null,
      }).eq('id', editing.id);
    } else {
      await supabase.from('blog_posts').insert({
        title, slug: slugify(title), excerpt, content,
        category: category || null, cover_image_url: coverUrl || null,
        author_name: profile?.full_name ?? 'Admin', status: 'published',
        published_at: new Date().toISOString(),
      });
    }
    resetForm();
    await load();
  };

  const handleEdit = (post: BlogPost) => {
    setEditing(post);
    setTitle(post.title); setExcerpt(post.excerpt ?? ''); setContent(post.content);
    setCategory(post.category ?? ''); setCoverUrl(post.cover_image_url ?? '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('blog_posts').delete().eq('id', id);
    await load();
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-sm text-muted-foreground">Create and manage blog posts</p>
        </div>
        <Button variant="gradient" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{editing ? 'Edit Post' : 'New Blog Post'}</h3>
              <button onClick={resetForm} className="rounded-lg p-2 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Input id="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover">Cover Image URL</Label>
                  <Input id="cover" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required rows={8}
                  className="w-full rounded-lg border border-input bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <Button type="submit"><Save className="h-4 w-4" /> {editing ? 'Update' : 'Publish'}</Button>
            </form>
          </Card>
        </motion.div>
      )}

      <Card className="glass">
        <CardHeader><CardTitle>Posts ({posts.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                  )}
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">{post.author_name} • {timeAgo(post.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {post.category && <Badge variant="outline">{post.category}</Badge>}
                  <Badge variant={post.status === 'published' ? 'success' : 'secondary'}>{post.status}</Badge>
                  <button onClick={() => handleEdit(post)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(post.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
