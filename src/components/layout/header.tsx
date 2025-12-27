'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Search, LogOut } from 'lucide-react';
import { Input } from '../ui/input';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useEffect, useRef } from 'react'; // Added imports

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

  // Get initials from name
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/'
      });
      toast.success('Logged out successfully');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const resetLogoutTimer = () => {
    // Clear existing timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    
    // Set new timer for 10 minutes
    logoutTimerRef.current = setTimeout(() => {
      toast.warning('Session expired due to inactivity');
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  };

  // Function to track user activity
  const setupActivityListeners = () => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    const handleUserActivity = () => {
      resetLogoutTimer();
    };
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Cleanup function
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  };

  useEffect(() => {
    if (session?.user) {
      // Initialize the logout timer
      resetLogoutTimer();
      
      // Setup activity listeners
      const cleanup = setupActivityListeners();
      
      // Cleanup on unmount
      return () => {
        cleanup();
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
      };
    }
  }, [session?.user]);

  // Clear timer when component unmounts
  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  const user = session?.user;
  const userRole = (user as any)?.role || 'No Role';
  const userInitials = getInitials(user?.name || user?.email || 'U');

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <div className="hidden md:block">
          <h1 className="font-headline text-xl font-semibold tracking-tight">Dashboard</h1>
        </div>
      </div>
      
      <div className="flex flex-1 items-center justify-end gap-3 md:gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-9 w-[200px] lg:w-[280px] transition-all focus:w-[240px] lg:focus:w-[320px]"
          />
        </div>
        
        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "h-10 w-10 p-0 rounded-full",
                "hover:bg-primary/10 hover:scale-105",
                "transition-all duration-200",
                "border border-border hover:border-primary/20"
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm shadow-sm">
                {userInitials}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56 p-0" 
            align="end" 
            forceMount
            sideOffset={8}
          >
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold shadow-sm">
                  {userInitials}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <p className="text-sm font-medium truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                  <div className="mt-1">
                    <Badge variant="secondary" className="text-xs font-normal px-2 py-0 h-5">
                      {userRole}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <DropdownMenuSeparator className="mx-2" />
            
            <div className="p-2">
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer rounded-md px-3 py-2 text-sm transition-colors focus:bg-destructive/10 focus:text-destructive text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}