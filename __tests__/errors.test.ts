// CORREÇÃO C16: testes novos (não existem no guia) para as traduções de erro.
import { friendlyError } from '@/utils/errors';

describe('friendlyError', () => {
  it('traduz login e falta de internet', () => {
    expect(friendlyError(new Error('Invalid login credentials'))).toBe(
      'E-mail ou senha incorretos.',
    );
    expect(friendlyError(new TypeError('Network request failed'))).toBe(
      'Sem conexão com a internet.',
    );
  });

  it('aceita o PostgrestError, que não é Error, e lê o código', () => {
    expect(
      friendlyError({
        message: 'JSON object requested, multiple (or no) rows returned',
        code: 'PGRST116',
      }),
    ).toBe('Não encontrado. Ele pode ter sido removido.');
    expect(
      friendlyError({
        message: "Could not find the table 'public.stores'",
        code: 'PGRST205',
      }),
    ).toMatch(/schema\.sql/);
  });

  it('mantém as mensagens em português do create_order', () => {
    expect(
      friendlyError({ message: 'A loja está fechada no momento.', code: 'P0001' }),
    ).toBe('A loja está fechada no momento.');
  });

  it('não mostra "null" quando não há erro', () => {
    expect(friendlyError(null)).toBe('Não foi possível carregar os dados.');
  });
});
