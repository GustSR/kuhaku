import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

export const metadata = {
  title: 'Kuhaku',
  description: 'SaaS Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
