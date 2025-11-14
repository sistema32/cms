#!/bin/bash

###############################################################################
# SQL Injection Testing Suite (similar a SQLMap)
# Tests exhaustivos de SQL Injection
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
BASE_URL="${BASE_URL:-http://localhost:8000}"
API_URL="$BASE_URL/api"
OUTPUT_DIR="/tmp/sqlmap-tests-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"

# Contadores
TOTAL_TESTS=0
VULNERABILITIES_FOUND=0

###############################################################################
# SQL Injection Payloads
###############################################################################

# Boolean-based blind SQL injection
BOOLEAN_PAYLOADS=(
    "1' AND '1'='1"
    "1' AND '1'='2"
    "1 AND 1=1"
    "1 AND 1=2"
    "' OR '1'='1"
    "' OR '1'='2"
    "admin' OR '1'='1'--"
    "admin' OR '1'='2'--"
)

# Error-based SQL injection
ERROR_PAYLOADS=(
    "'"
    "''"
    "1'"
    "'1"
    "1' OR '1"
    "' OR 1=1--"
    "'; WAITFOR DELAY '00:00:05'--"
    "1'; SELECT SLEEP(5)--"
    "1' AND SLEEP(5)--"
    "1' AND BENCHMARK(10000000,MD5('A'))--"
)

# UNION-based SQL injection
UNION_PAYLOADS=(
    "1' UNION SELECT NULL--"
    "1' UNION SELECT NULL,NULL--"
    "1' UNION SELECT NULL,NULL,NULL--"
    "1' UNION SELECT NULL,NULL,NULL,NULL--"
    "1' UNION SELECT 1,2,3--"
    "1' UNION SELECT table_name,NULL,NULL FROM information_schema.tables--"
    "1' UNION SELECT column_name,NULL,NULL FROM information_schema.columns--"
)

# Stacked queries
STACKED_PAYLOADS=(
    "1'; DROP TABLE users--"
    "1'; INSERT INTO users VALUES('hacker','pass')--"
    "1'; UPDATE users SET password='hacked' WHERE id=1--"
)

# Time-based blind SQL injection
TIME_PAYLOADS=(
    "1' AND SLEEP(5)--"
    "1' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--"
    "1'; WAITFOR DELAY '00:00:05'--"
    "1' AND IF(1=1,SLEEP(5),0)--"
)

# SQLite specific
SQLITE_PAYLOADS=(
    "1' AND SQLITE_VERSION()='3"
    "1' UNION SELECT sql FROM sqlite_master--"
    "1' UNION SELECT name FROM sqlite_master WHERE type='table'--"
    "1' AND SUBSTR((SELECT sql FROM sqlite_master LIMIT 1),1,1)='C'--"
)

# PostgreSQL specific
POSTGRES_PAYLOADS=(
    "1' AND 1=CAST(version() AS int)--"
    "1' UNION SELECT NULL,version()--"
    "1' AND 1=(SELECT COUNT(*) FROM pg_tables)--"
)

###############################################################################
# Funciones
###############################################################################

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_vulnerable() {
    echo -e "${RED}[VULNERABLE]${NC} $1"
    VULNERABILITIES_FOUND=$((VULNERABILITIES_FOUND + 1))
}

log_safe() {
    echo -e "${GREEN}[SAFE]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

###############################################################################
# Test de inyección SQL en endpoints
###############################################################################

test_endpoint() {
    local endpoint=$1
    local param=$2
    local method=${3:-GET}

    log_info "Testing endpoint: $endpoint with parameter: $param"
    echo ""

    # Test 1: Boolean-based blind
    log_test "Boolean-based blind SQL injection..."
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    for payload in "${BOOLEAN_PAYLOADS[@]}"; do
        if [ "$method" == "GET" ]; then
            RESPONSE=$(curl -s "$endpoint?$param=$payload" 2>&1)
        else
            RESPONSE=$(curl -s -X POST "$endpoint" -H "Content-Type: application/json" \
                -d "{\"$param\":\"$payload\"}" 2>&1)
        fi

        # Buscar indicadores de vulnerabilidad
        if echo "$RESPONSE" | grep -qi "syntax error\|sql syntax\|unclosed quotation\|mysql_fetch"; then
            log_vulnerable "Boolean-based blind vulnerability detected with payload: $payload"
            echo "Endpoint: $endpoint" >> "$OUTPUT_DIR/vulnerabilities.txt"
            echo "Parameter: $param" >> "$OUTPUT_DIR/vulnerabilities.txt"
            echo "Payload: $payload" >> "$OUTPUT_DIR/vulnerabilities.txt"
            echo "Response: $RESPONSE" >> "$OUTPUT_DIR/vulnerabilities.txt"
            echo "---" >> "$OUTPUT_DIR/vulnerabilities.txt"
            break
        fi
    done

    # Test 2: Error-based
    log_test "Error-based SQL injection..."
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    FOUND_ERROR=0
    for payload in "${ERROR_PAYLOADS[@]}"; do
        if [ "$method" == "GET" ]; then
            RESPONSE=$(curl -s "$endpoint?$param=$payload" 2>&1)
        else
            RESPONSE=$(curl -s -X POST "$endpoint" -H "Content-Type: application/json" \
                -d "{\"$param\":\"$payload\"}" 2>&1)
        fi

        # Buscar mensajes de error SQL
        if echo "$RESPONSE" | grep -Eqi "sql|syntax|database|mysql|sqlite|postgres|oracle|mssql|driver"; then
            log_vulnerable "Error-based vulnerability detected with payload: $payload"
            echo "Error response: $RESPONSE" >> "$OUTPUT_DIR/error-based-vulnerabilities.txt"
            FOUND_ERROR=1
            break
        fi
    done

    if [ $FOUND_ERROR -eq 0 ]; then
        log_safe "No error-based vulnerabilities detected"
    fi

    # Test 3: UNION-based
    log_test "UNION-based SQL injection..."
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    FOUND_UNION=0
    for payload in "${UNION_PAYLOADS[@]}"; do
        if [ "$method" == "GET" ]; then
            RESPONSE=$(curl -s "$endpoint?$param=$payload" 2>&1)
            RESPONSE_LEN=${#RESPONSE}
        else
            RESPONSE=$(curl -s -X POST "$endpoint" -H "Content-Type: application/json" \
                -d "{\"$param\":\"$payload\"}" 2>&1)
            RESPONSE_LEN=${#RESPONSE}
        fi

        # Si la respuesta es significativamente diferente, puede ser vulnerable
        if [ $RESPONSE_LEN -gt 500 ]; then
            log_vulnerable "Possible UNION-based vulnerability with payload: $payload"
            echo "Union payload: $payload" >> "$OUTPUT_DIR/union-based-vulnerabilities.txt"
            echo "Response length: $RESPONSE_LEN" >> "$OUTPUT_DIR/union-based-vulnerabilities.txt"
            FOUND_UNION=1
            break
        fi
    done

    if [ $FOUND_UNION -eq 0 ]; then
        log_safe "No UNION-based vulnerabilities detected"
    fi

    # Test 4: Time-based blind
    log_test "Time-based blind SQL injection (esto puede tardar)..."
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    FOUND_TIME=0
    for payload in "${TIME_PAYLOADS[@]:0:2}"; do  # Solo primeros 2 para no tardar mucho
        START_TIME=$(date +%s)

        if [ "$method" == "GET" ]; then
            curl -s -m 10 "$endpoint?$param=$payload" > /dev/null 2>&1
        else
            curl -s -m 10 -X POST "$endpoint" -H "Content-Type: application/json" \
                -d "{\"$param\":\"$payload\"}" > /dev/null 2>&1
        fi

        END_TIME=$(date +%s)
        ELAPSED=$((END_TIME - START_TIME))

        if [ $ELAPSED -ge 5 ]; then
            log_vulnerable "Time-based blind vulnerability detected (delay: ${ELAPSED}s) with payload: $payload"
            echo "Time-based payload: $payload" >> "$OUTPUT_DIR/time-based-vulnerabilities.txt"
            echo "Delay: ${ELAPSED}s" >> "$OUTPUT_DIR/time-based-vulnerabilities.txt"
            FOUND_TIME=1
            break
        fi
    done

    if [ $FOUND_TIME -eq 0 ]; then
        log_safe "No time-based blind vulnerabilities detected"
    fi

    # Test 5: SQLite specific (si se detecta SQLite)
    log_test "Database-specific SQL injection (SQLite)..."
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    FOUND_SQLITE=0
    for payload in "${SQLITE_PAYLOADS[@]}"; do
        if [ "$method" == "GET" ]; then
            RESPONSE=$(curl -s "$endpoint?$param=$payload" 2>&1)
        else
            RESPONSE=$(curl -s -X POST "$endpoint" -H "Content-Type: application/json" \
                -d "{\"$param\":\"$payload\"}" 2>&1)
        fi

        if echo "$RESPONSE" | grep -qi "sqlite\|sqlite_master"; then
            log_vulnerable "SQLite-specific vulnerability detected with payload: $payload"
            echo "SQLite payload: $payload" >> "$OUTPUT_DIR/sqlite-vulnerabilities.txt"
            FOUND_SQLITE=1
            break
        fi
    done

    if [ $FOUND_SQLITE -eq 0 ]; then
        log_safe "No SQLite-specific vulnerabilities detected"
    fi

    echo ""
}

###############################################################################
# Tests por endpoint
###############################################################################

test_all_endpoints() {
    log_info "=========================================="
    log_info "Testing Common Endpoints"
    log_info "=========================================="
    echo ""

    # Endpoint 1: Search/Query endpoints
    log_info "1. Testing search endpoint"
    test_endpoint "$API_URL/search" "q" "GET"

    # Endpoint 2: Content endpoints
    log_info "2. Testing content endpoint"
    test_endpoint "$API_URL/content" "id" "GET"

    # Endpoint 3: Users endpoint
    log_info "3. Testing users endpoint"
    test_endpoint "$API_URL/users" "id" "GET"

    # Endpoint 4: Categories endpoint
    log_info "4. Testing categories endpoint"
    test_endpoint "$API_URL/categories" "id" "GET"

    # Endpoint 5: Tags endpoint
    log_info "5. Testing tags endpoint"
    test_endpoint "$API_URL/tags" "name" "GET"

    # Endpoint 6: Login endpoint (POST)
    log_info "6. Testing login endpoint"
    test_endpoint "$API_URL/auth/login" "email" "POST"
}

###############################################################################
# Análisis de código fuente
###############################################################################

analyze_source_code() {
    log_info "=========================================="
    log_info "Analyzing Source Code for SQL Patterns"
    log_info "=========================================="
    echo ""

    # Buscar uso directo de SQL en el código
    log_test "Searching for raw SQL queries in source code..."

    if [ -d "src" ]; then
        # Buscar patrones peligrosos
        DANGEROUS_PATTERNS=(
            "db.execute.*\\\$"
            "db.query.*\\\$"
            "sql.*\\\$"
            ".raw("
            "db.raw("
        )

        for pattern in "${DANGEROUS_PATTERNS[@]}"; do
            MATCHES=$(grep -r "$pattern" src/ --include="*.ts" --include="*.js" 2>/dev/null || true)
            if [ -n "$MATCHES" ]; then
                log_vulnerable "Found potentially unsafe SQL pattern: $pattern"
                echo "$MATCHES" >> "$OUTPUT_DIR/unsafe-sql-patterns.txt"
            fi
        done

        # Buscar uso de prepared statements (bueno)
        SAFE_PATTERNS=$(grep -r "db.prepare\|db.query.*?" src/ --include="*.ts" --include="*.js" 2>/dev/null | wc -l)
        if [ "$SAFE_PATTERNS" -gt 0 ]; then
            log_safe "Found $SAFE_PATTERNS uses of parameterized queries (good)"
        fi
    fi

    echo ""
}

###############################################################################
# Reporte Final
###############################################################################

generate_final_report() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║        SQL INJECTION TESTING REPORT (SQLMap-style)           ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 Test Summary:"
    echo "   • Total tests executed: $TOTAL_TESTS"
    echo "   • Vulnerabilities found: $VULNERABILITIES_FOUND"
    echo ""

    if [ $VULNERABILITIES_FOUND -eq 0 ]; then
        echo "   ✅ Status: SECURE"
        echo "   No SQL injection vulnerabilities detected."
    elif [ $VULNERABILITIES_FOUND -le 2 ]; then
        echo "   ⚠️  Status: VULNERABLE"
        echo "   Found $VULNERABILITIES_FOUND potential SQL injection vulnerabilities."
        echo "   Review the detailed logs for remediation steps."
    else
        echo "   ❌ Status: CRITICAL"
        echo "   Found $VULNERABILITIES_FOUND SQL injection vulnerabilities!"
        echo "   IMMEDIATE ACTION REQUIRED"
    fi

    echo ""
    echo "📁 Detailed logs saved in: $OUTPUT_DIR"
    echo ""

    # Recomendaciones
    if [ $VULNERABILITIES_FOUND -gt 0 ]; then
        echo "🔧 Remediation Recommendations:"
        echo "   1. Use parameterized queries (prepared statements) ALWAYS"
        echo "   2. Use ORM (like Drizzle) with proper type safety"
        echo "   3. Validate and sanitize all user inputs"
        echo "   4. Apply principle of least privilege for database users"
        echo "   5. Use Web Application Firewall (WAF)"
        echo "   6. Implement input validation at application layer"
        echo ""
    fi

    # Guardar reporte
    {
        echo "SQL Injection Testing Report"
        echo "============================"
        echo "Date: $(date)"
        echo "Base URL: $BASE_URL"
        echo ""
        echo "Total Tests: $TOTAL_TESTS"
        echo "Vulnerabilities: $VULNERABILITIES_FOUND"
        echo ""
        if [ $VULNERABILITIES_FOUND -gt 0 ]; then
            echo "VULNERABILITIES FOUND - See logs for details"
        else
            echo "NO VULNERABILITIES DETECTED"
        fi
    } > "$OUTPUT_DIR/sqlinjection-report.txt"
}

###############################################################################
# Main
###############################################################################

main() {
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║     SQL INJECTION TESTING SUITE (SQLMap-style)               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Base URL: $BASE_URL"
    echo "Output Directory: $OUTPUT_DIR"
    echo ""

    # Verificar conectividad
    log_info "Checking server connectivity..."
    if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" | grep -q "200"; then
        log_safe "Server is accessible"
        echo ""
    else
        log_vulnerable "Cannot connect to server at $BASE_URL"
        log_info "Make sure the server is running before executing tests"
        exit 1
    fi

    # Ejecutar tests
    test_all_endpoints
    analyze_source_code

    # Generar reporte
    generate_final_report
}

# Ejecutar
main
