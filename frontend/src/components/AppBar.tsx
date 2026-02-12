import { Link } from 'react-router-dom';

interface AppBarProps {
  title: string;
  backTo?: string;
  right?: React.ReactNode;
}

export function AppBar({ title, backTo, right }: AppBarProps) {
  return (
    <header
      style={{
        background: 'var(--color-bar)',
        color: '#1a1a1a',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {backTo && (
          <Link to={backTo} style={{ fontSize: 24, lineHeight: 1 }} aria-label="חזרה">
            ←
          </Link>
        )}
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{title}</h1>
      </div>
      {right && <div>{right}</div>}
    </header>
  );
}
