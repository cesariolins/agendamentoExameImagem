# AGENTS.md

Guia do projeto para agentes de IA (Claude Code, Codex, Cursor…) e para quem chega ao código pela primeira vez.
O `README.md` é a documentação de entrega (como rodar, decisões e premissas); este arquivo é o **contrato de desenvolvimento**: como o sistema está organizado, quais regras não podem ser quebradas e como trabalhar nele.

## Visão geral

Aplicação full stack para **agendamento de exames de imagem**. O paciente busca um exame, escolhe um médico, vê os horários livres de uma data e agenda.

- `backend/`: API REST em **NestJS 12** (TypeScript, ESM) com **Prisma 7 + SQLite**.
- `frontend/`: SPA em **React 19 + Vite 8 + Tailwind CSS 4**, com **TanStack Query** para o estado vindo do servidor.
- `dados/`: arquivos originais do desafio (`exames.csv`, `medicos.md`). São a fonte da carga inicial (seed) e **não devem ser editados**.

## Comandos

Todos rodam na **raiz** do monorepo (npm workspaces). Requisito: Node **≥ 22.12** (veja `.nvmrc`).

| Comando                              | O que faz                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `npm install`                        | Instala as duas pontas e gera o Prisma Client (`postinstall`)                  |
| `npm run db:setup`                   | Aplica as migrations e popula o banco (`backend/dev.db`)                       |
| `npm run db:reset`                   | Recria o banco do zero e popula de novo                                        |
| `npm run dev`                        | Sobe a API em `http://localhost:3000/api` e o front em `http://localhost:5173` |
| `npm test`                           | Testes das duas pontas (no backend, unitários + e2e)                           |
| `npm run lint` / `npm run typecheck` | oxlint e `tsc` nas duas pontas                                                 |
| `npm run build`                      | Build de produção das duas pontas                                              |
| `npm run format` / `format:check`    | Prettier no repositório inteiro (o CI roda o `format:check`)                   |

Para rodar só uma ponta: `npm run <script> -w backend` ou `-w frontend`. Exemplo: `npm run test:unit -w backend`.
Documentação interativa da API (Swagger): `http://localhost:3000/api/docs`.

## Estrutura

```
├─ AGENTS.md / CLAUDE.md      # este guia (o CLAUDE.md só importa o AGENTS.md)
├─ README.md                  # entrega: como rodar, decisões, premissas, exemplos curl
├─ dados/                     # insumos originais do desafio (somente leitura)
├─ .github/workflows/ci.yml   # lint, typecheck, testes e build a cada push
├─ backend/
│  ├─ prisma/                 # schema.prisma, migrations (inclui o trigger), seed
│  ├─ src/
│  │  ├─ agenda/              # DOMÍNIO PURO: regras de horário e fuso. Zero imports de Nest/Prisma
│  │  ├─ comum/               # catálogo de erros, filtro global de exceções, utilitários de texto
│  │  ├─ prisma/              # PrismaService, adapter do SQLite e tradução de erros do banco
│  │  ├─ exames/              # GET /exames
│  │  ├─ medicos/             # GET /medicos e GET /medicos/:id/horarios
│  │  └─ agendamentos/        # POST/GET /agendamentos e cancelamento
│  └─ test/                   # testes e2e (supertest + SQLite real), incluindo concorrência
└─ frontend/
   └─ src/
      ├─ api/                 # cliente HTTP tipado, tipos da API e hooks do TanStack Query
      ├─ agendar/             # fluxo de agendamento em etapas
      ├─ agendamentos/        # lista e cancelamento
      └─ comum/               # datas no fuso da clínica, debounce, estados (carregando/erro/vazio)
```

## Regras de negócio (invariantes)

Estas regras são o núcleo avaliado. **Toda mudança que as toque precisa vir com teste.**

1. **Duração dinâmica.** Um agendamento ocupa exatamente `duracao_minutos` do exame (20, 30 ou 40). O término é **derivado** (`inicio + duração`) e congelado no momento do agendamento.
2. **Geração de horários.** Para cada turno do médico no dia da semana, a grade começa no início do turno e anda em passos iguais à duração do exame. Um horário é válido se o bloco `[início, início + duração)` couber **inteiro** em um único turno.
3. **Sem sobreposição.** Um médico não pode ter dois agendamentos **ativos** cujos intervalos se cruzem. Os intervalos são **semiabertos**: 08:00–08:40 e 08:40–09:20 coexistem.
4. **Dentro do expediente.** Não se agenda fora dos dias e turnos do médico.
5. **Sem passado.** O início precisa ser estritamente posterior ao instante atual.
6. **Dados mínimos.** `pacienteNome`, `exameId`, `medicoId` e `inicio`.

Premissas adotadas (detalhadas no README):

- Fuso único da clínica: `America/Sao_Paulo`. As datas são interpretadas e exibidas nesse fuso, independentemente do fuso do navegador.
- **Grade rígida:** a API só aceita um `inicio` que pertença à grade gerada. 08:10 num exame de 40 min é recusado mesmo que esteja livre.
- A grade é ancorada no início do turno mesmo quando há agendamentos desalinhados de outras durações.
- Cancelamento é lógico (`status = CANCELADO`) e libera o horário.
- Todos os médicos realizam todos os exames. Não há feriados, salas nem autenticação.

## Arquitetura do backend

### Domínio puro (`src/agenda/`)

- `regras.ts` trabalha em **minutos desde a meia-noite** no horário local da clínica. Expõe `motivoDeRecusa(contexto, inicio)`, que devolve o motivo ou `null`, e `gerarHorarios(contexto)`, que é a grade filtrada pelos horários com `motivoDeRecusa === null`.
- A ordem de verificação é: passado → fora do expediente → fora da grade → conflito.
- **Fonte única de verdade:** o `POST /agendamentos` valida o horário pedido com a mesma `motivoDeRecusa` usada para listar os horários livres. O que a tela oferece e o que a API aceita nunca divergem; um teste percorre os 1440 minutos do dia para provar isso.
- `fuso.ts` converte instante ↔ (data local, minutos) com `Intl` (sem dependências). O offset é obtido do banco de fusos, não fixado no código.

### Persistência e concorrência

- Prisma 7 com o driver adapter `better-sqlite3`, configurado em um único lugar (`src/prisma/adapter.ts`). As datas são gravadas como **inteiro epoch-ms (UTC)** (`timestampFormat: "unixepoch-ms"`).
- **A anti-sobreposição é garantida pelo banco**, não só pelo código. Triggers `BEFORE INSERT` e `BEFORE UPDATE` em `Agendamento` dão `RAISE(ABORT, 'CONFLITO_DE_HORARIO')` quando existe um agendamento ativo do mesmo médico com intervalo cruzado. Como o SQLite serializa as escritas e o trigger roda dentro do próprio INSERT, checar e gravar é atômico.
- Fluxo de um `POST /agendamentos`: valida o DTO → carrega o exame, o médico, os turnos e os agendamentos do dia → `motivoDeRecusa` (mensagem amigável) → `create`. Se outro pedido gravou no meio do caminho, o trigger aborta e o erro vira **409**.
- O erro do trigger chega pelo Prisma como `P2003`, o mesmo código de violação de FK. Use **somente** `ehConflitoDeHorario()` (`src/prisma/erros-do-banco.ts`) para identificá-lo; nunca mapeie `P2003` direto para 409.
- Não envolva checagem e inserção em `$transaction` interativo: não acrescenta garantia e, com vários processos, troca o 409 por `SQLITE_BUSY`.

### API

Prefixo global `/api`. Respostas de data/hora em ISO 8601 com offset (`2026-11-03T08:40:00-03:00`); o `inicio` enviado **precisa** ter offset.

| Método e rota                                        | Descrição                                                                    |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `GET /exames?busca=`                                 | Busca por nome sem diferenciar maiúsculas nem acentos (`torax` acha "Tórax") |
| `GET /medicos`                                       | Médicos com os turnos semanais (`diaSemana` 0 = domingo … 6 = sábado)        |
| `GET /medicos/:id/horarios?data=YYYY-MM-DD&exameId=` | Horários livres do médico na data, para a duração daquele exame              |
| `POST /agendamentos`                                 | Cria o agendamento `{ pacienteNome, exameId, medicoId, inicio }`             |
| `GET /agendamentos?medicoId=&data=&status=`          | Lista agendamentos ordenados por início                                      |
| `PATCH /agendamentos/:id/cancelar`                   | Cancelamento lógico (idempotente)                                            |

### Erros

Formato único, produzido pelo filtro global: `{ statusCode, codigo, mensagem, detalhes? }`, com mensagens em pt-BR. Exceções de domínio usam `ErroDeNegocio(codigo)` e o catálogo em `src/comum/erros.ts`; nenhum service lança `HttpException` solta.

| HTTP | Códigos                                                                                        |
| ---- | ---------------------------------------------------------------------------------------------- |
| 400  | `DADOS_INVALIDOS` (com `detalhes` por campo)                                                   |
| 404  | `EXAME_NAO_ENCONTRADO`, `MEDICO_NAO_ENCONTRADO`, `AGENDAMENTO_NAO_ENCONTRADO`                  |
| 409  | `CONFLITO_DE_HORARIO`                                                                          |
| 422  | `HORARIO_NO_PASSADO`, `FORA_DO_EXPEDIENTE`, `HORARIO_FORA_DA_GRADE`, `AGENDAMENTO_JA_INICIADO` |

## Arquitetura do frontend

- **Fluxo em etapas numa página só:** exame → médico → data → horário → nome do paciente → confirmação. Cada escolha feita vira um resumo com "alterar"; mudar uma etapa limpa as seguintes.
- **Estado do servidor no TanStack Query** (cache, carregando, erro). O estado local da tela fica em `useState`. Não há Redux nem router: as duas abas ("Agendar" e "Agendamentos") são estado local.
- **Cliente HTTP** em `src/api/cliente.ts` usa `fetch` e converte respostas de erro em `ErroApi { status, codigo, mensagem }`. Os componentes decidem a mensagem pelo `codigo`, nunca pelo texto.
- **Conflito (409) ou horário que passou (422):** avisar, invalidar a consulta de horários e limpar o horário escolhido, mantendo o nome digitado.
- Toda etapa trata os estados de **carregando, erro e vazio**, com mensagens específicas (ex.: "Dr. Thiago não atende às segundas").
- O Vite faz proxy de `/api` para `http://localhost:3000`; o front não precisa de CORS nem de variável de ambiente.
- Os tipos da API ficam duplicados em `src/api/tipos.ts` de propósito: um pacote compartilhado custaria mais (build, project references) do que meia dúzia de tipos.

### Design

Inspirado no design system _Digital Architect_ (aura.build): claro, editorial e com bordas finas. Use os tokens abaixo e não invente novos sem necessidade.

| Elemento            | Classes Tailwind                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Fundo da página     | `bg-[#EAEAE5] text-stone-900` (texto base `#1C1C1C`)                                                                   |
| Superfícies         | `bg-white` (realce/hover), `bg-stone-100/50` (cabeçalho de seção), `bg-stone-200`                                      |
| Bordas e divisórias | `border-stone-300` (linhas finas de 1px, sem sombras)                                                                  |
| Fonte               | Inter (`font-sans`); títulos `font-medium tracking-tight`                                                              |
| Rótulo / meta       | `text-xs font-mono uppercase tracking-widest text-stone-500`                                                           |
| Cabeçalho de etapa  | rótulo `01 / Exame` + título `text-2xl md:text-4xl font-medium tracking-tight`                                         |
| Botão primário      | `px-6 py-3 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-700`                                  |
| Botão secundário    | `border border-stone-900 rounded-full px-6 py-2 text-sm uppercase tracking-widest hover:bg-stone-900 hover:text-white` |
| Card selecionável   | `border border-stone-300 hover:bg-white transition-colors`; selecionado: `bg-stone-900 text-white`                     |
| Ícones              | Solar (linear), via Iconify                                                                                            |
| Movimento           | `transition-colors`/`transition-all`, easing `cubic-bezier(0.16, 1, 0.3, 1)`; respeitar `prefers-reduced-motion`       |

O design system não define cores de estado: use `red-700` para erro, `emerald-700` para sucesso e `amber-700` para aviso, sempre em texto ou borda (sem fundos saturados). O foco precisa ficar visível: `focus-visible:outline-2 focus-visible:outline-stone-900`.

## Convenções

- **Idioma:** o domínio fica em **português**, para bater com o enunciado (`Exame`, `Medico`, `Agendamento`, `gerarHorarios`, `/exames`). Os nomes impostos pelos frameworks ficam como são (`onModuleInit`, `useQuery`). Mensagens, UI e documentação em pt-BR.
- **ESM no backend:** imports relativos terminam em `.js` (`import { X } from './x.js'`).
- **Simplicidade:** nada de interface com uma implementação só, repositório genérico ou camada "por cerimônia". A regra de negócio mora em funções puras, o service orquestra e o controller só traduz HTTP.
- **Validação nas bordas:** os DTOs usam `class-validator`, com mensagens em pt-BR. O domínio assume dados já validados.
- **Testes:**
  - Domínio: unitários com os exemplos do enunciado como casos.
  - API: e2e com supertest contra um SQLite real (`test.db`), sem mock de Prisma.
  - Front: Vitest + Testing Library com `fetch` mockado.
  - Relógio: `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime()`; não existe abstração de relógio.
- **Commits:** pequenos, em [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português (`feat(api): …`, `test(agenda): …`, `docs: …`). Cada commit deixa `lint`, `typecheck` e `test` verdes.

## Armadilhas conhecidas

- **Prisma fixado em 7.10.1.** O dist-tag `latest` do pacote `prisma` aponta para um RC da 8. Não atualize sem decidir isso explicitamente.
- **TypeScript fixado em ~6.0.** O TypeScript 7 (nativo) ainda não é suportado por `@nestjs/swagger`.
- **Trigger x migrations:** quando uma migration futura precisa recriar a tabela `Agendamento` (`CREATE new_… / DROP / RENAME`), o SQLite apaga os triggers. Recrie-os na mesma migration; o teste e2e de inserção direta falha se o trigger sumir.
- **Windows:** use `curl.exe` (no PowerShell 5.1, `curl` é atalho para `Invoke-WebRequest`). O `test.db` só pode ser apagado com as conexões fechadas (`app.close()`).

## Definição de pronto

Antes de considerar uma tarefa concluída:

1. `npm run format:check && npm run lint && npm run typecheck && npm test` verdes na raiz (é o que o CI roda).
2. Regra de negócio nova ou alterada tem teste cobrindo o caso feliz e os de borda.
3. Erros novos estão no catálogo (`src/comum/erros.ts`) e tratados no front pelo `codigo`.
4. README e este arquivo continuam verdadeiros: atualize-os no mesmo commit da mudança.
