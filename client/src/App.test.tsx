import { render, screen, waitFor } from '@testing-library/react';
import App from '@/App';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({ status: 'ok' }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the game title', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /browser game/i })).toBeInTheDocument();
  });

  it('shows checking state before fetch resolves', () => {
    render(<App />);
    expect(screen.getByText(/checking\.\.\./i)).toBeInTheDocument();
  });

  it('displays health status after fetch resolves', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/ok/i)).toBeInTheDocument());
  });
});
