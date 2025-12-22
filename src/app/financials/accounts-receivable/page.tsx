
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
import { accountsReceivableData } from '@/lib/data';
import { AccountsReceivableTable } from '@/components/dashboard/accounts-receivable-table';
import type { AccountsReceivableEntry } from '@/lib/data';

export default function AccountsReceivablePage() {
  // Use state to make the data dynamic. In a real app, this would be fetched from an API.
  const [arData, setArData] = useState<AccountsReceivableEntry[]>(accountsReceivableData);

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
              Accounts Receivable
            </h2>
            <p className="text-muted-foreground">
              Detailed view of all approved GRNs and outstanding invoices.
            </p>
          </div>
          <div className="mt-6">
            <AccountsReceivableTable data={arData} />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
