
'use client';

import Link from 'next/link';
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
import {
  overviewData,
  invoiceStatusData,
  costAnalysisData,
  accountsReceivableData as initialArData
} from '@/lib/data';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { InvoiceStatusChart } from '@/components/dashboard/invoice-status-chart';
import { CostAnalysisChart } from '@/components/dashboard/cost-analysis-chart';
import { AccountsReceivableTable } from '@/components/dashboard/accounts-receivable-table';
import { DollarSign, Receipt, FilePlus2, ListChecks, Printer, TrendingUp, Wallet, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PrintableFinancialReport } from '@/components/dashboard/printable-financial-report';
import type { AccountsReceivableEntry } from '@/lib/data';


export default function FinancialsPage() {
    const [accountsReceivableData, setAccountsReceivableData] = useState<AccountsReceivableEntry[]>(initialArData);

  const handlePrintReport = () => {
    const printableElement = document.querySelector('.printable-financial-report');
    if (printableElement) {
        document.body.classList.add('printing-active');
        window.print();
        document.body.classList.remove('printing-active');
    }
  }

  return (
    <>
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
          <div className="non-printable">
            <Header />
          </div>
          <main className="p-4 md:p-6 lg:p-8 grid gap-6 md:gap-8 grid-cols-12">
            <div className="col-span-12 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Financials Dashboard
                </h2>
                <p className="text-muted-foreground">
                  Monitor accounts, invoices, and operational costs.
                </p>
              </div>
               <Button variant="outline" onClick={handlePrintReport}>
                  <Printer className="mr-2" />
                  Print Report
              </Button>
            </div>

            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/financials/accounts-receivable" className="block transition-transform hover:scale-[1.02]">
                  <OverviewCard data={overviewData.accountsReceivable} icon={DollarSign} />
              </Link>
              <Link href="/financials/invoices" className="block transition-transform hover:scale-[1.02]">
                  <OverviewCard data={overviewData.invoicesDue} icon={Receipt} />
              </Link>
              <Link href="/analytics" className="block transition-transform hover:scale-[1.02]">
                  <OverviewCard data={overviewData.profitMargin} icon={TrendingUp} />
              </Link>
              <Link href="/utility" className="block transition-transform hover:scale-[1.02]">
                  <OverviewCard data={overviewData.opex} icon={Wallet} />
              </Link>
            </div>
            
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-medium">
                    Financial Actions
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Manage quotes, invoices, and statements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                  <Link href="/financials/quotes/new" className='w-full'>
                    <Button className="w-full">
                      <FilePlus2 className="mr-2" />
                      Create Quote
                    </Button>
                  </Link>
                  <Link href="/financials/invoices" className='w-full'>
                    <Button variant="secondary" className="w-full">
                      <ListChecks className="mr-2" />
                      View All Invoices
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              <Link href="/utility" className="block transition-transform hover:scale-[1.02]">
                  <OverviewCard data={overviewData.capex} icon={Landmark} />
              </Link>
            </div>


            <div className="col-span-12 lg:col-span-7">
                <Link href="/financials/accounts-receivable" className="block h-full transition-transform hover:scale-[1.02]">
                    <AccountsReceivableTable data={accountsReceivableData} />
                </Link>
            </div>

            <div className="col-span-12 lg:col-span-5">
              <Link href="/financials/invoices" className="block h-full transition-transform hover:scale-[1.02]">
                <InvoiceStatusChart data={invoiceStatusData} />
              </Link>
            </div>
            
            <div className="col-span-12">
              <Link href="/analytics" className="block h-full transition-transform hover:scale-[1.02]">
                <CostAnalysisChart data={costAnalysisData} />
              </Link>
            </div>

          </main>
        </SidebarInset>
      </SidebarProvider>
      <div className="printable-financial-report-container printable-area">
        <PrintableFinancialReport
            accountsReceivableData={accountsReceivableData}
            generalLedgerData={[]}
        />
      </div>
    </>
  );
}
