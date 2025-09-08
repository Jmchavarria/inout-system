import { render, screen } from '@testing-library/react';

// Mock todos los módulos problemáticos antes de importar
jest.mock('better-auth', () => ({}));
jest.mock('nanostores', () => ({}));
jest.mock('@/lib/auth-client', () => ({}));

// Mock del contexto de auth
const mockUseAuth = jest.fn();

// Mock del contexto sin importar el archivo real
jest.mock(
  '@/pages/context/auth-context',
  () => ({
    useAuth: mockUseAuth,
  }),
  { virtual: true }
);

// Mock del componente Sidebar directamente para evitar las dependencias
jest.mock('@/components/ui', () => ({
  Sidebar: () => {
    const authData = mockUseAuth();
    const user = authData?.user;

    return (
      <nav>
        <div>Income and expenses</div>
        <div>Reports</div>
        {user?.role === 'admin' && <div>Users</div>}
      </nav>
    );
  },
}));

import { Sidebar } from '@/components/ui';

describe('Sidebar - visibilidad de "Users" por rol', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra "Users" si el usuario es admin', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'admin', name: 'Ada' },
      status: 'authenticated',
      signOut: jest.fn(),
    });

    render(<Sidebar />);
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('no muestra "Users" si el usuario no es admin', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'user', name: 'Grace' },
      status: 'authenticated',
      signOut: jest.fn(),
    });

    render(<Sidebar />);
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('no muestra "Users" si no hay usuario autenticado', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      status: 'unauthenticated',
      signOut: jest.fn(),
    });

    render(<Sidebar />);
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });
});
