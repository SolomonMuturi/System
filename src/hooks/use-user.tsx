'use client';

import { createContext, useState, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react'; // ADD THIS IMPORT
import type { Employee } from '@/lib/data';
import { employeeData } from '@/lib/data';

interface UserContextType {
  user: Employee | null;
  setUser: (user: Employee | null) => void;
  logout: () => Promise<void>; // Changed to async
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(employeeData[0]);
  const router = useRouter();

  // Updated logout function with NextAuth integration
  const logout = async () => {
    try {
      console.log('Starting logout process...');
      
      // 1. Clear local user state
      setUser(null);
      console.log('Local user state cleared');
      
      // 2. Sign out from NextAuth session
      await signOut({ 
        redirect: false, // We handle redirect manually
        callbackUrl: '/' // Where to redirect after signout
      });
      console.log('NextAuth session cleared');
      
      // 3. Redirect to login page (which is now your root page)
      router.push('/');
      console.log('Redirecting to login page');
      
      // 4. Force refresh to clear any cached state
      router.refresh();
      console.log('Page refreshed');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if signOut fails, still redirect
      setUser(null);
      router.push('/');
      router.refresh();
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}