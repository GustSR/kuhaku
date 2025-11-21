'use client';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Header() {
  const { signOut, user } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <div />
      <div className="flex items-center gap-4">
        <span>{user?.email}</span>
        <button
          onClick={signOut}
          className="text-gray-500 hover:text-red-600"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
