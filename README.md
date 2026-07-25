# Xolot

Rede social mobile-first para pessoas, criadores, talentos, marcas, projetos e serviços divulgarem seu trabalho por meio de vídeos verticais.

## Produto atual

- Aplicativo React Native com Expo e TypeScript para Android, iOS e web/PWA.
- Login por email e senha, cadastro simplificado e autenticação Google preparada com Firebase.
- Primeiro acesso com configuração de `@username`, nome público, biografia, idade, área de atuação, cidade e organização.
- Perfis próprios e públicos com foto ajustável, biografia, galeria, métricas sociais e link profissional.
- Início em formato vertical, com reprodução automática apenas do conteúdo visível, curtidas, compartilhamento, follow e preferências de conteúdo.
- Envio por câmera ou galeria, com foto, vídeo, descrição, tags e marcações de usuários.
- Pesquisa por nome, `@username`, categoria, cidade, organização ou área de atuação.
- Mensagens diretas, solicitações de contato, conversas fixadas, silenciadas e compartilhamento de publicações.
- Menu do Perfil com Configurações, Painel profissional e Sair da conta.
- Modo profissional para talentos, criadores, negócios, marcas, projetos e serviços.
- Planos preparados para lançamento: Gratuito, Xolot Pro e Xolot Negócios.
- Painel profissional com visualizações, curtidas, mensagens, publicações e campanhas.
- Promoção de publicações por objetivo, duração e orçamento, com estimativa de alcance.
- Campanhas ativas recebem prioridade identificada no Início e podem ser pausadas ou retomadas.

Os planos e campanhas estão em modo de pré-lançamento. Não existe cobrança ou movimentação de dinheiro no frontend atual. A ativação comercial depende de backend, billing e medição server-side.

## Monetização planejada

1. **Xolot Pro:** perfil profissional, métricas ampliadas, link externo e recursos de divulgação.
2. **Xolot Negócios:** presença de marca, campanhas recorrentes, relatórios e recursos para equipes.
3. **Publicações promovidas:** alcance pago com objetivo de visualizações, visitas ao perfil ou mensagens.
4. **Futuro:** marketplace de serviços e parcerias, com comissão somente após validação do produto e implementação de pagamentos reais.

## Teste online

A versão web oficial é publicada em:

https://xolot.com.br

A versão web é um PWA e pode ser instalada pelo navegador. O service worker mantém os assets principais em cache depois do primeiro acesso.

## Persistência atual

Contas, sessão, perfis, publicações, follows, mensagens, preferências, configurações profissionais e campanhas ficam persistidos localmente no dispositivo.

Na web, os arquivos escolhidos ficam no IndexedDB e sobrevivem ao recarregamento no mesmo navegador. Sincronização entre aparelhos, recuperação de conta, upload remoto e entrega real de campanhas dependem do backend.

## Como executar

Requisitos: Node.js 22 ou superior e pnpm 11.

```bash
pnpm install
cp .env.example .env
pnpm start --tunnel
```

O modo `--tunnel` permite abrir o projeto no Expo Go mesmo quando computador e celular não estão na mesma rede local.

### Comandos de qualidade

```bash
pnpm run typecheck
pnpm test
pnpm run build:web
```

### Login com Google

A integração preparada usa:

- **Web/PWA:** Firebase Auth com `signInWithPopup`.
- **iOS/Android:** `expo-auth-session` e credencial Firebase.

Configure as variáveis `EXPO_PUBLIC_FIREBASE_*` e `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` no `.env` e nos Secrets do GitHub Actions. No Firebase, autorize `localhost`, `xolot.com.br` e `pedrobarberini.github.io`.

Sem essas variáveis, email e senha continuam funcionando no modo local.

## Arquitetura

- `App.tsx`: composição do estado compartilhado e roteamento.
- `src/screens/`: autenticação, Início, Envio, Pesquisa, Mensagens, Perfil, painel profissional e promoção.
- `src/components/`: navegação, shell, modais e componentes compartilhados.
- `src/actions/`: casos de uso e handlers de produto.
- `src/repositories/`: schema local versionado e persistência.
- `src/services/`: mídia local, autenticação e domínios sociais.
- `src/styles/`: estilos organizados por tela ou domínio.
- `src/utils/`: regras puras de perfil, mídia, campanhas e conteúdo.

## Fluxo de teste

1. Cadastre uma conta com email e senha.
2. Complete o perfil inicial e escolha um `@username` único.
3. Publique uma foto ou vídeo com descrição, tags e marcações.
4. Confirme a publicação no Início e na galeria do Perfil.
5. Curta, siga, compartilhe e abra uma conversa com outro perfil.
6. Ative o modo profissional em `Perfil > Painel profissional`.
7. Escolha uma categoria e um plano de pré-lançamento.
8. Selecione uma publicação e crie uma campanha de teste.
9. Confirme o selo de conteúdo promovido no Início.
10. Pause e retome a campanha pelo painel.
11. Recarregue a página e confirme a restauração do estado local.

## Antes da abertura ao público

- Implementar API, banco de dados e sessões seguras.
- Armazenar mídia em storage remoto com processamento de thumbnail e vídeo.
- Implementar entrega e segmentação de campanhas no servidor.
- Registrar eventos de impressão, visualização, clique, visita e mensagem sem duplicação.
- Integrar billing de assinaturas e campanhas pelas lojas e por provedor web.
- Adicionar moderação automática, denúncias, recursos e auditoria.
- Aplicar LGPD, proteção de menores, consentimentos e controles de privacidade.
- Adicionar observabilidade, rate limiting, testes de integração e recuperação de falhas.

O backlog técnico atualizado está em `backlog.md`.
