export default {
  testEnvironment: 'node',
  // Necessário para o Jest entender import/export
  transform: {},
  // Ajuda o Jest a resolver os imports de módulos ES corretamente
  moduleNameMapper: {
    '^(\.{1,2}/.*)\.js$': '$1',
  },
};
