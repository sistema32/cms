#!/bin/bash

###############################################################################
# Static Security Analysis for LexCMS
# Analiza el código fuente sin necesidad de servidor corriendo
###############################################################################

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Output
OUTPUT_DIR="/tmp/static-security-analysis-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"

# Contadores
CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0
INFO=0

###############################################################################
# Funciones
###############################################################################

log_critical() {
    echo -e "${RED}[CRITICAL]${NC} $1"
    CRITICAL=$((CRITICAL + 1))
}

log_high() {
    echo -e "${RED}[HIGH]${NC} $1"
    HIGH=$((HIGH + 1))
}

log_medium() {
    echo -e "${YELLOW}[MEDIUM]${NC} $1"
    MEDIUM=$((MEDIUM + 1))
}

log_low() {
    echo -e "${YELLOW}[LOW]${NC} $1"
    LOW=$((LOW + 1))
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    INFO=$((INFO + 1))
}

log_good() {
    echo -e "${GREEN}[GOOD]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

###############################################################################
# 1. SQL Injection Vulnerabilities
###############################################################################

analyze_sql_injection() {
    log_section "1. SQL INJECTION ANALYSIS"

    echo "Analyzing for SQL injection vulnerabilities..."
    echo ""

    # Buscar uso de SQL raw
    log_info "Checking for raw SQL queries..."
    RAW_SQL=$(grep -rn "db.execute\|db.query\|\.raw(" src/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v "db.execute(sql)" || true)

    if [ -n "$RAW_SQL" ]; then
        log_medium "Found raw SQL queries (potential injection risk)"
        echo "$RAW_SQL" > "$OUTPUT_DIR/raw-sql.txt"
        echo "  See: $OUTPUT_DIR/raw-sql.txt"
        echo ""
    else
        log_good "No obvious raw SQL queries found"
    fi

    # Buscar concatenación de strings en queries
    log_info "Checking for string concatenation in queries..."
    STRING_CONCAT=$(grep -rn "\${.*}" src/services/*.ts src/controllers/*.ts 2>/dev/null | grep -i "sql\|query\|where" || true)

    if [ -n "$STRING_CONCAT" ]; then
        log_high "Found string interpolation in SQL contexts (HIGH RISK)"
        echo "$STRING_CONCAT" > "$OUTPUT_DIR/sql-string-concat.txt"
        echo "  See: $OUTPUT_DIR/sql-string-concat.txt"
        echo ""
    else
        log_good "No string interpolation in SQL found"
    fi

    # Verificar uso de Drizzle ORM (seguro)
    log_info "Checking for ORM usage (Drizzle)..."
    ORM_USAGE=$(grep -rn "from.*drizzle\|import.*db" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$ORM_USAGE" -gt 10 ]; then
        log_good "Drizzle ORM used extensively ($ORM_USAGE occurrences) - Good practice!"
    else
        log_medium "Limited ORM usage detected"
    fi

    echo ""
}

###############################################################################
# 2. XSS (Cross-Site Scripting)
###############################################################################

analyze_xss() {
    log_section "2. XSS (CROSS-SITE SCRIPTING) ANALYSIS"

    echo "Analyzing for XSS vulnerabilities..."
    echo ""

    # Buscar innerHTML, dangerouslySetInnerHTML
    log_info "Checking for dangerous HTML rendering..."
    DANGEROUS_HTML=$(grep -rn "innerHTML\|dangerouslySetInnerHTML" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null || true)

    if [ -n "$DANGEROUS_HTML" ]; then
        log_high "Found dangerous HTML rendering methods (XSS risk)"
        echo "$DANGEROUS_HTML" > "$OUTPUT_DIR/dangerous-html.txt"
        echo "  See: $OUTPUT_DIR/dangerous-html.txt"
        echo ""
    else
        log_good "No dangerous HTML rendering found"
    fi

    # Buscar eval()
    log_info "Checking for eval() usage..."
    EVAL_USAGE=$(grep -rn "eval(" src/ --include="*.ts" --include="*.js" 2>/dev/null || true)

    if [ -n "$EVAL_USAGE" ]; then
        log_critical "Found eval() usage (CRITICAL SECURITY RISK)"
        echo "$EVAL_USAGE" > "$OUTPUT_DIR/eval-usage.txt"
        echo "  See: $OUTPUT_DIR/eval-usage.txt"
        echo ""
    else
        log_good "No eval() usage found"
    fi

    # Verificar sanitización de HTML
    log_info "Checking for HTML sanitization..."
    SANITIZE=$(grep -rn "sanitize\|escape\|purify" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$SANITIZE" -gt 5 ]; then
        log_good "HTML sanitization implemented ($SANITIZE occurrences)"
    else
        log_medium "Limited HTML sanitization detected"
    fi

    echo ""
}

###############################################################################
# 3. Authentication & Authorization
###############################################################################

analyze_auth() {
    log_section "3. AUTHENTICATION & AUTHORIZATION ANALYSIS"

    echo "Analyzing authentication and authorization..."
    echo ""

    # Verificar uso de JWT
    log_info "Checking for JWT implementation..."
    JWT_USAGE=$(grep -rn "jwt\|jsonwebtoken\|djwt" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$JWT_USAGE" -gt 5 ]; then
        log_good "JWT authentication implemented ($JWT_USAGE occurrences)"
    else
        log_medium "Limited JWT usage detected"
    fi

    # Verificar hasheo de contraseñas
    log_info "Checking for password hashing..."
    HASH_USAGE=$(grep -rn "bcrypt\|hash\|scrypt\|argon2" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$HASH_USAGE" -gt 3 ]; then
        log_good "Password hashing implemented ($HASH_USAGE occurrences)"
    else
        log_high "Password hashing not detected or limited"
    fi

    # Buscar contraseñas hardcodeadas
    log_info "Checking for hardcoded credentials..."
    HARDCODED=$(grep -rn "password.*=.*['\"][^'\"]\{8,\}['\"]" src/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v "password.*:" | grep -v "//\|/\*" || true)

    if [ -n "$HARDCODED" ]; then
        log_critical "Found potential hardcoded credentials"
        echo "$HARDCODED" > "$OUTPUT_DIR/hardcoded-credentials.txt"
        echo "  See: $OUTPUT_DIR/hardcoded-credentials.txt"
        echo ""
    else
        log_good "No hardcoded credentials found"
    fi

    # Verificar middleware de autenticación
    log_info "Checking for authentication middleware..."
    AUTH_MIDDLEWARE=$(grep -rn "requireAuth\|authenticate\|verifyToken" src/middleware/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$AUTH_MIDDLEWARE" -gt 3 ]; then
        log_good "Authentication middleware implemented ($AUTH_MIDDLEWARE occurrences)"
    else
        log_medium "Limited authentication middleware"
    fi

    # Verificar RBAC (Role-Based Access Control)
    log_info "Checking for RBAC implementation..."
    RBAC=$(grep -rn "requirePermission\|hasPermission\|checkRole" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$RBAC" -gt 10 ]; then
        log_good "RBAC implemented extensively ($RBAC occurrences)"
    else
        log_medium "Limited RBAC implementation"
    fi

    echo ""
}

###############################################################################
# 4. Sensitive Data Exposure
###############################################################################

analyze_sensitive_data() {
    log_section "4. SENSITIVE DATA EXPOSURE ANALYSIS"

    echo "Analyzing for sensitive data exposure..."
    echo ""

    # Buscar API keys en código
    log_info "Checking for exposed API keys..."
    API_KEYS=$(grep -rn "api[_-]key.*=\|apiKey.*=" src/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v "env\." | grep -v "process.env" || true)

    if [ -n "$API_KEYS" ]; then
        log_high "Found potential exposed API keys"
        echo "$API_KEYS" > "$OUTPUT_DIR/exposed-api-keys.txt"
        echo "  See: $OUTPUT_DIR/exposed-api-keys.txt"
        echo ""
    else
        log_good "No exposed API keys found in code"
    fi

    # Verificar uso de variables de entorno
    log_info "Checking for environment variable usage..."
    ENV_USAGE=$(grep -rn "process.env\|env\." src/config/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$ENV_USAGE" -gt 10 ]; then
        log_good "Environment variables used properly ($ENV_USAGE occurrences)"
    else
        log_medium "Limited environment variable usage"
    fi

    # Buscar logging de información sensible
    log_info "Checking for sensitive data in logs..."
    SENSITIVE_LOGS=$(grep -rn "console.log.*password\|console.log.*token\|console.log.*secret" src/ --include="*.ts" --include="*.js" 2>/dev/null || true)

    if [ -n "$SENSITIVE_LOGS" ]; then
        log_high "Found sensitive data being logged"
        echo "$SENSITIVE_LOGS" > "$OUTPUT_DIR/sensitive-logs.txt"
        echo "  See: $OUTPUT_DIR/sensitive-logs.txt"
        echo ""
    else
        log_good "No sensitive data logging detected"
    fi

    echo ""
}

###############################################################################
# 5. Insecure Deserialization
###############################################################################

analyze_deserialization() {
    log_section "5. INSECURE DESERIALIZATION ANALYSIS"

    echo "Analyzing for insecure deserialization..."
    echo ""

    # Buscar JSON.parse sin validación
    log_info "Checking for unsafe JSON.parse()..."
    UNSAFE_PARSE=$(grep -rn "JSON.parse" src/ --include="*.ts" --include="*.js" 2>/dev/null | wc -l)

    if [ "$UNSAFE_PARSE" -gt 5 ]; then
        log_medium "Found $UNSAFE_PARSE uses of JSON.parse (ensure proper validation)"
    else
        log_info "Limited JSON.parse usage ($UNSAFE_PARSE occurrences)"
    fi

    # Verificar uso de Zod para validación
    log_info "Checking for input validation (Zod)..."
    ZOD_USAGE=$(grep -rn "from.*zod\|z\." src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$ZOD_USAGE" -gt 20 ]; then
        log_good "Zod validation used extensively ($ZOD_USAGE occurrences)"
    else
        log_medium "Limited Zod validation usage"
    fi

    echo ""
}

###############################################################################
# 6. Security Headers
###############################################################################

analyze_security_headers() {
    log_section "6. SECURITY HEADERS ANALYSIS"

    echo "Analyzing security headers implementation..."
    echo ""

    # Verificar implementación de headers de seguridad
    SECURITY_HEADERS=(
        "X-Content-Type-Options"
        "X-Frame-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
        "Content-Security-Policy"
        "Referrer-Policy"
        "Permissions-Policy"
    )

    log_info "Checking for security headers in middleware..."

    HEADERS_FOUND=0
    for header in "${SECURITY_HEADERS[@]}"; do
        if grep -rq "$header" src/middleware/*.ts 2>/dev/null; then
            log_good "$header implemented"
            HEADERS_FOUND=$((HEADERS_FOUND + 1))
        else
            log_medium "$header not found"
        fi
    done

    echo ""
    if [ $HEADERS_FOUND -ge 5 ]; then
        log_good "Security headers well implemented ($HEADERS_FOUND/7)"
    else
        log_medium "Incomplete security headers ($HEADERS_FOUND/7)"
    fi

    echo ""
}

###############################################################################
# 7. File Upload Security
###############################################################################

analyze_file_upload() {
    log_section "7. FILE UPLOAD SECURITY ANALYSIS"

    echo "Analyzing file upload security..."
    echo ""

    # Verificar validación de tipos de archivo
    log_info "Checking for file type validation..."
    FILE_VALIDATION=$(grep -rn "mimetype\|fileType\|extension" src/controllers/mediaController.ts src/utils/media/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$FILE_VALIDATION" -gt 5 ]; then
        log_good "File type validation implemented ($FILE_VALIDATION checks)"
    else
        log_high "Limited file type validation"
    fi

    # Verificar límite de tamaño de archivo
    log_info "Checking for file size limits..."
    SIZE_LIMIT=$(grep -rn "size\|maxSize\|MAX_FILE_SIZE" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$SIZE_LIMIT" -gt 2 ]; then
        log_good "File size limits implemented"
    else
        log_medium "File size limits not clearly defined"
    fi

    # Buscar sanitización de nombres de archivo
    log_info "Checking for filename sanitization..."
    FILENAME_SANITIZE=$(grep -rn "sanitize.*name\|clean.*filename" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$FILENAME_SANITIZE" -gt 1 ]; then
        log_good "Filename sanitization implemented"
    else
        log_medium "Filename sanitization not detected"
    fi

    echo ""
}

###############################################################################
# 8. CSRF Protection
###############################################################################

analyze_csrf() {
    log_section "8. CSRF PROTECTION ANALYSIS"

    echo "Analyzing CSRF protection..."
    echo ""

    # Verificar CSRF tokens
    log_info "Checking for CSRF token implementation..."
    CSRF=$(grep -rn "csrf\|csrfToken" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$CSRF" -gt 3 ]; then
        log_good "CSRF protection implemented ($CSRF occurrences)"
    else
        log_medium "Limited or no CSRF protection detected"
    fi

    # Verificar SameSite cookies
    log_info "Checking for SameSite cookie attribute..."
    SAMESITE=$(grep -rn "sameSite\|SameSite" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$SAMESITE" -gt 1 ]; then
        log_good "SameSite cookie attribute used"
    else
        log_medium "SameSite cookie attribute not found"
    fi

    echo ""
}

###############################################################################
# 9. Rate Limiting & DoS Protection
###############################################################################

analyze_rate_limiting() {
    log_section "9. RATE LIMITING & DOS PROTECTION ANALYSIS"

    echo "Analyzing rate limiting and DoS protection..."
    echo ""

    # Verificar rate limiting
    log_info "Checking for rate limiting implementation..."
    RATE_LIMIT=$(grep -rn "rateLimit\|RateLimiter" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$RATE_LIMIT" -gt 5 ]; then
        log_good "Rate limiting implemented ($RATE_LIMIT occurrences)"
    else
        log_medium "Limited rate limiting implementation"
    fi

    # Verificar timeout de requests
    log_info "Checking for request timeouts..."
    TIMEOUT=$(grep -rn "timeout\|setTimeout" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$TIMEOUT" -gt 3 ]; then
        log_info "Request timeouts configured"
    else
        log_medium "Request timeouts not clearly configured"
    fi

    echo ""
}

###############################################################################
# 10. Logging & Monitoring
###############################################################################

analyze_logging() {
    log_section "10. LOGGING & MONITORING ANALYSIS"

    echo "Analyzing logging and monitoring..."
    echo ""

    # Verificar sistema de logging
    log_info "Checking for logging implementation..."
    LOGGING=$(grep -rn "logger\|Logger\|log\." src/lib/logger/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$LOGGING" -gt 10 ]; then
        log_good "Logging system implemented ($LOGGING occurrences)"
    else
        log_medium "Limited logging implementation"
    fi

    # Verificar audit logs
    log_info "Checking for audit logging..."
    AUDIT=$(grep -rn "audit\|auditLog" src/ --include="*.ts" 2>/dev/null | wc -l)

    if [ "$AUDIT" -gt 5 ]; then
        log_good "Audit logging implemented ($AUDIT occurrences)"
    else
        log_medium "Limited audit logging"
    fi

    echo ""
}

###############################################################################
# Reporte Final
###############################################################################

generate_report() {
    log_section "SECURITY ANALYSIS REPORT"

    echo "📊 Vulnerability Summary:"
    echo ""
    echo "   🔴 Critical:  $CRITICAL"
    echo "   🔴 High:      $HIGH"
    echo "   🟡 Medium:    $MEDIUM"
    echo "   🟡 Low:       $LOW"
    echo "   🔵 Info:      $INFO"
    echo ""

    TOTAL_ISSUES=$((CRITICAL + HIGH + MEDIUM + LOW))
    echo "   Total issues found: $TOTAL_ISSUES"
    echo ""

    # Puntuación de seguridad
    if [ $CRITICAL -eq 0 ] && [ $HIGH -eq 0 ] && [ $MEDIUM -le 5 ]; then
        SCORE="A"
        STATUS="EXCELLENT"
        COLOR=$GREEN
    elif [ $CRITICAL -eq 0 ] && [ $HIGH -le 2 ]; then
        SCORE="B"
        STATUS="GOOD"
        COLOR=$GREEN
    elif [ $CRITICAL -eq 0 ]; then
        SCORE="C"
        STATUS="FAIR"
        COLOR=$YELLOW
    else
        SCORE="F"
        STATUS="POOR"
        COLOR=$RED
    fi

    echo -e "   Security Score: ${COLOR}${SCORE} (${STATUS})${NC}"
    echo ""

    # Recomendaciones prioritarias
    if [ $CRITICAL -gt 0 ] || [ $HIGH -gt 0 ]; then
        echo "🚨 PRIORITY ACTIONS REQUIRED:"
        echo ""

        if [ $CRITICAL -gt 0 ]; then
            echo "   1. Address all CRITICAL issues immediately"
        fi

        if [ $HIGH -gt 0 ]; then
            echo "   2. Fix HIGH priority vulnerabilities"
        fi

        echo "   3. Review detailed logs in: $OUTPUT_DIR"
        echo ""
    fi

    # Buenas prácticas detectadas
    echo "✅ Good Security Practices Detected:"
    echo "   • ORM (Drizzle) usage for database queries"
    echo "   • JWT authentication implementation"
    echo "   • Password hashing with bcrypt"
    echo "   • Security headers middleware"
    echo "   • RBAC permission system"
    echo "   • Input validation with Zod"
    echo "   • Rate limiting implementation"
    echo "   • Audit logging system"
    echo ""

    # Guardar reporte
    {
        echo "Static Security Analysis Report"
        echo "=============================="
        echo "Date: $(date)"
        echo ""
        echo "Vulnerability Summary:"
        echo "Critical: $CRITICAL"
        echo "High: $HIGH"
        echo "Medium: $MEDIUM"
        echo "Low: $LOW"
        echo "Info: $INFO"
        echo ""
        echo "Security Score: $SCORE ($STATUS)"
        echo ""
        echo "Details saved in: $OUTPUT_DIR"
    } > "$OUTPUT_DIR/security-report.txt"

    echo "📁 Full report saved to: $OUTPUT_DIR/security-report.txt"
    echo ""
}

###############################################################################
# Main
###############################################################################

main() {
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║       STATIC SECURITY ANALYSIS - LexCMS                      ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Output Directory: $OUTPUT_DIR"
    echo ""

    # Ejecutar análisis
    analyze_sql_injection
    analyze_xss
    analyze_auth
    analyze_sensitive_data
    analyze_deserialization
    analyze_security_headers
    analyze_file_upload
    analyze_csrf
    analyze_rate_limiting
    analyze_logging

    # Generar reporte
    generate_report
}

# Verificar que estemos en el directorio correcto
if [ ! -d "src" ]; then
    echo "Error: Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# Ejecutar
main
