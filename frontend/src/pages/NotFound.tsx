import { Link } from 'react-router-dom';
import { AppBar } from '../components/AppBar';

export function NotFound() {
  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <AppBar title="Listyyy" showMenuButton={false} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 8 }}>🛒</div>
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: 'var(--color-primary)',
            margin: 0,
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <p
          style={{
            fontSize: 22,
            color: '#555',
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          אופס! הדף לא נמצא
        </p>
        <p style={{ fontSize: 15, color: '#888', marginBottom: 32, maxWidth: 360 }}>
          נראה שהקישור שחיפשת לא קיים, הועבר, או שמעולם לא היה כאן.
        </p>
        <Link
          to="/lists"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--color-primary)',
            color: '#fff',
            padding: '12px 32px',
            borderRadius: 12,
            fontSize: 17,
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(124,179,66,0.3)',
            transition: 'background 0.2s',
          }}
        >
          חזרה לרשימות ←
        </Link>
      </div>
    </div>
  );
}
