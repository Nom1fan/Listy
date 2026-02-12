import { Outlet } from 'react-router-dom';
import { AppBar } from './AppBar';

export function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Outlet />
    </div>
  );
}

export function LayoutWithBar({ title, backTo, right }: { title: string; backTo?: string; right?: React.ReactNode }) {
  return (
    <>
      <AppBar title={title} backTo={backTo} right={right} />
      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>
    </>
  );
}
