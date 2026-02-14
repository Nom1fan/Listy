import { Link } from 'react-router-dom';
import { useSideMenuStore } from '../store/sideMenuStore';

interface AppBarProps {
  title: React.ReactNode;
  /** Rendered to the right of the title (e.g. list icon) */
  titleRight?: React.ReactNode;
  backTo?: string;
  right?: React.ReactNode;
  /** Show the right-side accordion menu trigger (default true when right is not provided) */
  showMenuButton?: boolean;
}

export function AppBar({ title, titleRight, backTo, right, showMenuButton = true }: AppBarProps) {
  const toggleMenu = useSideMenuStore((s) => s.toggle);

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
        {showMenuButton && (
          <button
            type="button"
            onClick={toggleMenu}
            style={{ padding: 8, background: 'transparent', fontSize: 20, lineHeight: 1 }}
            aria-label="פתח תפריט"
          >
            ☰
          </button>
        )}
        {backTo && (
          <Link to={backTo} style={{ fontSize: 24, lineHeight: 1 }} aria-label="חזרה">
            →
          </Link>
        )}
        {typeof title === 'string' ? (
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{title}</h1>
        ) : (
          title
        )}
        {titleRight}
      </div>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{right}</div>}
    </header>
  );
}
