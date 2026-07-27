import { useEffect, useState } from 'react';
import { Shield, Loader2, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/utils';
import type { AuditLog } from '@/lib/types';

export function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
      setLogs((data as unknown as AuditLog[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = logs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    (l.entity_type ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Track all administrative actions</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search logs..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="glass">
        <CardHeader><CardTitle>Recent Actions ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filtered.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary"><Shield className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.entity_type && <span>{log.entity_type}</span>}
                      {log.ip_address && <span> • {log.ip_address}</span>}
                      • {timeAgo(log.created_at)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{log.action.split('_')[0]}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
