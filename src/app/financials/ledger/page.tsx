
'use client';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { generalLedgerData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

export default function LedgerPage() {
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
          <div className="col-span-12">
            <h2 className="text-2xl font-bold tracking-tight">
              General Ledger
            </h2>
            <p className="text-muted-foreground">
              A detailed record of all financial transactions.
            </p>
          </div>
          <Card className="mt-6">
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <FileText />
                    Transactions
                </CardTitle>
                <CardDescription>
                    Browse and verify all journal entries.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Debit (KES)</TableHead>
                            <TableHead className="text-right">Credit (KES)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {generalLedgerData.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{entry.date}</TableCell>
                                <TableCell>{entry.account}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell><Badge variant="outline">{entry.type}</Badge></TableCell>
                                <TableCell className="text-right font-mono">
                                {entry.debit > 0 ? entry.debit.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                {entry.credit > 0 ? entry.credit.toLocaleString('en-KE', { style: 'currency', currency: 'KES' }) : '-'}
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
