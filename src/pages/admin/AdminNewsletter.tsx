import { useEffect, useState } from 'react';
import { Mail, Loader2, Download, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import type { NewsletterSubscriber } from '@/lib/types';

export function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false });
      setSubscribers((data as unknown as NewsletterSubscriber[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = subscribers.filter((s) => s.email.toLowerCase().includes(search.toLowerCase()));

  const exportCsv = () => {
    const csv = ['email,status,subscribed_at'];
    filtered.forEach((s) => {
      csv.push(`${s.email},${s.is_active ? 'active' : 'inactive'},${s.subscribed_at}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'newsletter_subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Newsletter</h1>
          <p className="text-sm text-muted-foreground">{subscribers.length} subscribers</p>
        </div>
        <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search subscribers..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="glass">
        <CardHeader><CardTitle>Subscribers ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary"><Mail className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-medium">{sub.email}</p>
                    <p className="text-xs text-muted-foreground">Subscribed {timeAgo(sub.subscribed_at)}</p>
                  </div>
                </div>
                <Badge variant={sub.is_active ? 'success' : 'secondary'}>{sub.is_active ? 'Active' : 'Unsubscribed'}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
