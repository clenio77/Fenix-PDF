# Deploy no Vercel - Fênix PDF

## Configurações Aplicadas

### 1. Arquivos de Configuração

- **`.npmrc`**: Configurado com `legacy-peer-deps=true` para resolver conflitos de dependências
- **`vercel.json`**: Configurado para usar `--legacy-peer-deps` durante a instalação
- **`.vercelignore`**: Exclui arquivos desnecessários do deploy
- **`.nvmrc`**: Especifica Node.js 18

### 2. Package.json

- **`overrides`**: Força o uso do zod versão 3.23.8 para compatibilidade
- Dependências otimizadas para produção

### 3. Next.js Config

- **`output: 'standalone'`**: Otimiza para deploy
- **`serverComponentsExternalPackages`**: Configura canvas para servidor
- **Webpack config**: Configurações específicas para PDF e canvas

## Como Fazer Deploy

### Opção 1: Deploy Automático via Git
1. Conecte o repositório ao Vercel
2. O Vercel detectará automaticamente as configurações
3. O build será executado com `--legacy-peer-deps`

### Opção 2: Deploy Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
vercel --prod
```

### Opção 3: Deploy via Dashboard
1. Acesse [vercel.com](https://vercel.com)
2. Importe o projeto
3. Configure as variáveis de ambiente se necessário
4. Deploy automático

## Resolução de Problemas

### Erro de Dependências
Se ainda houver conflitos de dependências:
1. Verifique se o `.npmrc` está presente
2. Confirme que o `vercel.json` está configurado
3. Use `--legacy-peer-deps` nas configurações do Vercel

### Erro de Canvas
Se houver problemas com canvas:
1. Verifique se `serverComponentsExternalPackages` está configurado
2. Confirme que canvas está nas dependências

### Build Falha
Se o build falhar:
1. Teste localmente com `npm run build`
2. Verifique os logs do Vercel
3. Confirme que todas as dependências estão corretas

## Configurações Recomendadas no Vercel

- **Node.js Version**: 18.x
- **Build Command**: `npm run build`
- **Install Command**: `npm install --legacy-peer-deps`
- **Output Directory**: `.next`

## Monitoramento

Após o deploy, monitore:
- Logs de build no dashboard do Vercel
- Performance da aplicação
- Erros em produção
- Uso de recursos

A aplicação está configurada para funcionar perfeitamente no Vercel com todas as otimizações necessárias.