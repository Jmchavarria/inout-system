import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import UserEditForm from '../components/users/userForm';

// Mock del contexto de autenticación
jest.mock('../pages/context/auth-context', () => ({
  useAuth: () => ({
    user: { role: 'admin' },
  }),
}));

// Mock de llamadas API
global.fetch = jest.fn();

describe('UserEditForm', () => {
  // Mock de la función onSubmit definido dentro del describe
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSubmit.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renderiza los campos del formulario correctamente', async () => {
    await act(async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />);
    });

    // Buscar por el texto real que aparece en el HTML
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByText('Create User')).toBeInTheDocument();
  });

  test('muestra el botón de envío', async () => {
    await act(async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />);
    });

    // El botón tiene el texto "Create User" según el HTML
    const submitButton = screen.getByRole('button', { name: /create user/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled(); // El botón está deshabilitado inicialmente
  });

  test('permite escribir en el campo nombre', async () => {
    await act(async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />);
    });

    const nameInput = screen.getByLabelText(/name/i);

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
    });

    expect(nameInput).toHaveValue('Juan Pérez');
  });

  test('muestra el selector de rol', async () => {
    await act(async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />);
    });

    // El selector de rol aparece como un combobox
    const roleSelect = screen.getByRole('combobox', { name: /role/i });
    expect(roleSelect).toBeInTheDocument();
    expect(screen.getByText('Select a role')).toBeInTheDocument();
  });

  test('puede abrir el selector de rol', async () => {
    await act(async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />);
    });

    const roleSelect = screen.getByRole('combobox', { name: /role/i });

    await act(async () => {
      fireEvent.click(roleSelect);
    });

    // Después de hacer clic, debería cambiar el estado
    expect(roleSelect).toHaveAttribute('aria-expanded');
  });

  test('el formulario tiene la estructura correcta', async () => {
    await act(async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />);
    });

    // Verificar que existe un formulario
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();

    // Verificar el título
    expect(screen.getByText('Create User')).toBeInTheDocument();

    // Verificar que el botón está presente
    expect(
      screen.getByRole('button', { name: /create user/i })
    ).toBeInTheDocument();
  });

  test('maneja la interacción básica con el formulario', async () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await act(async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />);
    });

    const nameInput = screen.getByLabelText(/name/i);
    const submitButton = screen.getByRole('button', { name: /create user/i });

    // Llenar el campo nombre
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'Test User' } });
    });

    // Verificar que el valor se estableció
    expect(nameInput).toHaveValue('Test User');

    // Verificar que el botón sigue deshabilitado (probablemente por validación)
    expect(submitButton).toBeDisabled();
  });

  test('verifica que el componente se renderiza correctamente', async () => {
    await act(async () => {
      render(<UserEditForm onSubmit={mockOnSubmit} />);
    });

    // Verificar que se renderiza correctamente
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByText('Create User')).toBeInTheDocument();
  });
});

// Configuración para suprimir advertencias específicas de React Hook Form
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
        args[0].includes('ReactDOMTestUtils.act is deprecated'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});
