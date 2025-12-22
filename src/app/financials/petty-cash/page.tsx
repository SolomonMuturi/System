
'use client';

import { useState } from 'react';
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
import { pettyCashData } from '@/lib/data';
import type { PettyCashTransaction } from '@/lib/data';
import { PettyCashCard } from '@/components/dashboard/petty-cash-card';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

export default function PettyCashPage() {
  const [transactions, setTransactions] = useState<PettyCashTransaction[]>(pettyCashData);
  const { toast } = useToast();

  const handleTransaction = (newTx: Omit<PettyCashTransaction, 'id' | 'timestamp'>) => {
    const transaction: PettyCashTransaction = {
      ...newTx,
      id: `pc-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setTransactions(prev => [transaction, ...prev]);

    toast({
        title: `M-Pesa Payment Initiated`,
        description: `Sending KES ${transaction.amount} to ${transaction.recipient} (${transaction.phone}) for "${transaction.description}".`,
    });
  };

  const balance = transactions.reduce((acc, tx) => {
    return tx.type === 'in' ? acc + tx.amount : acc - tx.amount;
  }, 0);

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
            <div className="max-w-4xl mx-auto space-y-6">
                 <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Petty Cash Management
                    </h2>
                    <p className="text-muted-foreground">
                        Dispense and record petty cash transactions via M-Pesa.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet />
                            Current Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold font-mono">KES {balance.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <PettyCashCard 
                    transactions={transactions}
                    onTransaction={handleTransaction}
                />
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
