
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
import { accountsReceivableData } from '@/lib/data';
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
import { FileText, Printer, Search, BellRing, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useState } from 'react';
import { format } from 'date-fns';

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [reminderTime, setReminderTime] = useState('09:00');
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);


  const statusVariant = {
    'On Time': 'default',
    'At Risk': 'secondary',
    Late: 'destructive',
  } as const;

  const handleRowClick = (invoiceId: string) => {
    router.push(`/financials/invoices/${invoiceId}`);
  };

  const handleScheduleReminder = (e: React.MouseEvent, invoiceId: string, customer: string) => {
    e.stopPropagation();
    if (!reminderDate) {
      toast({
        variant: 'destructive',
        title: 'No Date Selected',
        description: `Please select a date to schedule the reminder for invoice ${invoiceId}.`,
      });
      return;
    }
    
    const scheduledDateTime = format(reminderDate, 'MMM d, yyyy') + ` at ${reminderTime}`;

    toast({
      title: 'Reminder Scheduled',
      description: `A reminder for invoice ${invoiceId} has been scheduled for ${scheduledDateTime} to ${customer}.`,
    });
    setOpenPopoverId(null);
  };

  const handlePrint = (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation();
    router.push(`/financials/invoices/${invoiceId}`);
    // The detail page has a print function
  };

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
                Invoice Management
              </h2>
              <p className="text-muted-foreground">
                Search, view, and manage all system invoices.
              </p>
            </div>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="text" placeholder="Enter Invoice ID or Customer" />
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
                All Invoices
              </CardTitle>
              <CardDescription>
                A complete list of all invoices in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount (KES)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountsReceivableData.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        'cursor-pointer',
                        entry.agingStatus === 'Late' && 'bg-destructive/10'
                      )}
                      onClick={() => handleRowClick(entry.id)}
                    >
                      <TableCell className="font-mono">
                        {entry.invoiceId}
                      </TableCell>
                      <TableCell>{entry.customer}</TableCell>
                      <TableCell>{entry.dueDate}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant[entry.agingStatus]}
                          className="capitalize"
                        >
                          {entry.agingStatus}
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
                      >
                        {entry.agingStatus !== 'On Time' && (
                           <Popover open={openPopoverId === entry.id} onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? entry.id : null)}>
                            <PopoverTrigger asChild>
                               <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                <BellRing className="mr-2 h-4 w-4" />
                                Schedule Reminder
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
                                <div className="p-4 space-y-2">
                                    <p className="text-sm font-medium">Schedule a reminder for {entry.customer}</p>
                                    <div className="flex gap-2">
                                        <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
                                        <Button
                                            variant="default"
                                            onClick={(e) => handleScheduleReminder(e, entry.invoiceId, entry.customer)}
                                        >
                                            Schedule
                                        </Button>
                                    </div>
                                </div>
                                <Calendar
                                    mode="single"
                                    selected={reminderDate}
                                    onSelect={setReminderDate}
                                    initialFocus
                                />
                            </PopoverContent>
                          </Popover>
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
