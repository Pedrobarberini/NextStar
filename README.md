# Xolot

Rede social mobile-first para pessoas, criadores, talentos, marcas, projetos e serviços divulgarem seu trabalho por meio de vídeos verticais.

## Produto atual

- Aplicativo React Native com Expo e TypeScript para Android, iOS e web/PWA.
- Contas por email/senha e Google usando Firebase Authentication.
- Verificação de email, recuperação de senha e restauração segura de sessão.
- Primeiro acesso com configuração de `@username`, nome público, biografia, idade, área de atuação, cidade e organização.
- Perfis públicos sincronizados pelo Cloud Firestore, com reserva transacional de `@username`.
- Perfis próprios e públicos com galeria, métricas sociais e link profissional.
- Início vertical com reprodução automática apenas do conteúdo visível, curtidas, compartilhamento, follow e preferências.
- Envio por câmera ou galeria, com foto, vídeo, descrição, tags e marcações.
- Pesquisa por nome, `@username`, categoria, cidade, organização ou área de atuação.
- Mensagens diretas, solicitações de contato e compartilhamento de publicações.
- Modo profissional, planos de pré-lançamento e campanhas simuladas.

Planos e campanhas continuam sem cobrança real. Billing, mídia remota, publicações, follows e mensagens server-side entram nas próximas fases.

## Teste online

A versão web oficial é publicada em [xolot.com.br](https://xolot.com.br). A web é um PWA e pode ser instalada pelo navegador.

## Persistência atual

### Firebase

- Firebase Authentication: credenciais, sessão, email verificado e provedores de login.
- `accounts/{uid}`: metadados privados mínimos, acessíveis somente pelo proprietário.
- `profiles/{uid}`: perfil social público, sem email, senha ou papel administrativo.
- `usernames/{username}`: reserva única de identificador, alterada junto ao perfil em transação.

A sessão e a lista de contas não são mais gravadas no estado local do app. Senhas nunca passam pelo Firestore nem pelo `AsyncStorage`.

### Ainda local

Publicações, mídia, follows, mensagens, preferências, avatares personalizados, configurações profissionais e campanhas ainda ficam no dispositivo. Na web, a mídia usa IndexedDB. Esses dados ainda não sincronizam entre aparelhos.

## Como executar

Requisitos: Node.js 22 ou superior e pnpm 11.

```bash
pnpm install
cp .env.example .env
pnpm start --tunnel
```

O modo `--tunnel` permite abrir o projeto no Expo Go quando computador e celular não estão na mesma rede.

### Qualidade

```bash
pnpm run typecheck
pnpm test
pnpm run build:web
```

## Configuração Firebase

1. Crie ou selecione um projeto Firebase e habilite o Cloud Firestore em modo Native.
2. Em Authentication, habilite Email/Senha e Google.
3. Configure uma política de senha com no mínimo 8 caracteres, letra maiúscula, minúscula e número.
4. Ative proteção contra enumeração de emails no projeto.
5. Autorize `localhost`, `xolot.com.br` e os domínios usados pelo Expo/OAuth.
6. Copie `.env.example` para `.env` e preencha apenas as variáveis públicas `EXPO_PUBLIC_*`.
7. Publique regras e índices com `firebase deploy --only firestore --project SEU_PROJECT_ID`.
8. Registre o app web no App Check com reCAPTCHA Enterprise, monitore as métricas e só depois habilite enforcement.
9. Gere o build e publique Hosting, regras e índices com `pnpm run deploy:firebase -- --project SEU_PROJECT_ID`.

A API key do Firebase e a chave de site do App Check identificam o app, mas não substituem segurança. A proteção efetiva está nas regras do Firestore, Auth, App Check e validações server-side.

Nunca inclua no app, no `.env` público ou no Firebase Hosting uma service account, chave privada, token Admin SDK ou segredo de provedor. Funções administrativas futuras devem rodar em Cloud Functions/Cloud Run com custom claims.
### Publicação no Firebase Hosting

O código-fonte pode permanecer em um repositório privado. O navegador recebe apenas o build de `dist`, mas esse JavaScript compilado continua sendo conteúdo público e não pode conter segredos administrativos.

```bash
pnpm dlx firebase-tools@latest login
pnpm run deploy:firebase -- --project SEU_PROJECT_ID
```

O `firebase.json` publica `dist` como SPA, preserva as rotas do app e controla o cache do service worker. Valide primeiro o endereço `SEU_PROJECT_ID.web.app`; depois conecte `xolot.com.br` em Firebase Console > Hosting > Add custom domain e aplique exatamente os registros DNS exibidos pelo Firebase.

### Modelo de dados desta fase

```text
accounts/{uid}
  uid
  authProvider
  createdAt
  termsAcceptedAt

profiles/{uid}
  uid
  username
  name
  bio
  age
  position
  city
  club
  photoURL
  profileCompleted
  createdAt
  updatedAt

usernames/{username}
  uid
  createdAt
```

As regras estão em `firestore.rules`; a configuração de deploy está em `firebase.json`.

## Arquitetura

- `App.tsx`: composição de estado e roteamento.
- `src/screens/`: autenticação, Início, Envio, Pesquisa, Mensagens, Perfil e painéis.
- `src/components/`: navegação, shell, modais e componentes compartilhados.
- `src/actions/`: casos de uso, sessão Firebase e handlers de produto.
- `src/repositories/`: schema local apenas para domínios ainda não migrados.
- `src/services/`: Firebase Auth/Firestore, mídia local e domínios sociais.
- `src/styles/`: estilos por tela ou domínio.
- `src/utils/`: regras puras de perfil, mídia, campanhas e conteúdo.

## Fluxo de teste de contas

1. Cadastre uma conta com email e senha forte.
2. Abra o email de verificação antes de tentar entrar.
3. Faça login e conclua o perfil inicial com um `@username` único.
4. Saia, recarregue o app e entre novamente.
5. Edite o perfil e confirme a atualização em outro navegador autenticado.
6. Teste `Esqueci minha senha` com uma mensagem que não revela se o email existe.
7. Crie uma segunda conta e confirme que o mesmo `@username` é recusado pelo servidor.

## Antes da abertura ao público

- Publicar e testar as regras do Firestore no Emulator Suite e no projeto de produção.
- Ativar App Check enforcement após observar clientes legítimos.
- Armazenar avatares e mídia no Firebase Storage com regras, limites e processamento.
- Migrar publicações, follows e mensagens para backend e tempo real.
- Implementar custom claims e auditoria para qualquer função administrativa.
- Adicionar exclusão/exportação de conta conforme LGPD e proteção de menores.
- Adicionar observabilidade, alertas, backups e testes de integração.

O backlog técnico atualizado está em `backlog.md`.