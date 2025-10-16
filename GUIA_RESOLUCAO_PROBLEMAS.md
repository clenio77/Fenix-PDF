# 🔧 Guia de Resolução de Problemas - Fênix PDF

## ❌ Erro: ChunkLoadError - Loading chunk app/layout failed

### Descrição do Problema
Este erro ocorre quando o Next.js não consegue carregar chunks JavaScript necessários para o funcionamento da aplicação. É comum após mudanças estruturais significativas no projeto.

### Sintomas
- Erro: `ChunkLoadError: Loading chunk app/layout failed`
- Timeout ao carregar `app/layout.js`
- Aplicação não carrega no navegador
- Aviso sobre versão do Next.js desatualizada

### ✅ Solução Implementada

#### 1. Parar o Servidor
```bash
pkill -f "next dev"
```

#### 2. Limpar Cache
```bash
rm -rf .next
rm -rf node_modules/.cache
```

#### 3. Atualizar Configuração do Next.js
Atualizar `next.config.js` com configurações otimizadas:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Configurações experimentais removidas
  },
  // Configurações para resolver problemas de chunk loading
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  webpack: (config, { isServer, dev }) => {
    // Configuração mais segura para fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        process: require.resolve('process/browser'),
        crypto: require.resolve('crypto-browserify'),
        buffer: require.resolve('buffer'),
        canvas: false,
      };
      
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }

    // Configurações para resolver problemas de chunk loading
    if (dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 1,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      };
    }

    return config;
  },
};
```

#### 4. Reinstalar Dependências
```bash
npm install
```

#### 5. Reiniciar o Servidor
```bash
npm run dev
```

### 🔍 Verificação da Solução

#### Verificar se o Servidor Está Rodando
```bash
lsof -i :3000
ps aux | grep -E "(next|node)" | grep -v grep
```

#### Testar a Aplicação
```bash
curl -s -I http://localhost:3000 | head -1
# Deve retornar: HTTP/1.1 200 OK
```

### 🚨 Outros Problemas Comuns

#### 1. Erro de Memória
```bash
# Aumentar limite de memória do Node.js
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

#### 2. Problemas de Porta
```bash
# Verificar processos na porta 3000
lsof -i :3000

# Matar processo específico
kill -9 <PID>

# Usar porta diferente
npm run dev -- -p 3001
```

#### 3. Problemas de Cache do Navegador
- Limpar cache do navegador (Ctrl+Shift+R)
- Abrir em aba anônima/privada
- Desabilitar cache no DevTools

#### 4. Problemas de Dependências
```bash
# Limpar completamente
rm -rf node_modules package-lock.json
npm install

# Verificar vulnerabilidades
npm audit
npm audit fix
```

### 📊 Monitoramento

#### Logs do Servidor
```bash
# Ver logs em tempo real
tail -f .next/server.log

# Verificar logs do sistema
journalctl -f -u nextjs
```

#### Métricas de Performance
```bash
# Verificar uso de memória
ps aux | grep next | awk '{print $4, $6}'

# Verificar uso de CPU
top -p $(pgrep -f "next dev")
```

### 🛠️ Comandos Úteis

#### Limpeza Completa
```bash
#!/bin/bash
echo "🧹 Limpando projeto..."

# Parar servidor
pkill -f "next dev"

# Limpar cache
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

echo "✅ Limpeza concluída!"
```

#### Verificação de Saúde
```bash
#!/bin/bash
echo "🔍 Verificando saúde do projeto..."

# Verificar se porta está livre
if lsof -i :3000 > /dev/null 2>&1; then
    echo "❌ Porta 3000 em uso"
    lsof -i :3000
else
    echo "✅ Porta 3000 livre"
fi

# Verificar dependências
if npm list --depth=0 > /dev/null 2>&1; then
    echo "✅ Dependências OK"
else
    echo "❌ Problemas com dependências"
fi

# Verificar build
if npm run build > /dev/null 2>&1; then
    echo "✅ Build OK"
else
    echo "❌ Problemas no build"
fi
```

### 📝 Prevenção

#### 1. Atualizações Regulares
```bash
# Atualizar Next.js
npm update next

# Atualizar todas as dependências
npm update
```

#### 2. Monitoramento Contínuo
- Verificar logs regularmente
- Monitorar uso de memória
- Testar em diferentes navegadores

#### 3. Backup de Configurações
- Manter backup do `next.config.js`
- Documentar mudanças importantes
- Versionar configurações

### 🆘 Suporte

#### Informações para Debug
```bash
# Versões
node --version
npm --version
npx next --version

# Sistema
uname -a
cat /etc/os-release

# Memória
free -h
df -h
```

#### Logs Importantes
- `.next/server.log`
- `npm-debug.log`
- Logs do navegador (F12 → Console)

---

*Este guia foi criado após resolver o ChunkLoadError no projeto Fênix PDF. Mantenha-o atualizado conforme novos problemas forem identificados.*
