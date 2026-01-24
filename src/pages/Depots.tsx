import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, MapPin, Phone } from 'lucide-react';

export default function Depots() {
  const { data: depots, isLoading } = useQuery({
    queryKey: ['depots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('depots')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Depots</h1>
        <p className="text-muted-foreground">Manage warehouse and distribution centers</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {depots?.map((depot) => (
          <Card key={depot.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{depot.name}</h3>
                    <Badge variant={depot.is_active ? "default" : "secondary"}>
                      {depot.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {depot.location}
                    </div>
                    {depot.contact_phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {depot.contact_phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Depots</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 w-full bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depots?.map((depot) => (
                  <TableRow key={depot.id}>
                    <TableCell className="font-medium">{depot.name}</TableCell>
                    <TableCell>{depot.location}</TableCell>
                    <TableCell>{depot.contact_phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={depot.is_active ? "default" : "secondary"}>
                        {depot.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
