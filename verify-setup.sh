#!/bin/bash

echo "🚀 Atezca - Verificación de Instalación"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "📦 Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js instalado: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js no encontrado. Por favor instala Node.js >= 18"
    exit 1
fi

# Check pnpm
echo "📦 Verificando pnpm..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm -v)
    echo -e "${GREEN}✓${NC} pnpm instalado: $PNPM_VERSION"
else
    echo -e "${YELLOW}⚠${NC} pnpm no encontrado. Instalando..."
    npm install -g pnpm
fi

# Check if built
echo ""
echo "🔨 Verificando build..."
if [ -f "packages/core/dist/index.js" ]; then
    echo -e "${GREEN}✓${NC} Build completado"
else
    echo -e "${YELLOW}⚠${NC} Build no encontrado. Compilando..."
    cd packages/core && pnpm build && cd ../..
fi

# Check API key
echo ""
echo "🔑 Verificando configuración..."
if [ -f ".env" ]; then
    if grep -q "ANTHROPIC_API_KEY" .env; then
        echo -e "${GREEN}✓${NC} Archivo .env encontrado con API key"
    else
        echo -e "${YELLOW}⚠${NC} Archivo .env existe pero no tiene ANTHROPIC_API_KEY"
        echo "  Agrega tu API key: echo 'ANTHROPIC_API_KEY=sk-ant-...' >> .env"
    fi
else
    echo -e "${YELLOW}⚠${NC} Archivo .env no encontrado"
    echo "  Crea uno: cp .env.example .env"
    echo "  Luego agrega tu API key de: https://console.anthropic.com/"
fi

# Check Playwright
echo ""
echo "🎭 Verificando Playwright..."
if [ -d "node_modules/playwright" ]; then
    echo -e "${GREEN}✓${NC} Playwright instalado"
    
    # Check if browsers are installed
    if npx playwright --version &> /dev/null; then
        echo -e "${GREEN}✓${NC} Browsers de Playwright disponibles"
    else
        echo -e "${YELLOW}⚠${NC} Browsers de Playwright no instalados"
        echo "  Instala con: npx playwright install"
    fi
else
    echo -e "${RED}✗${NC} Playwright no instalado"
    echo "  Instala con: pnpm install"
fi

echo ""
echo "📚 Información del proyecto:"
echo "   Workspace: atezca"
echo "   Package: @atezca/core v0.1.0"
echo "   Ubicación: $(pwd)"
echo ""

echo "🎯 Próximos pasos:"
echo ""
echo "1. Configura tu API key de Anthropic:"
echo "   ${GREEN}echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env${NC}"
echo ""
echo "2. Instala los browsers de Playwright:"
echo "   ${GREEN}npx playwright install chromium${NC}"
echo ""
echo "3. Ejecuta un ejemplo:"
echo "   ${GREEN}node examples/basic/test.spec.js${NC}"
echo ""
echo "4. O usa el CLI:"
echo "   ${GREEN}./packages/core/dist/cli.js run examples/basic/test.spec.js${NC}"
echo ""
echo "📖 Documentación completa: README.md"
echo "🚀 Quick start: docs/quickstart.md"
echo ""
