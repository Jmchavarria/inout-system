import { render, screen, fireEvent } from '@testing-library/react';
import NewTransactionForm from '../components/income/newTransactionForm';

describe('NewTransactionForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<NewTransactionForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/concept/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });

  it('allows typing in concept field', () => {
    render(<NewTransactionForm onSubmit={mockOnSubmit} />);

    const conceptInput = screen.getByLabelText(/concept/i);
    fireEvent.change(conceptInput, { target: { value: 'Test transaction' } });

    expect(conceptInput).toHaveValue('Test transaction');
  });

  it('shows loading state', () => {
    render(<NewTransactionForm onSubmit={mockOnSubmit} isLoading={true} />);

    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });
});
