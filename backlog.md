# Backlog técnico - Xolot

Atualizado em 2026-07-25.

Este arquivo é orientado a desenvolvimento. Cada item deve virar issue ou task rastreável antes de entrar em implementação.

## Prioridades

- P0: bloqueia o lançamento público.
- P1: necessário para o MVP comercial.
- P2: melhora qualidade, conversão ou operação.
- P3: expansão após validação do produto.

## Definition of Done

- [ ] TypeScript sem erros em `pnpm run typecheck`.
- [ ] Testes automatizados passando em `pnpm test`.
- [ ] Build web concluído em `pnpm run build:web`.
- [ ] Fluxos críticos validados em viewport mobile e desktop.
- [ ] Estados de loading, erro, vazio e sucesso tratados.
- [ ] Interface sem conteúdo falso apresentado como dado real.
- [ ] Persistência e migrações cobertas por testes.
- [ ] README e backlog atualizados.
- [ ] Deploy verificado em `https://xolot.com.br`.

## Migração concluída - Rede profissional de publicidade

### Task PIVOT-001 - Remover o domínio anterior

Tipo: Produto/Frontend/Dados

Status: Concluído em 2026-07-25.

- [x] Remover tipos, seletores e ações do domínio anterior.
- [x] Remover telas, rotas e componentes que não pertencem à rede de publicidade.
- [x] Remover valores, indicadores e chamadas financeiras do Início e dos perfis.
- [x] Remover estilos e utilitários obsoletos.
- [x] Atualizar o schema local da versão 4 para a versão 5.
- [x] Preservar contas, perfis, publicações e relações sociais na migração.
- [x] Descartar com segurança os dados locais incompatíveis com o novo produto.
- [x] Cobrir a migração com testes automatizados.

### Task PIVOT-002 - Criar perfis profissionais

Tipo: Frontend/Produto

Status: Concluído em 2026-07-25.

- [x] Criar modo profissional opcional por perfil.
- [x] Adicionar categorias: Talento, Criador, Negócio, Marca, Projeto e Serviço.
- [x] Adicionar link profissional externo.
- [x] Exibir categoria profissional na Pesquisa e no perfil público.
- [x] Criar painel com publicações, visualizações, curtidas e mensagens.
- [x] Manter o perfil social e a galeria como vitrine principal.
- [x] Substituir o item secundário do menu do Perfil por `Painel profissional`.

### Task PIVOT-003 - Preparar planos de monetização

Tipo: Produto/Frontend

Status: Concluído em modo de pré-lançamento em 2026-07-25.

- [x] Definir plano Gratuito.
- [x] Definir Xolot Pro por R$ 19,90/mês.
- [x] Definir Xolot Negócios por R$ 99/mês.
- [x] Exibir comparação resumida de benefícios no painel.
- [x] Persistir localmente a seleção de plano.
- [x] Informar claramente que ainda não existe cobrança.
- [ ] Integrar produtos reais no Google Play Billing e App Store.
- [ ] Integrar checkout web recorrente.
- [ ] Validar recibos e webhooks no backend.
- [ ] Implementar cancelamento, renovação e restauração de compra.

### Task PIVOT-004 - Criar campanhas de publicação promovida

Tipo: Frontend/Produto/Dados

Status: Concluído em modo de pré-lançamento em 2026-07-25.

- [x] Criar página dedicada para promover uma publicação própria.
- [x] Oferecer objetivos de alcance, visitas ao perfil e mensagens.
- [x] Oferecer duração de 3, 7 ou 14 dias.
- [x] Oferecer orçamentos de teste de R$ 20, R$ 50 ou R$ 100.
- [x] Calcular estimativa de alcance de forma determinística.
- [x] Criar, pausar e retomar campanhas locais.
- [x] Relacionar campanha, publicação, perfil e conta proprietária.
- [x] Remover campanhas relacionadas quando a publicação é excluída.
- [x] Priorizar campanhas ativas no Início.
- [x] Identificar conteúdo promovido de forma explícita.
- [x] Cobrir regras de campanha e ordenação com testes automatizados.

### Task PIVOT-005 - Atualizar documentação e validação

Tipo: Engenharia

Status: Em andamento nesta entrega.

- [x] Atualizar o README para o posicionamento de publicidade.
- [x] Reescrever o backlog para o novo objetivo do produto.
- [x] Remover referências funcionais ao escopo anterior.
- [x] Executar `pnpm run typecheck`.
- [x] Executar `pnpm test` com 68 testes aprovados.
- [x] Executar build web de produção.
- [ ] Validar visualmente em mobile e desktop.
- [ ] Criar commit, enviar ao GitHub e verificar o deploy.

## P0 - Backend público

### Task P0-001 - API, banco e autenticação

Tipo: Backend/Infra

- [ ] Escolher stack de backend e banco relacional.
- [ ] Criar ambientes local, staging e produção.
- [ ] Implementar cadastro, login, logout, refresh token e recuperação de senha.
- [ ] Garantir unicidade server-side de email e `@username`.
- [ ] Migrar login Google para sessão emitida pelo backend.
- [ ] Criar autorização por usuário, função e propriedade do recurso.
- [ ] Implementar rate limiting e proteção contra abuso.
- [ ] Criar trilha de auditoria para ações administrativas.

Endpoints iniciais:

- [ ] `POST /auth/register`
- [ ] `POST /auth/login`
- [ ] `POST /auth/google`
- [ ] `POST /auth/refresh`
- [ ] `POST /auth/logout`
- [ ] `GET /me`
- [ ] `PATCH /me`
- [ ] `GET /profiles`
- [ ] `GET /profiles/:username`
- [ ] `POST /profiles/:id/follow`
- [ ] `DELETE /profiles/:id/follow`

### Task P0-002 - Publicações e storage

Tipo: Backend/Frontend/Infra

- [x] Persistir mídia provisoriamente no IndexedDB do navegador.
- [x] Pausar vídeos fora da área visível.
- [x] Suportar foto, vídeo, descrição, tags e marcações no frontend.
- [ ] Escolher storage: S3, Cloudflare R2, Supabase ou Firebase Storage.
- [ ] Criar upload por URL assinada.
- [ ] Validar MIME, tamanho, duração e resolução.
- [ ] Gerar thumbnail, poster e versões otimizadas.
- [ ] Implementar CDN e expiração de links privados.
- [ ] Criar feed paginado no backend.
- [ ] Implementar exclusão lógica e limpeza assíncrona de mídia.

### Task P0-003 - Mensagens em tempo real

Tipo: Backend/Frontend

- [x] Implementar experiência local de conversas e solicitações.
- [x] Implementar follow como regra de liberação de conversa.
- [x] Permitir compartilhar publicações com mensagem anexada.
- [x] Fixar até três conversas, silenciar e apagar histórico localmente.
- [ ] Criar tabelas Conversation, ConversationMember e Message.
- [ ] Implementar WebSocket ou serviço realtime.
- [ ] Persistir recibos de envio, entrega e leitura.
- [ ] Implementar anexos por referência segura à publicação.
- [ ] Implementar paginação e sincronização offline.
- [ ] Criar notificações push.

### Task P0-004 - Segurança, privacidade e moderação

Tipo: Backend/Produto/Jurídico

- [x] Implementar bloqueio e preferências locais de conteúdo.
- [ ] Criar denúncia de perfil, publicação e mensagem.
- [ ] Implementar moderação automática de texto, imagem e vídeo.
- [ ] Criar fila humana para exceções e recursos.
- [ ] Implementar proteção de menores e consentimento responsável.
- [ ] Criar exportação e exclusão de dados conforme LGPD.
- [ ] Definir política de publicidade e conteúdo proibido.
- [ ] Registrar por que um anúncio foi mostrado ao usuário.

## P1 - Plataforma de publicidade

### Task P1-001 - Entrega de campanhas no servidor

Tipo: Backend/Data

- [ ] Criar modelos Campaign, Creative, Audience e CampaignEvent.
- [ ] Validar propriedade da publicação antes de promover.
- [ ] Implementar estados draft, pending, active, paused, completed e rejected.
- [ ] Aplicar orçamento diário e total no servidor.
- [ ] Implementar pacing e limite de frequência por usuário.
- [ ] Garantir que conteúdo promovido sempre tenha identificação visual.
- [ ] Interromper entrega quando o orçamento ou período terminar.

### Task P1-002 - Segmentação responsável

Tipo: Produto/Data

- [ ] Permitir segmentação por região, categoria e interesse declarado.
- [ ] Proibir segmentação por atributos sensíveis.
- [ ] Oferecer controles de privacidade e personalização.
- [ ] Criar audiência estimada antes da publicação.
- [ ] Evitar sobre-exposição do mesmo anúncio.
- [ ] Documentar critérios de ranking orgânico e promovido.

### Task P1-003 - Métricas confiáveis

Tipo: Backend/Data/Frontend

- [ ] Registrar impressão quando a publicação estiver visível pelo tempo mínimo.
- [ ] Registrar visualização de vídeo por regra documentada.
- [ ] Registrar clique, visita ao perfil, follow e mensagem atribuída.
- [ ] Deduplicar eventos por sessão, conta e janela de tempo.
- [ ] Criar relatório por campanha, publicação e período.
- [ ] Exibir alcance, frequência, custo por resultado e taxa de conversão.
- [ ] Permitir exportação CSV para contas Negócios.

### Task P1-004 - Assinaturas e cobrança

Tipo: Backend/Mobile/Web

- [ ] Criar catálogo único de produtos e benefícios.
- [ ] Implementar entitlement server-side.
- [ ] Integrar Google Play Billing.
- [ ] Integrar StoreKit/App Store.
- [ ] Integrar checkout web compatível com as regras das lojas.
- [ ] Processar webhooks idempotentes.
- [ ] Emitir recibos e histórico de cobrança.
- [ ] Tratar trial, falha de pagamento, grace period e reembolso.

### Task P1-005 - Painel profissional completo

Tipo: Frontend/Produto

- [x] Criar painel local com métricas agregadas.
- [x] Criar seleção de categoria, plano e link profissional.
- [x] Listar campanhas e permitir pausar ou retomar.
- [ ] Adicionar filtros por período.
- [ ] Criar gráficos acessíveis de crescimento e conversão.
- [ ] Exibir origem das visitas e melhores publicações.
- [ ] Adicionar recomendações acionáveis sem inventar dados.
- [ ] Criar estado de carregamento e retry conectado à API.

## P2 - Qualidade do frontend

### Task P2-001 - Componentização

Tipo: Frontend

- [x] Separar screens, actions, repositories e estilos do `App.tsx`.
- [x] Extrair shell e navegação compartilhados.
- [ ] Criar `src/components/VideoPlayer.tsx` reutilizável.
- [ ] Criar `src/components/VideoCard.tsx` reutilizável.
- [ ] Criar `src/components/AppToast.tsx`.
- [ ] Extrair controles de câmera para componentes menores.
- [ ] Dividir os módulos de estilo restantes por domínio.

### Task P2-002 - Experiência e acessibilidade

Tipo: Frontend/UX

- [x] Padronizar retornos com ícone simples.
- [x] Padronizar animações de entrada e HUDs.
- [x] Ajustar avatar com foco e escala por gesto.
- [x] Criar navegação inferior fixa e responsiva.
- [ ] Testar leitor de tela em Android, iOS e web.
- [ ] Garantir foco de teclado em todos os modais.
- [ ] Auditar contraste e áreas mínimas de toque.
- [ ] Implementar skeletons e estados de retry.
- [ ] Criar testes E2E dos fluxos principais.

### Task P2-003 - Observabilidade e CI

Tipo: Infra/Qualidade

- [x] Publicar web por GitHub Actions e domínio próprio.
- [x] Executar testes unitários do estado local.
- [ ] Executar typecheck, testes e build em toda pull request.
- [ ] Adicionar monitoramento de erros com contexto não sensível.
- [ ] Adicionar métricas de desempenho e Web Vitals.
- [ ] Criar alertas para falha de deploy e API.
- [ ] Criar política de backup e restauração do banco.

## P3 - Expansão após validação

- [ ] Marketplace de serviços entre profissionais e marcas.
- [ ] Comissão por contratação concluída com regras transparentes.
- [ ] Perfis de equipe e permissões para agências.
- [ ] Biblioteca de mídia e calendário de publicações.
- [ ] Integrações com analytics e CRM.
- [ ] Programa de afiliados para criadores.
- [ ] API pública com chaves e limites por plano.

## Decisão de produto arquivada

O escopo anterior de captação e participação em atletas foi removido em 2026-07-25. Ele não deve voltar ao código sem nova decisão de produto, análise jurídica e arquitetura própria. A direção ativa da Xolot é rede social profissional com publicidade, assinaturas e promoção de conteúdo.
