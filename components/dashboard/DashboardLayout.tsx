'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export default function DashboardLayout({ children, activeTab: initialActiveTab }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'dashboard');

  return (
    <div className="dashboard-container">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="dashboard-main-content">
        <DashboardHeader
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="dashboard-body">{children}</main>
      </div>
    </div>
  );
}
