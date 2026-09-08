# Sistema de Agendamento CIT — versão PHP com login

Conversão do protótipo estático (HTML/CSS/JS) para uma estrutura PHP com
autenticação de administrador por sessão. Nenhuma cor, texto ou
comportamento visual foi alterado — apenas a organização do código e a
proteção de acesso.

## Como rodar localmente

Requer PHP 7.4+ (testado em PHP 8.3).

```bash
cd GERENCIAMENTO-CIT-php
php -S localhost:8000
```

Acesse `http://localhost:8000/index.php` no navegador. Como não há
sessão ainda, você será redirecionado automaticamente para
`login.php`.

Também funciona em XAMPP/WAMP: copie a pasta para `htdocs`
(ou `www`) e acesse `http://localhost/GERENCIAMENTO-CIT-php/`.

## Credenciais de administrador (protótipo)

| Usuário | Senha     |
|---------|-----------|
| `admin` | `cit@2025`|

Definidas em `config.php` (`ADMIN_USERNAME` e `ADMIN_PASSWORD_HASH`,
este último já em formato de hash bcrypt). Em um ambiente real, troque
por uma tabela de usuários no banco de dados.

## Estrutura de arquivos

```
config.php              Sessão, constantes do site e funções de autenticação
login.php                Tela de login (com proteção CSRF)
logout.php                Encerra a sessão
index.php                 Página principal (protegida — exige login)
includes/
  header.php               <head>, folha de estilos e barra de navegação
  main-content.php          Todas as seções (Início, Calendário, Admin, Relatórios, Contato)
  footer.php                Rodapé, modais, toast e carregamento do script.js
assets/
  css/style.css              Estilos complementares ao Tailwind (CDN)
  js/script.js                 Toda a lógica de interface (localStorage)
```

## O que mudou em relação ao protótipo original

- HTML único (`index.html`) dividido em `header.php` / `main-content.php`
  / `footer.php`, incluídos por `index.php`.
- Acesso a `index.php` agora exige uma sessão de administrador válida
  (`requireLogin()` em `config.php`); sem login, o usuário é
  redirecionado para `login.php`.
- Nome da instituição, e-mail e telefone de contato agora vêm de
  constantes em `config.php`, repassadas ao JavaScript via
  `window.SERVER_CONFIG` (gerado em `footer.php`).
- Comentários adicionados em todos os arquivos PHP, JS e CSS,
  explicando a função de cada bloco.
- Validação de entrada e proteção CSRF no formulário de login.

## O que continua igual

- Toda a interatividade (calendário, agendamentos, aprovação/recusa,
  equipamentos, relatórios, permissões de demonstração) continua
  client-side, usando `localStorage` — exatamente como no protótipo
  original. Persistir esses dados em um banco de dados real é o
  próximo passo natural do projeto, mas está fora do escopo desta
  conversão (que tratou apenas de estrutura PHP + login).
