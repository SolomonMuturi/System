
'use client';

import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshTraceLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { quoteData } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Send, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function QuotesPage() {
  const router = useRouter();
  const statusVariant = {
    'Draft': 'secondary',
    'Sent': 'default',
    'Accepted': 'outline',
    'Expired': 'destructive',
  } as const;

  const handleRowClick = (quoteId: string) => {
    router.push(`/financials/quotes/new?id=${quoteId}`); // Open as editable for now
  };
  
  const handlePrint = (e: React.MouseEvent, quoteId: string) => {
    e.stopPropagation();
    // In a real app, this would trigger a print view for the specific quote
    console.log(`Printing quote ${quoteId}`);
    window.print();
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshTraceLogo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold text-sidebar-foreground">
              Harir International
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Quotation Management
              </h2>
              <p className="text-muted-foreground">
                Search, view, and manage all system quotations.
              </p>
            </div>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="text" placeholder="Enter Quote ID or Customer" />
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText />
                All Quotations
              </CardTitle>
              <CardDescription>
                A complete list of all quotations in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quote ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount (KES)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quoteData.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        'cursor-pointer',
                         entry.status === 'Expired' && 'bg-destructive/10'
                      )}
                      onClick={() => handleRowClick(entry.id)}
                    >
                      <TableCell className="font-mono">
                        {entry.quoteId}
                      </TableCell>
                      <TableCell>{entry.customer}</TableCell>
                      <TableCell>{format(new Date(entry.date), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>{format(new Date(entry.validUntil), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[entry.status]}
                          className="capitalize"
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.amount.toLocaleString('en-KE', {
                          style: 'currency',
                          currency: 'KES',
                        })}
                      </TableCell>
                      <TableCell
                        className="text-right space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {entry.status === 'Draft' && (
                           <Button variant="outline" size="sm">
                            <Send className="mr-2 h-4 w-4" />
                            Send
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={(e) => handlePrint(e, entry.id)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
