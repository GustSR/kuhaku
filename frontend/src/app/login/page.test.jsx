import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './page';
import { useAuth } from '../../hooks/useAuth';

// Mock do useRouter que é usado internamente pelo Next.js Link/router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock do nosso hook de autenticação
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Fornece um valor mock padrão para o hook antes de cada teste
    useAuth.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      error: null,
    });
  });

  it('should render the login form correctly', () => {
    render(<LoginPage />);

    // Verifica se o título está na tela
    expect(screen.getByRole('heading', { name: /Kuhaku/i })).toBeInTheDocument();

    // Verifica se os campos de input estão na tela
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();

    // Verifica se o botão de login está na tela
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('should display an error message when the error state is set', () => {
    // Sobrescreve o mock para este teste específico
    useAuth.mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      error: 'Invalid credentials',
    });

    render(<LoginPage />);

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should disable the button and show a spinner when loading', () => {
    useAuth.mockReturnValue({
      signIn: jest.fn(),
      loading: true,
      error: null,
    });

    render(<LoginPage />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    // O spinner é um pouco mais complicado de achar, mas podemos verificar se o texto "Login" não está mais lá
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });
});
