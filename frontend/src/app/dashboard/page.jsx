'use client';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome back, {user?.name || 'User'}!
      </p>
    </div>
  );
}
