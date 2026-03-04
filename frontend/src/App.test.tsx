import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Welcome } from './pages/Welcome';

/**
 * Smoke tests to catch regressions that prevent the app from rendering.
 *
 * - "Welcome page renders" runs without loading App/WebSocket code; if this fails,
 *   the test harness or Welcome is broken.
 * - Full "app loads in browser" is best covered by E2E (e.g. Playwright): open the app
 *   in a real browser and assert the first paint within a timeout. See docs/e2e.md.
 */
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('App smoke', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('Welcome page renders and shows Listyyy within 3s', async () => {
    render(
      <Wrapper>
        <Welcome />
      </Wrapper>
    );

    await waitFor(
      () => {
        expect(screen.getByText(/Listyyy/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  }, 5000);
});
