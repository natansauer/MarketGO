# Relatório de correções — Projeto MarketGo

24/11/2026 · Natan Forte Sauer

Foram encontradas e corrigidas 18 falhas ao construir o MarketGo (projeto 2 de 5) pelo guia do Prof. Bruno Assunção Dias (IESB). Os 46 testes do app e os 16 testes do banco passam; os testes do banco rodaram num Postgres 16 real com os privilégios padrão do Supabase. O fluxo de compra completo rodou no Android pelo Expo Go (SDK 58), do login ao pedido entregue.

## 1. Objetivo, método e prompt

**Disciplina:** Programação para Dispositivos Móveis — IESB. **Professor:** Prof. Me. Bruno Assunção Dias. **Ferramenta de IA:** Claude (Anthropic), modelo Claude Opus 5.5.

O código do guia (Etapas 1 a 15, 66 blocos de código) foi transcrito arquivo por arquivo e revisado com a IA. Cada problema recebeu um código (C01 a C18). No código, cada correção tem um comentário `// CORREÇÃO Cxx` (ou `-- CORREÇÃO Cxx` no SQL), que se acha com `grep -rn "CORREÇÃO" app src supabase`. C01, C02 e C05 ficam no package.json e no app.json, que não aceitam comentários.

Cada item traz: Problema (erro ou sintoma), Diagnóstico da IA (a resposta dada) e Solução implementada.

### Prompt utilizado

Enviado à IA junto com o PDF do guia (MarketGo-Guia-Passo-a-Passo.pdf), no mesmo projeto em que o RotaFit, o ChatRoom e o ScanIA foram feitos:

> Otimo vamos la! projeto marketGo meu nome é Natan Forte Sauer, a versao do expo é 58, project url do supa eh https://lckricwkvfukvoqvyyvt.supabase.co, e a publishable key é sb_publishable_... — mesma coisa do anterior faça os bats

### Resposta da IA (resumo)

A IA montou o projeto completo a partir do guia, no mesmo formato dos anteriores. Fixou o Expo SDK 58, porque o Expo Go do celular é o do SDK 58 e o guia usa o 57. Deixou o `.env` com a URL e a publishable key (o `.env` não vai para o GitHub) e criou seis scripts .bat: configurar o Supabase, instalar, iniciar, túnel, testes e web. Também pôs os comentários de correção no código e escreveu este relatório.

Revisou cada arquivo procurando erros de compilação, de segurança do banco, de regra de negócio e de interface. Corrigiu os que achou e rodou os testes que o ambiente permitia. Os testes do banco rodaram num Postgres de verdade, não só por leitura do código.

## 2. Configuração e plataforma

O guia foi conferido no Expo SDK 57. Só que o Expo Go do SDK 58 abre apenas projetos do SDK 58, então o projeto foi fixado nessa versão.

| Código | Problema | Diagnóstico da IA | Solução implementada |
| --- | --- | --- | --- |
| C01 | Projeto do guia no SDK 57 (React Native 0.86) e Expo Go do celular no SDK 58: "Project is incompatible with this version of Expo Go" | O SDK 58 (out/2026) usa React Native 0.88 e React 19.3, e o Expo Go novo só aceita o 58. Ele exige Node 22.13+ ou 24.3+ (versões ímpares não) | package.json fixado no SDK 58 (expo ~58.0.23, react-native 0.88.1, react 19.3.0, expo-router ~58.0.30, jest-expo ~58, Jest 30). O 1-instalar.bat confere o Node e roda `npx expo install --fix` para alinhar o resto |
| C02 | O app.json aponta para android-icon-foreground/background/monochrome.png, e o projeto não tinha a pasta assets | Sem esses arquivos, o empacotamento para Android falha por arquivo inexistente | Ícones gerados (cesta branca sobre laranja #EA580C) com os nomes esperados. Identificadores trocados de com.seuusuario para com.natansauer.marketgo |
| C05 | No SDK 58, `expo start --web` passou a renderizar no servidor quando `web.output` não está definido | No servidor não existe `window`: o AsyncStorage do Supabase quebraria a página do 5-iniciar-web.bat | `"web": { "output": "single" }` no app.json |

## 3. Banco de dados (Supabase)

A falha mais séria estava nos privilégios: com as regras padrão do Supabase, 3 dos 13 testes do próprio guia falham. Com o schema.sql original, 12 de 16 testes passam; com o corrigido, passam os 16.

| Código | Problema | Diagnóstico da IA | Solução implementada |
| --- | --- | --- | --- |
| C03 | No Supabase, toda tabela e função nova do schema public já nasce com ALL/EXECUTE para anon e authenticated. Os `grant` do guia só acrescentam, e o `revoke ... from public` não tira o EXECUTE de anon | Mesmo defeito do ChatRoom (C13) e do RotaFit (C10). Com esses privilégios, o visitante executa `advance_order`, o insert direto só para no RLS e anon roda `delete from products` sem ser recusado. O PGlite puro não mostrava nada disso | `revoke all ... from anon, authenticated` nas quatro tabelas, devolvendo só o `select` para authenticated, e revoke do EXECUTE das três funções para anon. Os stubs do teste recriam os privilégios padrão do Supabase; teste novo confere que anon não lê nem escreve |
| C04 | Com `p_items` nulo, o erro aparecia cru ("null value in column subtotal"). Com id que não é uuid ou quantidade 1,5 / "2", aparecia o erro de conversão do Postgres | `jsonb_typeof(null) <> 'array'` dá NULL, e o `if` com NULL é ignorado; o `jsonb_to_recordset` converte os tipos antes da validação | Checagem de `p_items is null` e validação de cada item antes da conversão. Agora tudo cai em "O carrinho está vazio." ou "Há itens inválidos no carrinho". Teste novo com os quatro casos |
| C17 | O Apêndice B manda rodar `notify pgrst, 'reload schema';` à mão quando aparece "Could not find the function ... in the schema cache" | A API do Supabase guarda em cache a lista de funções | O schema.sql já termina com o `notify` |
| C18 | Rodar o seed.sql duas vezes duplicava as 6 lojas e os 50 produtos | Os inserts do guia não conferem se os dados já existem | Cada insert do seed só roda com a tabela vazia (`where not exists`). Teste novo roda o seed de novo e confere 6 e 50 |

O restante do banco foi mantido como no guia: RLS, total calculado no servidor, snapshot de preço, pedido mínimo, troco, `for update` e `search_path` fixo. O arquivo novo `supabase/setup-completo.sql` junta schema e seed para colar de uma vez.

## 4. Sessão, mensagens e erros

| Código | Problema | Diagnóstico da IA | Solução implementada |
| --- | --- | --- | --- |
| C06 | O app podia ficar preso para sempre no indicador de carregamento | `getSession()` não tinha catch (mesmo defeito do C31 do RotaFit e do C12 do ChatRoom) | `.catch` e `.finally` no AuthContext |
| C07 | No navegador, sair da conta, esvaziar o carrinho, "Trocar de loja?", cancelar o pedido e as mensagens de erro não faziam nada | O `Alert.alert` não existe no react-native-web | Novo `src/utils/confirm.ts`: Alert no celular, confirm/alert do navegador no web |
| C16 | Erros do PostgREST apareciam crus, em inglês, e a tela de erro podia mostrar "null" | O `friendlyError` do guia só conhecia login, rede e excesso de tentativas | Traduções para PGRST116, PGRST205/42P01, PGRST202, 42501 e sessão expirada; 4 testes novos em `__tests__/errors.test.ts` |

## 5. Telas: catálogo, carrinho, checkout e pedidos

| Código | Problema | Diagnóstico da IA | Solução implementada |
| --- | --- | --- | --- |
| C08 | Uma falha de rede numa das consultas automáticas (a cada 5 s) trocava o pedido inteiro pela tela de erro | No TanStack Query, `isError` fica true mesmo com dados já carregados | Tela de erro só sem pedido carregado |
| C09 | A tela do produto podia mostrar "Algo deu errado — null" por um instante | Entre carregar o produto e buscar a loja, não havia dados nem erro | Sem dados e sem erro, mostra o carregando |
| C10 | Cenário 5: na Sushi Sakura (fechada), tocar no "+" não fazia nada, mas o roteiro espera o aviso | O botão tinha `disabled`, e o toque nunca chegava ao `useAddToCart` | O botão continua cinza, mas recebe o toque e mostra o aviso |
| C11 | "Pedir novamente" substituía sem perguntar um carrinho de outra loja e montava carrinho de loja fechada | Quebra a regra "uma loja por vez, com confirmação" do guia | Loja fechada mostra aviso; carrinho com itens pergunta "Substituir o carrinho?" |
| C12 | No checkout, o endereço preenchido automaticamente podia apagar o que o usuário já tinha digitado | O `reset()` não conferia se o formulário já tinha sido mexido | Só preenche com o formulário intocado (`isDirty`) |
| C13 | Carrinho salvo com preço antigo mostrava um total diferente do cobrado (cenário 13) | O banco usa o preço atual, mas o app nunca atualizava o carrinho salvo | Função pura `syncCart`: a aba Carrinho atualiza preços, taxa e mínimo, tira itens indisponíveis e bloqueia loja fechada; 5 testes novos |
| C14 | No Android, o teclado cobria o fim do checkout | Desde o SDK 54 o Android é edge-to-edge; o guia usava `behavior` undefined | `behavior="padding"` nas duas plataformas |
| C15 | A barra "Ver carrinho" ficava sobre a barra de gestos | `bottom: 16` fixo, sem área segura | Soma `insets.bottom` |

## 6. Verificação

| Verificação | Resultado |
| --- | --- |
| 46 testes do app (37 do guia + 5 do `syncCart` + 4 de erros) | 46/46 passando |
| 16 testes do banco (13 do guia + 3 novos), num Postgres 16 com os privilégios padrão do Supabase | 16/16 passando |
| Os mesmos 16 testes com o schema.sql original do guia | 12/16 (confirma C03 e C04) |
| Tipagem estrita de utils, schemas, types, constants e testes | Sem erros |
| `supabase/setup-completo.sql` num banco vazio | 6 lojas, 50 produtos, emojis certos |
| App no Android (Expo Go, SDK 58) | Fluxo de compra completo passou (abaixo) |

## 7. Teste no celular (24/11/2026, 21:01–21:04)

As capturas estão em [`docs/screenshots/`](screenshots/).

| Cenário (Etapa 14.3) | Resultado | Captura |
| --- | --- | --- |
| Login e cadastro | Telas com os campos e a validação do guia | 01-login.png, 02-cadastro.png |
| 2 — Cadastro válido | Passou: "Olá, Natan 👋" e "Natan Forte Sauer" no Perfil | 03-lojas.png, 05-perfil.png |
| Lista de lojas | Passou: abertas primeiro e por avaliação, Sushi Sakura com "Fechada agora" | 03-lojas.png, 04-lojas-fechada.png |
| Cardápio por seção | Passou: Pizzaria e Mercado com entrega e pedido mínimo | 06 a 08 |
| 5 — Loja fechada | Faixa de loja fechada e botões "+" cinza | 09-loja-fechada-sushi.png |
| 6 — Adicionar itens | Passou: 4 itens, R$ 118,00 + R$ 7,90 = R$ 125,90 | 10-carrinho.png |
| 12 — Confirmar pedido | Passou: acompanhamento com R$ 125,90 calculados pelo banco | 11 a 13 |
| 14 — Simular até "Entregue" | Passou: linha do tempo completa e "Pedir novamente" | 14, 15 |
| Histórico | Passou: Pizzaria Forno a Lenha, Entregue, R$ 125,90 | 16-historico.png |

O total do app e o do `create_order` bateram: R$ 125,90 nos dois.

## 8. Como rodar (Windows)

1. `0-configurar-supabase.bat` (uma vez): copia o SQL e abre o SQL Editor; depois desligar "Confirm email".
2. `1-instalar.bat`: confere o Node, instala e alinha com o SDK 58. Criar o `.env` a partir do `.env.example`.
3. `2-iniciar.bat` (ou `3-iniciar-tunel.bat`) e abrir no Expo Go do SDK 58.
4. `4-testes.bat`: tipos, 46 testes do app e 16 do banco.
5. `5-iniciar-web.bat`: versão web, para uma segunda conta.
