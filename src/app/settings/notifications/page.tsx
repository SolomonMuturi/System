
'use client';

import { useState } from 'react';
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
import { NotificationSettings } from '@/components/dashboard/notification-settings';
import { useToast } from '@/hooks/use-toast';
import type { NotificationPreferences } from '@/components/dashboard/notification-settings';
import { employeeData } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const initialPreferences: NotificationPreferences = Object.fromEntries(
  employeeData.map(e => [
    e.id,
    {
      inApp: e.role === 'Manager' || e.role === 'Admin',
      sms: e.role === 'Manager',
      whatsApp: false,
    },
  ])
);

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState(initialPreferences);

  const handleSaveChanges = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    toast({
      title: 'Settings Saved',
      description: 'Notification preferences have been updated successfully.',
    });
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <FreshViewLogo className="w-8 h-8 text-primary" />
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
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Button variant="outline" onClick={() => router.back()} className="mb-4">
                        <ArrowLeft className="mr-2" />
                        Back to Settings
                    </Button>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Notification Management
                    </h2>
                    <p className="text-muted-foreground">
                        Configure In-App, SMS, and WhatsApp alert preferences for all users.
                    </p>
                </div>
                <NotificationSettings 
                    employees={employeeData} 
                    initialPreferences={preferences}
                    onSaveChanges={handleSaveChanges}
                />
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
