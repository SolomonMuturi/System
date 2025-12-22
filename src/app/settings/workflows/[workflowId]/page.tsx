
'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/layout/client-layout';
import { FreshViewLogo } from '@/components/icons';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Send, User, Bell } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { employeeData } from '@/lib/data';


const workflowData = {
    'incoming-shipment': {
        name: "Incoming Shipment Processing",
        description: "Automate tasks from pre-registration to final put-away. Notify quality control, assign receiving bays, and trigger labeling upon weight capture.",
        steps: [
            { id: 'step1', name: 'Vehicle Arrival', description: 'When a pre-registered vehicle checks in.', trigger: 'Vehicle Check-in' },
            { id: 'step2', name: 'Quality Control', description: 'After arrival, before weighing.', trigger: 'QC Scan' },
            { id: 'step3', name: 'Weight Capture', description: 'When weight is recorded.', trigger: 'Weight Logged' },
            { id: 'step4', name: 'Put-Away', description: 'After tagging is complete.', trigger: 'Pallet Scanned at Cold Room' },
        ]
    },
     'visitor-approval': {
        name: "Visitor & Host Approval",
        description: "Create multi-step approval chains for high-security visitors. Require host and security manager approval before a QR code is issued.",
        steps: [
             { id: 'step1', name: 'Visitor Pre-registers', description: 'When a visitor is registered by a host.', trigger: 'Visitor Registration' },
             { id: 'step2', name: 'Host Approval', description: 'Host must approve the visit.', trigger: 'Approval Request' },
             { id: 'step3', name: 'Security Approval', description: 'Security lead must approve high-profile guests.', trigger: 'Approval Request' },
             { id: 'step4', name: 'QR Code Issued', description: 'Visitor receives their QR code for check-in.', trigger: 'All Approvals Complete' },
        ]
    },
    'payroll-advance': {
        name: "Payroll & Advance Approval",
        description: "Set rules for automatic approval of small salary advances based on employee tenure, while routing larger requests to management for review.",
        steps: [
            { id: 'step1', name: 'Advance Requested', description: 'Employee requests a salary advance.', trigger: 'Advance Request Submitted' },
            { id: 'step2', name: 'Automatic Approval Check', description: 'Check if amount is below KES 5,000.', trigger: 'Amount Check' },
            { id: 'step3', name: 'Manager Approval', description: 'If above KES 5,000, route to manager.', trigger: 'Approval Request' },
            { id: 'step4', name: 'Payment Disbursed', description: 'Payment sent via M-Pesa.', trigger: 'Approval Complete' },
        ]
    }
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const workflowId = params.workflowId as string;
  const workflow = workflowData[workflowId as keyof typeof workflowData];

  const handleSave = () => {
    toast({
        title: 'Workflow Saved',
        description: `Your changes to the "${workflow.name}" workflow have been saved.`,
    })
  }

  if (!workflow) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <FreshViewLogo className="w-8 h-8 text-primary" />
              <h1 className="text-xl font-headline font-bold text-sidebar-foreground">Harir International</h1>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav />
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="p-4 md:p-6 lg:p-8">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2" />
              Back to Settings
            </Button>
            <div className="flex items-center justify-center h-64">
              <p>Workflow not found.</p>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshViewLogo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold text-sidebar-foreground">Harir International</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2" />
              Back to Settings
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">{workflow.name}</h2>
            <p className="text-muted-foreground">{workflow.description}</p>
          </div>
          
          <div className="space-y-6">
            {workflow.steps.map((step, index) => (
                <Card key={step.id}>
                    <CardHeader>
                        <CardTitle className='flex items-center justify-between'>
                            <span>Step {index + 1}: {step.name}</span>
                            <div className='flex items-center gap-2'>
                                <Label htmlFor={`step-switch-${step.id}`} className="text-sm font-normal">Enabled</Label>
                                <Switch id={`step-switch-${step.id}`} defaultChecked={index < 2} />
                            </div>
                        </CardTitle>
                        <CardDescription>Trigger: <span className="font-semibold text-primary">{step.trigger}</span></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <p className="text-sm">{step.description}</p>
                       <Separator />
                       <h4 className="font-medium">Actions</h4>
                       <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div className='flex items-center gap-2'>
                                <Bell />
                                <Label>Notify User</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select defaultValue="emp-4">
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employeeData.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Switch defaultChecked={index === 0} />
                            </div>
                       </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                            <div className='flex items-center gap-2'>
                                <Send />
                                <Label>Send Report</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select defaultValue="emp-1">
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employeeData.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Switch />
                            </div>
                       </div>
                    </CardContent>
                </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave}>
                <Check className="mr-2" />
                Save Workflow
            </Button>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
