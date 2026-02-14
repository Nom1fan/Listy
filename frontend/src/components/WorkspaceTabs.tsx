const tabs = [
  { key: 'lists', label: 'רשימות' },
  { key: 'categories', label: 'קטגוריות' },
] as const;

export type TabKey = (typeof tabs)[number]['key'];

interface WorkspaceTabsProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

export function WorkspaceTabs({ activeTab, onChange }: WorkspaceTabsProps) {
  return (
    <nav style={{ display: 'flex', gap: 0 }}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px 0 8px',
              fontSize: 15,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-primary, #6C63FF)' : '#888',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive
                ? '2.5px solid var(--color-primary, #6C63FF)'
                : '2.5px solid transparent',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
