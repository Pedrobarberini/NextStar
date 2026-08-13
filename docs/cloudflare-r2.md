# Cloudflare R2 - publicacoes Xolot

## Arquitetura

- `xolot-uploads`: bucket privado que recebe uploads temporarios por URL assinada.
- `xolot-media`: bucket publico servido por `https://media.xolot.com.br`.
- Firebase Functions: autentica o usuario, valida metadados, cria a URL assinada, promove a midia e exclui objetos.
- Cloud Firestore: armazena somente metadados e a chave imutavel do objeto.
- O app nunca recebe as credenciais S3 do R2.

## Configuracao unica

1. No Firebase CLI, cadastre as credenciais S3 geradas pelo token R2:

   ```powershell
   pnpm dlx firebase-tools@latest functions:secrets:set R2_ACCESS_KEY_ID
   pnpm dlx firebase-tools@latest functions:secrets:set R2_SECRET_ACCESS_KEY
   ```

   Digite os valores apenas no prompt. Nunca salve esses valores no Git ou em variaveis `EXPO_PUBLIC_*`.

2. Aplique CORS aos dois buckets:

   ```powershell
   pnpm dlx wrangler@latest r2 bucket cors set xolot-uploads --file cloudflare/r2-uploads-cors.json
   pnpm dlx wrangler@latest r2 bucket cors set xolot-media --file cloudflare/r2-media-cors.json
   ```

3. Confira as politicas:

   ```powershell
   pnpm dlx wrangler@latest r2 bucket cors list xolot-uploads
   pnpm dlx wrangler@latest r2 bucket cors list xolot-media
   ```

4. Publique as Functions:

   ```powershell
   pnpm run deploy:firebase:functions
   ```

5. Somente depois do deploy bem-sucedido, habilite o R2 no `.env` local:

   ```dotenv
   EXPO_PUBLIC_R2_MEDIA_ENABLED=true
   EXPO_PUBLIC_R2_MEDIA_URL=https://media.xolot.com.br
   ```

6. Gere e publique o aplicativo:

   ```powershell
   pnpm run deploy:firebase:hosting
   ```

## Teste de aceitacao

1. Entre com uma conta cujo email esteja verificado.
2. Publique uma foto, um GIF e um video curto.
3. Confira o progresso do upload e a exibicao no Inicio e no perfil.
4. Recarregue a pagina e confirme que a midia continua disponivel.
5. Exclua uma publicacao propria e confirme que ela desaparece do Firestore e do R2.
6. Tente publicar com outra conta ou formato invalido e confirme que o backend recusa.

## Seguranca

- O token R2 deve ter acesso somente aos buckets `xolot-uploads` e `xolot-media`.
- URLs de upload expiram em 15 minutos; intencoes expiram em 30 minutos.
- O backend limita cada conta a dez novas intencoes por minuto.
- O arquivo e validado novamente por tamanho e MIME antes de ficar publico.
- App Check deve ser exigido somente depois que web e clientes nativos estiverem registrados e monitorados.
