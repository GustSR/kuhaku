const nextJest = require('next/jest');

// Fornece o caminho para a sua aplicação Next.js para carregar as configurações de next.config.js e .env no ambiente de teste
const createJestConfig = nextJest({
  dir: './',
});

// Configuração customizada do Jest a ser exportada
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Lida com alias de módulo (se você os tiver configurado em tsconfig.json)
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
  },
  // Necessário para evitar um erro de transformação com o SWC
  transform: {
    '^.+\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
};

// createJestConfig é exportado desta forma para garantir que next/jest possa carregar a configuração do Next.js
module.exports = createJestConfig(customJestConfig);
