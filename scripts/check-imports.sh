#!/bin/bash

echo "🔍 Verificando importaciones..."
echo ""

# Verificar archivos críticos
critical_files=(
  "src/main.ts"
  "src/app.ts"
  "src/config/env.ts"
  "src/config/db.ts"
  "src/routes/index.ts"
)

for file in "${critical_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file - FALTA"
  fi
done

echo ""
echo "🔍 Verificando directorios de módulos..."

# Verificar directorios importantes
dirs=(
  "src/lib/plugin-system"
  "src/lib/cache"
  "src/lib/email"
  "src/lib/backup"
  "src/lib/security"
  "src/lib/jobs"
  "src/services"
  "src/controllers"
  "src/middleware"
  "src/middlewares"
)

for dir in "${dirs[@]}"; do
  if [ -d "$dir" ]; then
    echo "✅ $dir/"
  else
    echo "❌ $dir/ - FALTA"
  fi
done

echo ""
echo "🔍 Verificando configuración..."
if [ -f ".env" ]; then
  echo "✅ .env existe"
else
  echo "❌ .env NO existe - ejecuta: cp .env.example .env"
fi

if [ -f "deno.json" ]; then
  echo "✅ deno.json existe"
else
  echo "❌ deno.json NO existe"
fi

echo ""
echo "✅ Verificación completa"
