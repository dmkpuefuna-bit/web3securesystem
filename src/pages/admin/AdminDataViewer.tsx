import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

interface AdminDataViewerProps {
  title: string;
  description: string;
  table: string;
  columns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[];
  searchKeys?: string[];
}

export function AdminDataViewer({
  title,
  description,
  table,
  columns,
  searchKeys = [],
}: AdminDataViewerProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setError(null);
      setLoading(true);
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        setError(error.message);
        setRows([]);
      } else {
        setRows((data as Record<string, unknown>[]) ?? []);
      }
      setLoading(false);
    })();
  }, [table]);

  const filtered = rows.filter((row) => {
    if (!search) return true;
    return searchKeys.some((key) =>
      String(row[key] ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {searchKeys.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <Card className="glass">
        <CardHeader>
          <CardTitle>
            {title} ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No records found.
            </p>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr
                      key={(row.id as string) ?? i}
                      className="border-b border-border/50 transition-colors hover:bg-white/5"
                    >
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-sm">
                          {col.render
                            ? col.render(row)
                            : String(row[col.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
