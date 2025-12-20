// src/app/page.tsx
import { Suspense } from 'react';
import LoginPage from '@/app/login/LoginPage';
import LoginSkeleton from '@/app/login/LoginSkeleton';

export default function Home() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginPage />
    </Suspense>
  );
}