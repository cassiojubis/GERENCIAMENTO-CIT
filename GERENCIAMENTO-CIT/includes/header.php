<?php
/**
 * includes/header.php
 * ---------------------------------------------------------------------
 * Cabeçalho comum a todas as páginas restritas do sistema: metadados
 * do documento, folha de estilos e barra de navegação superior.
 *
 * Pressupõe que config.php já foi incluído (usa e(), INSTITUTION_NAME,
 * SITE_TITLE e $_SESSION['admin_usuario']) e que requireLogin() já foi
 * chamado pela página que faz o include.
 * ---------------------------------------------------------------------
 */
?>
<!doctype html>
<html lang="pt-BR" class="h-full">
 <head><meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e(SITE_TITLE) ?> IFRO</title>
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
  </head>
 <body class="h-full bg-gray-50 text-gray-800 overflow-auto">
  <div class="w-full min-h-full">
   <!-- Navigation -->
   <nav class="bg-white shadow-md sticky top-0 z-50 border-b-4 border-green-600">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
     <div class="flex justify-between items-center h-16">
      <div class="flex items-center gap-3">
       <div class="gradient-ifro w-12 h-12 rounded-lg flex items-center justify-center shadow-lg">
        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewbox="0 0 24 24">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
       </div>
       <div>
        <span id="nav-title" class="font-bold text-lg text-gray-800">CIT IFRO</span> <span id="nav-institution" class="text-xs text-green-600 font-semibold block"><?= e(INSTITUTION_NAME) ?></span>
       </div>
      </div>
      <div class="hidden md:flex items-center gap-1">
       <a href="#inicio" class="nav-link px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50">Início</a> <a href="#como-funciona" class="nav-link px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50">Como Funciona</a> <a href="#calendario" class="nav-link px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50">Calendário</a> <a href="#inteligencia" class="nav-link px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50">IA</a> <a href="#relatorios" class="nav-link px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50">Relatórios</a> <a href="#contato" class="nav-link px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50">Contato</a> <a href="#admin" class="nav-link px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50">Administração</a>
       <span class="mx-2 h-5 border-l border-gray-200"></span>
       <?php if (isAuthenticated()): ?>
       <span class="px-3 py-2 text-xs text-gray-400 font-medium">Olá, <?= e($_SESSION['admin_usuario'] ?? 'admin') ?></span>
       <a href="logout.php" class="nav-link px-3 py-2 text-sm font-bold text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50">Sair</a>
       <?php else: ?>
       <a href="login.php" class="nav-link px-3 py-2 text-sm font-bold text-green-700 hover:text-green-800 rounded-lg hover:bg-green-50">Entrar</a>
       <?php endif; ?>
      </div><button onclick="toggleMobileMenu()" class="md:hidden p-2 rounded-lg hover:bg-gray-100">
       <svg class="w-6 h-6" fill="none" stroke="currentColor" viewbox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
       </svg></button>
     </div>
    </div><!-- Mobile Menu -->
    <div id="mobile-menu" class="hidden md:hidden bg-white border-t border-gray-200 px-4 py-3">
     <a href="#inicio" class="block py-2 text-gray-600 hover:text-green-600">Início</a> <a href="#como-funciona" class="block py-2 text-gray-600 hover:text-green-600">Como Funciona</a> <a href="#calendario" class="block py-2 text-gray-600 hover:text-green-600">Calendário</a> <a href="#inteligencia" class="block py-2 text-gray-600 hover:text-green-600">Inteligência</a> <a href="#relatorios" class="block py-2 text-gray-600 hover:text-green-600">Relatórios</a> <a href="#contato" class="block py-2 text-gray-600 hover:text-green-600">Contato</a> <a href="#admin" class="block py-2 text-gray-600 hover:text-green-600">Administração</a>
     <div class="border-t border-gray-200 mt-2 pt-2">
      <?php if (isAuthenticated()): ?>
      <a href="logout.php" class="block py-2 text-red-600 font-bold hover:text-red-700">Sair (<?= e($_SESSION['admin_usuario'] ?? 'admin') ?>)</a>
      <?php else: ?>
      <a href="login.php" class="block py-2 text-green-700 font-bold hover:text-green-800">Entrar (administração)</a>
      <?php endif; ?>
     </div>
    </div>
   </nav>
