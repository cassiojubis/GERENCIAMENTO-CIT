<?php
/**
 * login.php
 * ---------------------------------------------------------------------
 * Tela de autenticação do administrador do CIT. Todo o restante do
 * sistema (index.php) exige uma sessão autenticada; esta é a única
 * porta de entrada.
 * ---------------------------------------------------------------------
 */

require_once __DIR__ . '/config.php';

// Se já existe sessão válida, não faz sentido mostrar o login de novo.
if (isAuthenticated()) {
    header('Location: index.php#admin');
    exit;
}

$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Validação do token CSRF do formulário
    if (!csrfValidate($_POST['csrf_token'] ?? null)) {
        $erro = 'Sessão do formulário expirada. Tente novamente.';
    } else {
        // Sanitiza e valida as entradas do formulário
        $usuario = trim((string) ($_POST['usuario'] ?? ''));
        $senha   = (string) ($_POST['senha'] ?? '');

        if ($usuario === '' || $senha === '') {
            $erro = 'Informe usuário e senha para continuar.';
        } elseif (
            hash_equals(ADMIN_USERNAME, $usuario) &&
            password_verify($senha, ADMIN_PASSWORD_HASH)
        ) {
            // Credenciais corretas: renova o ID de sessão (evita session
            // fixation) e marca o administrador como autenticado.
            session_regenerate_id(true);
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['admin_usuario'] = $usuario;

            header('Location: index.php#admin');
            exit;
        } else {
            $erro = 'Usuário ou senha inválidos.';
        }
    }
}
?>
<!doctype html>
<html lang="pt-BR" class="h-full">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Entrar · <?= e(SITE_TITLE) ?></title>
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="h-full bg-gray-50 text-gray-800 min-h-screen flex items-center justify-center px-4">

<div class="w-full max-w-md">
    <div class="text-center mb-6">
        <div class="gradient-ifro w-14 h-14 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-3">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        </div>
        <h1 class="text-2xl font-black text-gray-800"><?= e(SITE_TITLE) ?></h1>
        <p class="text-sm text-gray-600 font-medium"><?= e(INSTITUTION_NAME) ?> · Acesso restrito ao administrador</p>
    </div>

    <div class="bg-white rounded-2xl p-8 border-2 border-green-200 shadow-lg">
        <?php if ($erro !== ''): ?>
            <div class="mb-4 p-3 rounded-lg bg-red-50 border-2 border-red-200 text-sm text-red-700 font-semibold">
                <?= e($erro) ?>
            </div>
        <?php endif; ?>

        <form method="post" action="login.php" novalidate>
            <input type="hidden" name="csrf_token" value="<?= e(csrfToken()) ?>">

            <div class="mb-4">
                <label for="usuario" class="block text-sm font-bold text-gray-700 mb-2">Usuário</label>
                <input type="text" id="usuario" name="usuario" required autofocus
                       class="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium">
            </div>

            <div class="mb-6">
                <label for="senha" class="block text-sm font-bold text-gray-700 mb-2">Senha</label>
                <input type="password" id="senha" name="senha" required
                       class="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium">
            </div>

            <button type="submit" class="w-full gradient-ifro text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all text-lg">
                Entrar
            </button>
        </form>
    </div>

    <p class="text-center text-xs text-gray-500 mt-6">
        Protótipo acadêmico — acesso exclusivo  para servidores e gestores da Coordenação do CIT.
    </p>
</div>

</body>
</html>
