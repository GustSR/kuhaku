import { LayoutDashboard } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 p-4 text-white bg-gray-800">
      <h1 className="mb-8 text-2xl font-bold">Kuhaku</h1>
      <nav>
        <ul>
          <li>
            <a
              href="/dashboard"
              className="flex items-center gap-2 p-2 rounded-md bg-gray-700"
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
