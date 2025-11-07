#!/bin/bash

# Script para verificar archivos con imports problemáticos de createHash

echo "🔍 Buscando imports de createHash en el proyecto..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Buscar archivos con el import problemático
problematic_files=$(grep -r "createHash.*from.*std.*crypto" src/ 2>/dev/null | grep -v "node:crypto" || true)

if [ -n "$problematic_files" ]; then
    echo -e "${RED}❌ Encontrados archivos con imports problemáticos:${NC}"
    echo ""
    echo "$problematic_files" | while IFS= read -r line; do
        file=$(echo "$line" | cut -d':' -f1)
        echo -e "   ${YELLOW}📄 $file${NC}"
        echo "      $(echo "$line" | cut -d':' -f2-)"
        echo ""
    done

    echo ""
    echo -e "${YELLOW}⚠️  Estos archivos necesitan ser corregidos.${NC}"
    echo ""
    echo "Para corregirlos automáticamente, ejecuta:"
    echo "   deno run --allow-read --allow-write fix-createhash-imports.ts"
    echo ""
    echo "O manualmente cambia:"
    echo "   DE:   import { createHash } from \"https://deno.land/std@X.X.X/crypto/mod.ts\";"
    echo "   A:    import { createHash } from \"node:crypto\";"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ No se encontraron imports problemáticos de createHash.${NC}"
    echo ""

    # Verificar si hay imports correctos
    correct_files=$(grep -r "createHash.*from.*node:crypto" src/ 2>/dev/null || true)
    if [ -n "$correct_files" ]; then
        echo -e "${GREEN}✓ Archivos con imports correctos (node:crypto):${NC}"
        echo "$correct_files" | while IFS= read -r line; do
            file=$(echo "$line" | cut -d':' -f1)
            echo -e "   ${GREEN}✓ $file${NC}"
        done
        echo ""
    fi

    # Verificar uso de Web Crypto API
    webcrypto_files=$(grep -r "crypto\.subtle\.digest" src/ 2>/dev/null || true)
    if [ -n "$webcrypto_files" ]; then
        echo -e "${GREEN}✓ Archivos usando Web Crypto API:${NC}"
        echo "$webcrypto_files" | while IFS= read -r line; do
            file=$(echo "$line" | cut -d':' -f1)
            echo -e "   ${GREEN}✓ $file${NC}"
        done
        echo ""
    fi

    exit 0
fi
