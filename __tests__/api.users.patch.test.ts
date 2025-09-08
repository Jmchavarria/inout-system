// __tests__/api.users.patch.test.ts

// Mock de requireRole: siempre devuelve admin
jest.mock('../lib/rbac', () => ({
  requireRole: jest.fn(async () => ({ userId: 'admin-1', role: 'admin' })),
}));

// Si la ruta anterior no funciona, prueba con:
// jest.mock("@/lib/rbac", () => ({
//   requireRole: jest.fn(async () => ({ userId: "admin-1", role: "admin" })),
// }));

describe('API Users PATCH', () => {
  // Tu test aquí
  it('should update user successfully', async () => {
    // Tu lógica de test
    expect(true).toBe(true); // placeholder
  });
});
