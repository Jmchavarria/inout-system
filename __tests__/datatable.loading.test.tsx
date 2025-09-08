import { render, screen } from '@testing-library/react';
import { DataTable } from '../components/dataTable';
import { ColumnDef } from '@tanstack/react-table';

// Definir un tipo simple para los datos de prueba
type TestData = {
  id: string;
  name: string;
};

// Configurar columnas de prueba
const testColumns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
];

const testData: TestData[] = [
  { id: '1', name: 'Test Item 1' },
  { id: '2', name: 'Test Item 2' },
];

describe('DataTable - loading', () => {
  it("muestra 'Cargando...' cuando isLoading = true", () => {
    render(
      <DataTable columns={testColumns} data={testData} isLoading={true} />
    );
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });

  it("no muestra 'Cargando...' cuando isLoading = false", () => {
    render(
      <DataTable columns={testColumns} data={testData} isLoading={false} />
    );
    expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument();
  });

  it('muestra los datos cuando no está cargando', () => {
    render(
      <DataTable columns={testColumns} data={testData} isLoading={false} />
    );
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
  });
});
