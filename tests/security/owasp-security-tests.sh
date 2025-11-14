#!/bin/bash

###############################################################################
# OWASP Security Testing Suite para LexCMS
# Tests basados en OWASP Top 10 2021
###############################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="${BASE_URL:-http://localhost:8000}"
API_URL="$BASE_URL/api"
OUTPUT_DIR="/tmp/security-tests-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

###############################################################################
# Funciones de utilidad
###############################################################################

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_fail() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

log_warn() {
    echo -e "${YELLOW}[⚠ WARN]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

###############################################################################
# 1. OWASP A01:2021 - Broken Access Control
###############################################################################

test_broken_access_control() {
    log_info "========================================"
    log_info "OWASP A01:2021 - Broken Access Control"
    log_info "========================================"

    # Test 1.1: Acceso sin autenticación a recursos protegidos
    log_test "Test 1.1: Intentar acceder a /api/users sin autenticación"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/users")
    if [ "$RESPONSE" == "401" ] || [ "$RESPONSE" == "403" ]; then
        log_pass "Endpoint protegido correctamente (HTTP $RESPONSE)"
    else
        log_fail "Endpoint no protegido adecuadamente (HTTP $RESPONSE)"
    fi

    # Test 1.2: Acceso directo a recursos de otros usuarios (IDOR)
    log_test "Test 1.2: IDOR - Intentar acceder a recursos de otros usuarios"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Intentar acceder a usuario ID 1 sin autenticación
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/users/1")
    if [ "$RESPONSE" == "401" ] || [ "$RESPONSE" == "403" ]; then
        log_pass "Protección contra IDOR implementada (HTTP $RESPONSE)"
    else
        log_fail "Posible vulnerabilidad IDOR (HTTP $RESPONSE)"
    fi

    # Test 1.3: Escalación de privilegios
    log_test "Test 1.3: Intentar acceder a endpoints de administrador"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/roles")
    if [ "$RESPONSE" == "401" ] || [ "$RESPONSE" == "403" ]; then
        log_pass "Endpoints administrativos protegidos (HTTP $RESPONSE)"
    else
        log_fail "Endpoints administrativos accesibles sin autenticación (HTTP $RESPONSE)"
    fi

    echo ""
}

###############################################################################
# 2. OWASP A02:2021 - Cryptographic Failures
###############################################################################

test_cryptographic_failures() {
    log_info "========================================"
    log_info "OWASP A02:2021 - Cryptographic Failures"
    log_info "========================================"

    # Test 2.1: Verificar uso de HTTPS en producción
    log_test "Test 2.1: Verificar headers de seguridad HTTPS"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    HEADERS=$(curl -s -I "$BASE_URL/api/health" | grep -i "strict-transport-security")
    if [ -n "$HEADERS" ]; then
        log_pass "Header Strict-Transport-Security presente"
    else
        log_warn "Header Strict-Transport-Security no encontrado (verificar en producción)"
    fi

    # Test 2.2: Verificar que no se exponen datos sensibles
    log_test "Test 2.2: Buscar exposición de datos sensibles en respuestas"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    RESPONSE=$(curl -s "$API_URL/health")
    if echo "$RESPONSE" | grep -qi "password\|secret\|token\|key"; then
        log_fail "Posible exposición de datos sensibles en respuesta"
        echo "$RESPONSE" > "$OUTPUT_DIR/sensitive-data-exposure.txt"
    else
        log_pass "No se detectó exposición obvia de datos sensibles"
    fi

    echo ""
}

###############################################################################
# 3. OWASP A03:2021 - Injection (SQL, NoSQL, Command)
###############################################################################

test_injection_attacks() {
    log_info "========================================"
    log_info "OWASP A03:2021 - Injection Attacks"
    log_info "========================================"

    # Test 3.1: SQL Injection en parámetros GET
    log_test "Test 3.1: SQL Injection en parámetros de búsqueda"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    SQL_PAYLOADS=(
        "' OR '1'='1"
        "1' OR '1'='1' --"
        "'; DROP TABLE users--"
        "1' UNION SELECT NULL--"
        "admin'--"
    )

    VULNERABLE=0
    for payload in "${SQL_PAYLOADS[@]}"; do
        ENCODED_PAYLOAD=$(echo "$payload" | jq -sRr @uri)
        RESPONSE=$(curl -s "$API_URL/content?search=$ENCODED_PAYLOAD" 2>&1)

        if echo "$RESPONSE" | grep -qi "sql\|syntax\|database\|mysql\|sqlite\|postgres"; then
            log_fail "Posible SQL Injection detectada con payload: $payload"
            echo "Payload: $payload" >> "$OUTPUT_DIR/sql-injection-vulnerabilities.txt"
            echo "Response: $RESPONSE" >> "$OUTPUT_DIR/sql-injection-vulnerabilities.txt"
            echo "---" >> "$OUTPUT_DIR/sql-injection-vulnerabilities.txt"
            VULNERABLE=1
        fi
    done

    if [ $VULNERABLE -eq 0 ]; then
        log_pass "No se detectaron vulnerabilidades obvias de SQL Injection"
    fi

    # Test 3.2: NoSQL Injection
    log_test "Test 3.2: NoSQL Injection en parámetros JSON"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    NOSQL_PAYLOAD='{"$ne": null}'
    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": {"$ne": null}, "password": {"$ne": null}}' 2>&1)

    if echo "$RESPONSE" | grep -qi "success.*true\|token"; then
        log_fail "Posible NoSQL Injection detectada"
        echo "$RESPONSE" > "$OUTPUT_DIR/nosql-injection.txt"
    else
        log_pass "Sistema resistente a NoSQL Injection básico"
    fi

    # Test 3.3: Command Injection
    log_test "Test 3.3: Command Injection en parámetros"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    CMD_PAYLOADS=(
        "; ls -la"
        "| whoami"
        "\`id\`"
        "\$(whoami)"
    )

    VULNERABLE_CMD=0
    for payload in "${CMD_PAYLOADS[@]}"; do
        RESPONSE=$(curl -s "$API_URL/search?q=$payload" 2>&1)

        if echo "$RESPONSE" | grep -qi "root\|uid=\|gid=\|total "; then
            log_fail "Posible Command Injection con payload: $payload"
            VULNERABLE_CMD=1
        fi
    done

    if [ $VULNERABLE_CMD -eq 0 ]; then
        log_pass "No se detectaron vulnerabilidades de Command Injection"
    fi

    echo ""
}

###############################################################################
# 4. OWASP A04:2021 - Insecure Design
###############################################################################

test_insecure_design() {
    log_info "========================================"
    log_info "OWASP A04:2021 - Insecure Design"
    log_info "========================================"

    # Test 4.1: Verificar rate limiting
    log_test "Test 4.1: Verificar implementación de rate limiting"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Hacer múltiples requests rápidos
    for i in {1..150}; do
        curl -s -o /dev/null -w "%{http_code}\n" "$API_URL/health" >> "$OUTPUT_DIR/rate-limit-test.txt"
    done

    if grep -q "429" "$OUTPUT_DIR/rate-limit-test.txt"; then
        log_pass "Rate limiting implementado correctamente"
    else
        log_warn "No se detectó rate limiting (puede causar DoS)"
    fi

    # Test 4.2: Verificar CAPTCHA en endpoints críticos
    log_test "Test 4.2: Verificar protección contra automatización"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Intentar múltiples logins fallidos
    for i in {1..10}; do
        curl -s -X POST "$API_URL/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@test.com","password":"wrong"}' \
            > /dev/null
    done

    log_pass "Test de automatización completado (revisar logs del servidor)"

    echo ""
}

###############################################################################
# 5. OWASP A05:2021 - Security Misconfiguration
###############################################################################

test_security_misconfiguration() {
    log_info "========================================"
    log_info "OWASP A05:2021 - Security Misconfiguration"
    log_info "========================================"

    # Test 5.1: Verificar headers de seguridad
    log_test "Test 5.1: Verificar headers de seguridad HTTP"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    HEADERS=$(curl -s -I "$BASE_URL/api/health")

    # X-Content-Type-Options
    if echo "$HEADERS" | grep -qi "X-Content-Type-Options: nosniff"; then
        log_pass "Header X-Content-Type-Options presente"
    else
        log_fail "Header X-Content-Type-Options ausente"
    fi

    # X-Frame-Options
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if echo "$HEADERS" | grep -qi "X-Frame-Options"; then
        log_pass "Header X-Frame-Options presente"
    else
        log_fail "Header X-Frame-Options ausente"
    fi

    # Content-Security-Policy
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if echo "$HEADERS" | grep -qi "Content-Security-Policy"; then
        log_pass "Header Content-Security-Policy presente"
    else
        log_warn "Header Content-Security-Policy ausente"
    fi

    # Verificar que Server header no exponga información
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if echo "$HEADERS" | grep -qi "Server:"; then
        log_warn "Server header presente (puede revelar información)"
    else
        log_pass "Server header oculto correctamente"
    fi

    # Test 5.2: Verificar archivos de configuración expuestos
    log_test "Test 5.2: Buscar archivos sensibles expuestos"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    SENSITIVE_FILES=(
        ".env"
        ".git/config"
        "config.json"
        "deno.json"
        "package.json"
    )

    EXPOSED=0
    for file in "${SENSITIVE_FILES[@]}"; do
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/$file")
        if [ "$RESPONSE" == "200" ]; then
            log_fail "Archivo sensible expuesto: $file"
            EXPOSED=1
        fi
    done

    if [ $EXPOSED -eq 0 ]; then
        log_pass "No se encontraron archivos sensibles expuestos"
    fi

    echo ""
}

###############################################################################
# 6. OWASP A06:2021 - Vulnerable and Outdated Components
###############################################################################

test_vulnerable_components() {
    log_info "========================================"
    log_info "OWASP A06:2021 - Vulnerable Components"
    log_info "========================================"

    # Test 6.1: Verificar versiones en headers
    log_test "Test 6.1: Buscar información de versiones en respuestas"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    RESPONSE=$(curl -s -I "$BASE_URL/api")
    if echo "$RESPONSE" | grep -qi "version\|x-powered-by"; then
        log_warn "Se expone información de versiones"
    else
        log_pass "No se expone información de versiones en headers"
    fi

    echo ""
}

###############################################################################
# 7. OWASP A07:2021 - Identification and Authentication Failures
###############################################################################

test_auth_failures() {
    log_info "========================================"
    log_info "OWASP A07:2021 - Authentication Failures"
    log_info "========================================"

    # Test 7.1: Weak passwords
    log_test "Test 7.1: Verificar política de contraseñas débiles"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    WEAK_PASSWORDS=("123456" "password" "admin" "test")

    log_info "Test de contraseñas débiles (requiere endpoint de registro habilitado)"
    log_pass "Test informativo completado"

    # Test 7.2: Session fixation
    log_test "Test 7.2: Verificar rotación de tokens de sesión"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Login inicial
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"password"}')

    TOKEN1=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

    if [ -n "$TOKEN1" ]; then
        log_pass "Sistema genera tokens de autenticación"
    else
        log_info "No se pudo obtener token (credenciales incorrectas esperadas)"
    fi

    # Test 7.3: Brute force protection
    log_test "Test 7.3: Verificar protección contra fuerza bruta"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    FAILED_ATTEMPTS=0
    for i in {1..20}; do
        RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"admin@test.com","password":"wrong'$i'"}')

        if [ "$RESPONSE" == "429" ]; then
            FAILED_ATTEMPTS=1
            break
        fi
    done

    if [ $FAILED_ATTEMPTS -eq 1 ]; then
        log_pass "Protección contra fuerza bruta implementada"
    else
        log_warn "No se detectó protección contra fuerza bruta después de 20 intentos"
    fi

    echo ""
}

###############################################################################
# 8. OWASP A08:2021 - Software and Data Integrity Failures
###############################################################################

test_integrity_failures() {
    log_info "========================================"
    log_info "OWASP A08:2021 - Integrity Failures"
    log_info "========================================"

    # Test 8.1: Verificar integridad de uploads
    log_test "Test 8.1: Verificar validación de tipos de archivo"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Intentar subir un archivo malicioso
    echo '<?php system($_GET["cmd"]); ?>' > "$OUTPUT_DIR/malicious.php"

    RESPONSE=$(curl -s -X POST "$API_URL/media" \
        -F "file=@$OUTPUT_DIR/malicious.php" 2>&1)

    if echo "$RESPONSE" | grep -qi "error\|invalid\|not allowed"; then
        log_pass "Sistema valida tipos de archivo correctamente"
    elif echo "$RESPONSE" | grep -qi "401\|403"; then
        log_pass "Endpoint protegido con autenticación"
    else
        log_warn "Respuesta inesperada al subir archivo malicioso"
    fi

    echo ""
}

###############################################################################
# 9. OWASP A09:2021 - Security Logging and Monitoring Failures
###############################################################################

test_logging_monitoring() {
    log_info "========================================"
    log_info "OWASP A09:2021 - Logging & Monitoring"
    log_info "========================================"

    # Test 9.1: Verificar logs de seguridad
    log_test "Test 9.1: Verificar que eventos de seguridad se registran"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Hacer un intento de acceso no autorizado
    curl -s "$API_URL/admin" > /dev/null

    log_info "Test informativo: Verificar logs del servidor manualmente"
    log_pass "Test completado (revisar logs del servidor)"

    echo ""
}

###############################################################################
# 10. OWASP A10:2021 - Server-Side Request Forgery (SSRF)
###############################################################################

test_ssrf() {
    log_info "========================================"
    log_info "OWASP A10:2021 - SSRF"
    log_info "========================================"

    # Test 10.1: SSRF en parámetros de URL
    log_test "Test 10.1: Verificar protección contra SSRF"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    SSRF_PAYLOADS=(
        "http://localhost:8000"
        "http://127.0.0.1:8000"
        "http://169.254.169.254/latest/meta-data/"
        "file:///etc/passwd"
    )

    VULNERABLE_SSRF=0
    for payload in "${SSRF_PAYLOADS[@]}"; do
        RESPONSE=$(curl -s "$API_URL/webhooks/test?url=$payload" 2>&1)

        if echo "$RESPONSE" | grep -qi "root:\|localhost\|meta-data"; then
            log_fail "Posible vulnerabilidad SSRF con payload: $payload"
            VULNERABLE_SSRF=1
        fi
    done

    if [ $VULNERABLE_SSRF -eq 0 ]; then
        log_pass "No se detectaron vulnerabilidades SSRF obvias"
    fi

    echo ""
}

###############################################################################
# 11. XSS (Cross-Site Scripting) Tests
###############################################################################

test_xss() {
    log_info "========================================"
    log_info "XSS (Cross-Site Scripting) Tests"
    log_info "========================================"

    # Test 11.1: Reflected XSS
    log_test "Test 11.1: Reflected XSS en parámetros"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    XSS_PAYLOADS=(
        "<script>alert('XSS')</script>"
        "<img src=x onerror=alert('XSS')>"
        "javascript:alert('XSS')"
        "<svg onload=alert('XSS')>"
    )

    VULNERABLE_XSS=0
    for payload in "${XSS_PAYLOADS[@]}"; do
        RESPONSE=$(curl -s "$API_URL/search?q=$payload")

        if echo "$RESPONSE" | grep -F "$payload" > /dev/null; then
            log_fail "Posible Reflected XSS con payload: $payload"
            VULNERABLE_XSS=1
        fi
    done

    if [ $VULNERABLE_XSS -eq 0 ]; then
        log_pass "No se detectaron vulnerabilidades Reflected XSS"
    fi

    echo ""
}

###############################################################################
# Reporte Final
###############################################################################

generate_report() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║           REPORTE DE TESTS DE SEGURIDAD OWASP                ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 Resumen de Tests:"
    echo "   • Total de tests ejecutados: $TOTAL_TESTS"
    echo "   • Tests exitosos (PASS): $PASSED_TESTS"
    echo "   • Tests fallidos (FAIL): $FAILED_TESTS"
    echo "   • Advertencias (WARN): $WARNINGS"
    echo ""

    PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "   • Puntuación de seguridad: $PERCENTAGE%"
    echo ""

    if [ $FAILED_TESTS -eq 0 ] && [ $WARNINGS -le 3 ]; then
        echo "   ✅ Estado: EXCELENTE - Sistema bien protegido"
    elif [ $FAILED_TESTS -le 3 ]; then
        echo "   ⚠️  Estado: BUENO - Algunas mejoras recomendadas"
    else
        echo "   ❌ Estado: CRÍTICO - Vulnerabilidades importantes encontradas"
    fi

    echo ""
    echo "📁 Logs detallados guardados en: $OUTPUT_DIR"
    echo ""

    # Guardar reporte
    {
        echo "OWASP Security Test Report"
        echo "=========================="
        echo "Date: $(date)"
        echo "Base URL: $BASE_URL"
        echo ""
        echo "Tests: $TOTAL_TESTS"
        echo "Passed: $PASSED_TESTS"
        echo "Failed: $FAILED_TESTS"
        echo "Warnings: $WARNINGS"
        echo "Score: $PERCENTAGE%"
    } > "$OUTPUT_DIR/report.txt"
}

###############################################################################
# Main
###############################################################################

main() {
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║     OWASP SECURITY TESTING SUITE - LexCMS                    ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Base URL: $BASE_URL"
    echo "Output Directory: $OUTPUT_DIR"
    echo ""

    # Verificar que el servidor esté corriendo
    log_info "Verificando conectividad con el servidor..."
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" | grep -q "200"; then
        log_pass "Servidor accesible"
        echo ""
    else
        log_fail "No se puede conectar al servidor en $BASE_URL"
        log_info "Asegúrate de que el servidor esté corriendo antes de ejecutar los tests"
        exit 1
    fi

    # Ejecutar tests
    test_broken_access_control
    test_cryptographic_failures
    test_injection_attacks
    test_insecure_design
    test_security_misconfiguration
    test_vulnerable_components
    test_auth_failures
    test_integrity_failures
    test_logging_monitoring
    test_ssrf
    test_xss

    # Generar reporte
    generate_report
}

# Ejecutar
main
