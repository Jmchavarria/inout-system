// jest.setup.js
import '@testing-library/jest-dom';

// Mock de better-auth antes de que Jest trate de procesarlo
jest.mock('better-auth', () => ({
  createAuthClient: jest.fn(() => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));

// Mock de nanostores
jest.mock('nanostores', () => ({
  atom: jest.fn(),
  map: jest.fn(),
}));

// Mock del auth-client
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));
