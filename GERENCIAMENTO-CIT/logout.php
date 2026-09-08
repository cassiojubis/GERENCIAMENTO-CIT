<?php
/**
 * logout.php
 * ---------------------------------------------------------------------
 * Encerra a sessão do administrador e retorna para a tela de login.
 * ---------------------------------------------------------------------
 */

require_once __DIR__ . '/config.php';

// Limpa todas as variáveis de sessão e destrói a sessão no servidor.
$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $parametros = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $parametros['path'],
        $parametros['domain'],
        $parametros['secure'],
        $parametros['httponly']
    );
}
session_destroy();

header('Location: index.php');
exit;
