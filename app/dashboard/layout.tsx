import React from 'react';
import { SearchProvider } from '@/lib/context/SearchContext';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SearchProvider>{children}</SearchProvider>;
}
