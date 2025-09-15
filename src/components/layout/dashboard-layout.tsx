import React from 'react';
import { TenantSelector } from '@/components/tenant/tenant-selector';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={`border-b ${className}`}>
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-bold text-xl">
            POA&M Architect
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <TenantSelector />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={`border-r h-full ${className}`}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Main Navigation
          </h2>
          <div className="space-y-1">
            <Link href="/dashboard" className="block px-2 py-1 hover:bg-gray-100 rounded-md">
              Dashboard
            </Link>
            <Link href="/poam" className="block px-2 py-1 hover:bg-gray-100 rounded-md">
              POA&M Items
            </Link>
            <Link href="/systems" className="block px-2 py-1 hover:bg-gray-100 rounded-md">
              Systems
            </Link>
            <Link href="/frameworks" className="block px-2 py-1 hover:bg-gray-100 rounded-md">
              Frameworks
            </Link>
            <Link href="/evidence" className="block px-2 py-1 hover:bg-gray-100 rounded-md">
              Evidence Files
            </Link>
            <Link href="/reports" className="block px-2 py-1 hover:bg-gray-100 rounded-md">
              Reports
            </Link>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Settings
          </h2>
          <div className="space-y-1">
            <Link href="/settings" className="block px-2 py-1 hover:bg-gray-100 rounded-md">
              Tenant Settings
            </Link>
            <Link href="/users" className="block px-2 py-1 hover:bg-gray-100 rounded-md">
              Users
            </Link>
            <Link href="/audit-logs" className="block px-2 py-1 hover:bg-gray-100 rounded-md">
              Audit Logs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar className="w-64 hidden md:block" />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
