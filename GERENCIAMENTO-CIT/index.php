<?php
/**
 * index.php
 * ---------------------------------------------------------------------
 * Ponto de entrada do Sistema de Agendamento CIT.
 *
 * A página em si é pública (Início, Como Funciona, Calendário,
 * Inteligência, Relatórios e Contato podem ser vistos por qualquer
 * visitante). Apenas a seção "Administração" exige uma sessão de
 * administrador autenticado — essa checagem é feita dentro de
 * includes/main-content.php, com isAuthenticated().
 * ---------------------------------------------------------------------
 */

require_once __DIR__ . '/config.php';

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/main-content.php';
include __DIR__ . '/includes/footer.php';
