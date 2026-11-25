// Traduz mensagens comuns do Supabase e da rede para português.
export function friendlyError(error: unknown): string {
  // CORREÇÃO C16: sem erro nenhum (consulta ainda não feita), a tela mostrava "null".
  if (error === null || error === undefined) return 'Não foi possível carregar os dados.';

  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (message.includes('User already registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }
  if (/network request failed|failed to fetch|load failed/i.test(message)) {
    return 'Sem conexão com a internet.';
  }
  if (/rate limit/i.test(message)) {
    return 'Muitas tentativas. Aguarde um instante e tente de novo.';
  }
  // CORREÇÃO C16: mensagens cruas do PostgREST que o guia deixava passar em inglês.
  if (code === 'PGRST116' || /JSON object requested|contains 0 rows/i.test(message)) {
    return 'Não encontrado. Ele pode ter sido removido.';
  }
  if (
    code === 'PGRST205' ||
    code === '42P01' ||
    /Could not find the table/i.test(message)
  ) {
    return 'As tabelas não existem no banco. Rode o supabase/schema.sql no SQL Editor.';
  }
  if (code === 'PGRST202' || /Could not find the function/i.test(message)) {
    return "Função não encontrada no banco. Rode o schema.sql e depois: notify pgrst, 'reload schema';";
  }
  if (code === '42501' || /permission denied/i.test(message)) {
    return 'Sem permissão para esta ação. Confira se o schema.sql foi executado por inteiro.';
  }
  if (/JWT expired|invalid JWT|refresh token/i.test(message)) {
    return 'Sua sessão expirou. Saia e entre de novo.';
  }
  return message;
}
