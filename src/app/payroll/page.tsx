
'use client';

import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
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
import { employeeData, advanceRequestsData as initialAdvanceRequests, payrollDistributionData, payrollTrendData } from '@/lib/data';
import type { Employee, AdvanceRequest } from '@/lib/data';
import { OverviewCard } from '@/components/dashboard/overview-card';
import { Wallet, Landmark, HandCoins, Printer, CheckCircle } from 'lucide-react';
import { AdvanceRequests } from '@/components/dashboard/advance-requests';
import { PayrollTable } from '@/components/dashboard/payroll-table';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PrintablePayrollReport } from '@/components/dashboard/printable-payroll-report';
import { PayrollDistributionChart } from '@/components/dashboard/payroll-distribution-chart';
import { PayrollTrendChart } from '@/components/dashboard/payroll-trend-chart';
import { useUser } from '@/hooks/use-user';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type PayrollRun = {
  id: string;
  employeeIds: string[];
  totalAmount: number;
  status: 'Pending Approval' | 'Paid';
  submittedBy: string;
  submittedAt: string;
};

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>(employeeData);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>(initialAdvanceRequests);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const { toast } = useToast();
  const { user } = useUser();
  const printRef = useRef<HTMLDivElement>(null);

  const totalPayroll = employees.reduce((acc, emp) => {
      if (emp.contract === 'Full-time' || emp.contract === 'Part-time') {
          return acc + emp.salary;
      }
      return acc;
  }, 0);
  const advancesPaid = advanceRequests
    .filter(req => req.status === 'Paid' || req.status === 'Approved')
    .reduce((acc, req) => acc + req.amount, 0);

  const kpiData = {
    totalPayroll: {
      title: 'Total Payroll (July)',
      value: `KES ${totalPayroll.toLocaleString()}`,
      change: 'for salaried employees',
      changeType: 'increase' as const,
    },
    advancesPaid: {
      title: 'Advances Paid (Month)',
      value: `KES ${advancesPaid.toLocaleString()}`,
      change: 'across all employees',
      changeType: 'increase' as const,
    },
    netPay: {
      title: 'Estimated Net Pay',
      value: `KES ${(totalPayroll - advancesPaid).toLocaleString()}`,
      change: 'after deductions',
      changeType: 'increase' as const,
    },
  };

  const handleAdvanceAction = (requestId: string, action: 'approve' | 'reject' | 'pay') => {
    const request = advanceRequests.find(r => r.id === requestId);
    if (!request) return;

    if (action === 'pay') {
        // Simulate M-Pesa payment
        toast({
            title: 'M-Pesa Payment Initiated',
            description: `Sending KES ${request.amount} to ${employeeData.find(e=>e.id === request.employeeId)?.name}. You will receive an SMS confirmation.`,
        });
        setAdvanceRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Paid' } : r));
    } else {
        const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
        setAdvanceRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
        toast({
            title: `Request ${newStatus}`,
            description: `Advance request for KES ${request.amount} has been ${newStatus.toLowerCase()}.`,
        });
    }
  };

  const handleSubmitForApproval = (employeeIds: string[], totalAmount: number) => {
    const newRun: PayrollRun = {
      id: `pr-${Date.now()}`,
      employeeIds,
      totalAmount,
      status: 'Pending Approval',
      submittedBy: user?.name || 'Unknown',
      submittedAt: new Date().toISOString(),
    };
    setPayrollRuns(prev => [newRun, ...prev]);
    toast({
      title: 'Payroll Submitted',
      description: `Payroll for ${employeeIds.length} employees submitted for CEO approval.`,
    });
  };

  const handleApproveAndPay = (runId: string) => {
    setPayrollRuns(prev =>
      prev.map(run => (run.id === runId ? { ...run, status: 'Paid' } : run))
    );
    toast({
      title: 'Payroll Approved & Paid',
      description: 'M-Pesa payments have been initiated for the approved payroll run.',
    });
  };
  
  const handlePrintReport = async () => {
    const element = printRef.current;
    if (element) {
        const canvas = await html2canvas(element, { scale: 2 });
        const data = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`payroll-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
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
          <Header />
          <main className="p-4 md:p-6 lg:p-8 space-y-6">
              <div className="flex items-center justify-between">
                  <div>
                      <h2 className="text-2xl font-bold tracking-tight">
                          Payroll &amp; Advances Management
                      </h2>
                      <p className="text-muted-foreground">
                          Process payroll and manage employee advance requests.
                      </p>
                  </div>
                  <Button variant="outline" onClick={handlePrintReport}>
                    <Printer className="mr-2" />
                    Download Report
                  </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <OverviewCard data={kpiData.totalPayroll} icon={Wallet} />
                <OverviewCard data={kpiData.advancesPaid} icon={HandCoins} />
                <OverviewCard data={kpiData.netPay} icon={Landmark} />
              </div>

              {user?.role === 'Admin' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Payroll Approvals</CardTitle>
                    <CardDescription>Review and approve payroll runs submitted by managers.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payrollRuns.filter(r => r.status === 'Pending Approval').length > 0 ? (
                      <div className="space-y-4">
                        {payrollRuns.filter(r => r.status === 'Pending Approval').map(run => (
                          <div key={run.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <div>
                              <p className="font-semibold">{run.employeeIds.length} Employees</p>
                              <p className="text-sm text-muted-foreground">Total: KES {run.totalAmount.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">Submitted by {run.submittedBy} on {format(new Date(run.submittedAt), 'PPP')}</p>
                            </div>
                            <Button onClick={() => handleApproveAndPay(run.id)}>
                              <CheckCircle className="mr-2"/>
                              Approve & Pay
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center p-4">No payroll runs are pending approval.</p>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                      <AdvanceRequests requests={advanceRequests} onAction={handleAdvanceAction} />
                  </div>
                  <div className="lg:col-span-2">
                      <PayrollTable employees={employees} onSubmitForApproval={handleSubmitForApproval} />
                  </div>
              </div>
              
              <div>
                  <h2 className="text-2xl font-bold tracking-tight mt-8 mb-4">
                      Payroll Analytics
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      <div className="lg:col-span-2">
                          <PayrollDistributionChart data={payrollDistributionData} />
                      </div>
                      <div className="lg:col-span-3">
                          <PayrollTrendChart data={payrollTrendData} />
                      </div>
                  </div>
              </div>

          </main>
        </SidebarInset>
      </SidebarProvider>
      <div className="printable-area -z-10 absolute">
        <div ref={printRef}>
          <PrintablePayrollReport 
            employees={employees} 
            requests={advanceRequests}
            kpis={kpiData}
          />
        </div>
      </div>
    </>
  );
}
