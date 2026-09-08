<?php
/**
 * config.php
 * ---------------------------------------------------------------------
 * Configuração central do Sistema de Agendamento CIT.
 *
 * Responsabilidades deste arquivo:
 *   1. Iniciar a sessão PHP com opções de segurança básicas.
 *   2. Definir constantes de configuração do site (nome, contatos).
 *   3. Definir as credenciais do administrador (login único, protótipo).
 *   4. Fornecer funções auxiliares de autenticação usadas por todas as
 *      páginas restritas (isAuthenticated, requireLogin) e de apoio
 *      (e(), csrfToken(), csrfValidate()).
 *
 * Este arquivo deve ser incluído no topo de TODA página do sistema,
 * antes de qualquer saída HTML, pois configura a sessão e pode
 * redirecionar (header()) quando o acesso não é autorizado.
 * ---------------------------------------------------------------------
 */

// ------------------------------------------------------------------
// 1. Sessão: configurações de segurança aplicadas antes de iniciar
// ------------------------------------------------------------------
if (session_status() === PHP_SESSION_NONE) {
    // Impede acesso ao cookie de sessão via JavaScript (mitiga XSS)
    ini_set('session.cookie_httponly', '1');
    // Cookie de sessão só é reenviado em requisições de mesmo site (mitiga CSRF)
    ini_set('session.cookie_samesite', 'Lax');
    // Em produção com HTTPS, habilite a linha abaixo:
    // ini_set('session.cookie_secure', '1');

    session_start();
}

// ------------------------------------------------------------------
// 2. Configurações gerais exibidas na interface
// ------------------------------------------------------------------
define('SITE_TITLE', 'Sistema de Agendamento CIT');
// Mesmos valores usados como fallback em assets/js/script.js (defaultConfig),
// para que o HTML gerado pelo PHP já nasça idêntico ao que o JS aplicaria.
define('INSTITUTION_NAME', 'Instituto Federal de Rondônia');
define('CONTACT_EMAIL', 'cit@ifro.edu.br');
define('CONTACT_PHONE', '(69) 3211-0000');

// ------------------------------------------------------------------
// 3. Credenciais do administrador
// ------------------------------------------------------------------
// Protótipo acadêmico: credencial única e fixa, com senha em hash.
// Em um ambiente de produção, isso deve vir de uma tabela de usuários
// no banco de dados, nunca de uma constante no código-fonte.
define('ADMIN_USERNAME', 'admin');
// Hash bcrypt da senha "cit@2025", gerado com password_hash().
define('ADMIN_PASSWORD_HASH', '$2y$10$2qwXDIK.nFfzizH8m0d/..xV7hCdgDYeIWP7/AiqZywIFRKr.Chny');

// ------------------------------------------------------------------
// 4. Funções auxiliares
// ------------------------------------------------------------------

/**
 * Escapa uma string para saída segura em HTML (evita XSS).
 */
function e(string $valor): string
{
    return htmlspecialchars($valor, ENT_QUOTES, 'UTF-8');
}

/**
 * Verifica se existe uma sessão de administrador autenticada.
 */
function isAuthenticated(): bool
{
    return !empty($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

/**
 * Bloqueia o acesso à página atual caso não haja administrador logado,
 * redirecionando para a tela de login. Deve ser chamada logo após
 * incluir este arquivo, no topo de toda página restrita.
 */
function requireLogin(): void
{
    if (!isAuthenticated()) {
        header('Location: login.php');
        exit;
    }
}

/**
 * Gera (ou reaproveita) um token CSRF para o formulário de login,
 * guardado na sessão do usuário.
 */
function csrfToken(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Valida um token CSRF recebido de um formulário contra o valor
 * guardado na sessão, usando comparação resistente a timing attacks.
 */
function csrfValidate(?string $tokenRecebido): bool
{
    return is_string($tokenRecebido)
        && !empty($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $tokenRecebido);
}
