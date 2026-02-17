import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const WELCOME_KEY = 'listyyy_welcome_seen';

const slides = [
  {
    icon: null,
    title: 'Listyyy',
    subtitle: 'כל הרשימות שלכם במקום אחד',
    description: 'קניות, סדרות וסרטים לצפייה, ספרים לקרוא, מטלות — כל רשימה שתרצו, בקלות ובמהירות',
    useLogo: true,
  },
  {
    icon: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="28" cy="30" r="12" stroke="var(--color-primary)" strokeWidth="3" fill="none" />
        <circle cx="52" cy="30" r="12" stroke="var(--color-primary)" strokeWidth="3" fill="none" />
        <path
          d="M16 58c0-8 8-14 18-14h12c10 0 18 6 18 14"
          stroke="var(--color-primary)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M54 50c6-2 12 1 14 8"
          stroke="var(--color-primary)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    ),
    title: 'שתפו עם מי שחשוב',
    subtitle: '',
    description: 'שתפו רשימות עם המשפחה, השותפים או החברים — כולם רואים עדכונים בזמן אמת',
    useLogo: false,
  },
  {
    icon: (
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        <rect
          x="16"
          y="12"
          width="48"
          height="56"
          rx="8"
          stroke="var(--color-primary)"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M28 34l6 6 12-12"
          stroke="var(--color-primary)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <line
          x1="28"
          y1="52"
          x2="52"
          y2="52"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <line
          x1="28"
          y1="58"
          x2="44"
          y2="58"
          stroke="var(--color-primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
    ),
    title: 'בואו נתחיל!',
    subtitle: '',
    description: 'צרו את הרשימה הראשונה שלכם בכמה שניות',
    useLogo: false,
    isCta: true,
  },
] as const;

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(160deg, #f8faf5 0%, #eef5e6 50%, #f5f5f5 100%)',
  zIndex: 9999,
};

const scrollerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  WebkitOverflowScrolling: 'touch',
  scrollbarWidth: 'none',
};

const slideStyle: React.CSSProperties = {
  minWidth: '100vw',
  scrollSnapAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 32px',
  textAlign: 'center',
};

const dotsContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 10,
  padding: '16px 0 8px',
};

const bottomBarStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
  gap: 4,
};

export function Welcome() {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const markSeenAndGo = useCallback(() => {
    localStorage.setItem(WELCOME_KEY, '1');
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observers: IntersectionObserver[] = [];
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIndex(i);
        },
        { root: scroller, threshold: 0.6 },
      );
      observer.observe(slide);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const goToSlide = (i: number) => {
    slideRefs.current[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  };

  return (
    <div style={containerStyle}>
      {/* Hide scrollbar */}
      <style>{`
        .welcome-scroller::-webkit-scrollbar { display: none; }
      `}</style>

      <div ref={scrollerRef} className="welcome-scroller" style={scrollerStyle}>
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            style={slideStyle}
          >
            <div
              style={{
                animation: 'welcomeFadeInUp 0.6s ease-out both',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                maxWidth: 340,
              }}
            >
              {slide.useLogo ? (
                <img
                  src="/logo.png?v=3"
                  alt="Listyyy"
                  style={{
                    height: 100,
                    objectFit: 'contain',
                    marginBottom: 8,
                    filter: 'drop-shadow(0 4px 12px rgba(124,179,66,0.25))',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'rgba(124,179,66,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  {slide.icon}
                </div>
              )}

              <h1
                style={{
                  margin: 0,
                  fontSize: slide.useLogo ? 32 : 26,
                  fontWeight: 800,
                  color: '#1a1a1a',
                  lineHeight: 1.2,
                }}
              >
                {slide.title}
              </h1>

              {slide.subtitle && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--color-primary-dark)',
                  }}
                >
                  {slide.subtitle}
                </p>
              )}

              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  color: '#666',
                  lineHeight: 1.7,
                }}
              >
                {slide.description}
              </p>

              {slide.isCta && (
                <button
                  onClick={markSeenAndGo}
                  style={{
                    marginTop: 16,
                    padding: '14px 48px',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 17,
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(124,179,66,0.35)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                >
                  להתחברות
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={bottomBarStyle}>
        <div style={dotsContainerStyle}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              aria-label={`שקופית ${i + 1}`}
              style={{
                width: activeIndex === i ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: activeIndex === i ? 'var(--color-primary)' : '#ccc',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <button
          onClick={markSeenAndGo}
          style={{
            background: 'transparent',
            color: '#999',
            fontSize: 14,
            fontWeight: 500,
            padding: '8px 16px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          דלג
        </button>
      </div>
    </div>
  );
}
