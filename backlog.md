# Backlog técnico - Xolot

Atualizado em 2026-07-27.

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
- [x] Exibir a quantidade de compartilhamentos no Início e simplificar os controles laterais para ícones sem círculos.
- [x] Animar o coração ao curtir uma publicação e manter o estado ativo em vermelho.
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

Status: Concluído em 2026-07-25, com validação visual manual ainda recomendada.

- [x] Atualizar o README para o posicionamento de publicidade.
- [x] Reescrever o backlog para o novo objetivo do produto.
- [x] Remover referências funcionais ao escopo anterior.
- [x] Executar `pnpm run typecheck`.
- [x] Executar `pnpm test` com 68 testes aprovados.
- [x] Executar build web de produção.
- [ ] Validar visualmente em mobile e desktop após a publicação. O navegador automatizado ficou indisponível nesta sessão.
- [x] Criar commit, enviar ao GitHub e verificar o deploy.

## P0 - Backend público

### Task P0-001 - Contas e perfis no Firebase

Tipo: Backend/Frontend/Infra/Segurança

Status: Fase 1 implementada; Hosting e Firestore publicados em 2026-07-28. Email/Senha e Google configurados; domínio Auth personalizado e App Check ainda pendentes.

- [x] Escolher Firebase Authentication e Cloud Firestore para contas e perfis.
- [x] Implementar cadastro por email/senha sem credencial local.
- [x] Implementar login, logout e restauração de sessão pelo Firebase Auth.
- [x] Exigir verificação de email antes de acessar dados sociais.
- [x] Implementar recuperação de senha com resposta antienumeração.
- [x] Integrar login Google à mesma autoridade de sessão.
- [x] Remover o login Apple Web e seu código específico por decisão de produto.
- [x] Exibir Google em largura total, com ícone oficial, carregamento e acessibilidade.
- [x] Usar o asset oficial do Google Identity, sem dependência de fonte web.
- [x] Tratar domínio OAuth não autorizado, popup bloqueado, conta já vinculada e URI de retorno inválida com mensagens específicas.
- [x] Exibir requisitos de senha em tempo real e traduzir erros de cadastro do Firebase, incluindo email já cadastrado por provedor social.
- [x] Retirar o planejamento de Sign in with Apple nativo nesta fase.
- [x] Criar `accounts/{uid}` privado com metadados mínimos e imutáveis.
- [x] Criar `profiles/{uid}` sem email, senha ou papel administrativo.
- [x] Garantir unicidade de `@username` com transação e coleção `usernames`.
- [x] Aplicar regras Firestore deny-by-default, propriedade por UID e allowlist de campos.
- [x] Remover hash, salt, contas e sessão do estado persistido local.
- [x] Atualizar o schema local da versão 5 para a versão 6.
- [x] Configurar persistência do Firebase Auth no React Native com AsyncStorage.
- [x] Preparar App Check web com reCAPTCHA Enterprise por variável de ambiente.
- [x] Adicionar testes de normalização de perfil, descarte de credenciais e invariantes das regras.
- [x] Documentar variáveis, modelo de dados e práticas de segurança.
- [x] Executar pnpm run typecheck, 74 testes e build web de produção.
- [ ] Criar projetos Firebase separados para desenvolvimento, staging e produção.
- [x] Habilitar Email/Senha, Google e política forte de senha no console.
- [ ] Ativar proteção contra enumeração de emails.
- [ ] Adicionar `xolot.com.br` aos domínios autorizados do Firebase Authentication.
- [ ] Revisar domínios autorizados para OAuth e links de ação após a emissão do certificado TLS.
- [x] Publicar `firestore.rules` e `firestore.indexes.json` no projeto correto.
- [ ] Cobrir regras com Firebase Emulator Suite e `@firebase/rules-unit-testing`.
- [ ] Registrar App Check e ativar enforcement após monitorar clientes legítimos.
- [ ] Implementar custom claims e backend confiável para funções administrativas.
- [ ] Implementar exclusão/exportação de conta e dados conforme LGPD.
- [ ] Criar trilha de auditoria para ações administrativas.

Coleções desta fase:

- [x] `accounts/{uid}` para metadados privados mínimos.
- [x] `profiles/{uid}` para dados públicos do perfil.
- [x] `usernames/{username}` para reserva única e transacional.
### Task P0-002 - Publicações e storage

Tipo: Backend/Frontend/Infra

Status: Cliente, Firestore e regras preparados em 2026-07-29. A ativação do bucket Firebase Storage e o plano Blaze ainda bloqueiam a publicação desta versão no Hosting.

- [x] Persistir mídia provisoriamente no IndexedDB do navegador.
- [x] Adicionar chave de recurso para manter mídia local enquanto o Storage estiver inativo.
- [x] Preservar feed, envio e avatar locais sem bloquear o restante do app.
- [x] Pausar vídeos fora da área visível.
- [x] Preservar a proporção completa dos vídeos no feed sem cortar as bordas.
- [x] Suportar foto, vídeo, descrição, tags e marcações no frontend.
- [x] Escolher Firebase Storage para mídia e Cloud Firestore para metadados.
- [x] Criar upload autenticado e resumível pelo SDK Firebase, com progresso visual.
- [x] Persistir posts em `posts/{postId}` e arquivos em `posts/{uid}/{postId}/media`.
- [x] Persistir avatar e enquadramento em `profileMedia/{uid}` e `avatars/{uid}/profile`.
- [x] Validar MIME, tamanho e metadados no cliente, Firestore e Storage Rules.
- [x] Assinar em tempo real a primeira página com limite de 50 publicações.
- [x] Excluir documento e arquivo remoto apenas para o proprietário.
- [x] Publicar e validar a compilação das regras do Firestore.
- [x] Validar integração com TypeScript, 84 testes automatizados e build web.
- [ ] Ativar Firebase Storage no projeto `xolot-384e9` e vincular o plano Blaze.
- [ ] Publicar `storage.rules` após a criação do bucket.
- [ ] Validar duração e resolução reais em processamento confiável no servidor.
- [ ] Gerar thumbnail, poster e versões otimizadas.
- [ ] Implementar paginação incremental além das 50 publicações iniciais.
- [ ] Implementar exclusão lógica e limpeza assíncrona de mídia.

### Task P0-003 - Mensagens em tempo real

Tipo: Backend/Frontend

- [x] Implementar experiência local de conversas e solicitações.
- [x] Implementar follow como regra de liberação de conversa.
- [x] Permitir compartilhar publicações com mensagem anexada.
- [x] Fixar até três conversas, silenciar e apagar histórico localmente.
- [x] Pesquisar conversas por nome público ou @username.
- [x] Limitar a aba Pesquisar aos perfis que a conta segue.
- [x] Criar comentarios nos reels com contagem, lista, envio e exclusao pelo autor.
- [x] Persistir comentarios no estado social local durante a fase de testes.
- [x] Permitir responder comentarios com encadeamento e marcacao do autor.
- [x] Recolher respostas por padrao e permitir ver ou ocultar cada topico.
- [x] Corrigir a exclusao de comentarios no web com confirmacao interna.
- [x] Recarregar e retornar ao primeiro reel ao tocar na logo do Inicio.
- [ ] Migrar comentarios para o Cloud Firestore com paginacao e atualizacao em tempo real.
- [ ] Criar tabelas Conversation, ConversationMember e Message.
- [ ] Implementar WebSocket ou serviço realtime.
- [ ] Persistir recibos de envio, entrega e leitura.
- [ ] Implementar anexos por referência segura à publicação.
- [ ] Implementar paginação e sincronização offline.
- [ ] Criar notificações push.

### Task P0-004 - Segurança, privacidade e moderação

Tipo: Backend/Produto/Jurídico

- [x] Implementar bloqueio e preferências locais de conteúdo.
- [x] Permitir restaurar publicações próprias ocultadas e tipos marcados como sem interesse.
- [x] Criar denúncia local de publicação no feed com opção de retirada.
- [x] Criar central de Segurança para revisar ocultações, denúncias e bloqueios.
- [x] Padronizar em branco a seta de retorno sobre o vídeo.
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
- [x] Abrir o avatar do Perfil em uma visualizacao circular sem acessar o editor.
- [x] Criar navegação inferior fixa e responsiva.
- [ ] Testar leitor de tela em Android, iOS e web.
- [ ] Garantir foco de teclado em todos os modais.
- [ ] Auditar contraste e áreas mínimas de toque.
- [ ] Implementar skeletons e estados de retry.
- [ ] Criar testes E2E dos fluxos principais.

### Task P2-003 - Observabilidade e CI

Tipo: Infra/Qualidade

- [x] Publicar a versão web anterior por GitHub Actions e domínio próprio.
- [x] Executar testes unitários do estado local.
- [ ] Executar typecheck, testes e build em toda pull request.
- [ ] Adicionar monitoramento de erros com contexto não sensível.
- [ ] Adicionar métricas de desempenho e Web Vitals.
- [ ] Criar alertas para falha de deploy e API.
- [ ] Criar política de backup e restauração do banco.

### Task P2-004 - Migrar publicação para Firebase Hosting

Tipo: Infra/Segurança

Status: Preparação local concluída em 2026-07-28; ativação externa pendente.

- [x] Configurar `dist` como raiz pública do Firebase Hosting.
- [x] Configurar fallback de SPA para `index.html`.
- [x] Definir cache curto para manifest e sem cache para o service worker.
- [x] Tornar o pós-processamento do PWA independente do GitHub Pages.
- [x] Remover o workflow que publicava novos builds no GitHub Pages.
- [x] Adicionar scripts de deploy de Hosting e Firestore.
- [x] Associar o projeto Firebase local ao projeto `xolot-384e9`.
- [x] Publicar e validar o app no subdomínio `web.app`.
- [ ] Migrar `xolot.com.br` usando os registros DNS fornecidos pelo Firebase.
- [ ] Confirmar certificado HTTPS e só então despublicar o GitHub Pages.
- [ ] Tornar o repositório privado depois de confirmar que nenhum fluxo público depende dele.
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
