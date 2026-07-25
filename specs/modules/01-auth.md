# Módulo 1 — Autenticação e Autorização

**Status:** `draft`
**Depende de:** nenhum
**API correspondente:** [`AlocacaoDeSalas-API/specs/modules/01-auth.md`](../../../AlocacaoDeSalas-API/specs/modules/01-auth.md)

---

## Visão Geral

Controla o acesso à aplicação. Inclui as telas de login, recuperação de senha e redefinição de senha. Gerencia o ciclo de vida do token JWT (refresh automático, logout). Expõe informações do usuário autenticado para toda a aplicação via `useAuthStore`.

---

## Estrutura do Módulo

```
modules/auth/
├── views/
│   ├── LoginView.vue
│   ├── ForgotPasswordView.vue
│   └── ResetPasswordView.vue
├── components/
│   └── AuthCard.vue          # Container visual compartilhado entre as views de auth
├── services/
│   └── auth.service.ts       # Funções HTTP: login, logout, refresh, forgotPassword, resetPassword
└── index.ts                  # Exporta authRoutes
```

---

## Rotas

| Path | View | Layout | Roles |
|------|------|--------|-------|
| `/login` | `LoginView` | `AuthLayout` | público |
| `/forgot-password` | `ForgotPasswordView` | `AuthLayout` | público |
| `/reset-password` | `ResetPasswordView` | `AuthLayout` | público |

Rotas públicas (`requiresAuth: false`). Se o usuário já está autenticado e acessa `/login`, é redirecionado para a home do seu role.

---

## 1.1 Tela de Login (`LoginView`)

### Layout

- Centralizado verticalmente e horizontalmente (`AuthLayout`)
- Logo/nome da aplicação no topo
- Formulário com campos de e-mail e senha
- Link "Esqueci minha senha" abaixo do botão

### Campos do formulário

| Campo | Tipo | Validação |
|-------|------|-----------|
| `email` | email | obrigatório, formato e-mail |
| `password` | password | obrigatório, mín. 8 caracteres |

### Comportamento

1. Usuário preenche e-mail e senha e clica em "Entrar"
2. Exibe loading no botão durante a requisição
3. Sucesso: chama `authStore.setAuth(user, accessToken)`, salva `refreshToken` no localStorage, redireciona para a home do role (ou `route.query.redirect`)
4. Erro `INVALID_CREDENTIALS`: exibe mensagem "E-mail ou senha incorretos" abaixo do formulário
5. Erro `ACCOUNT_INACTIVE`: exibe mensagem "Sua conta está inativa. Contate o administrador."
6. Erro de rede/servidor: exibe toast de erro genérico

### Chamada à API

```
POST /auth/login
Body: { email, password }
```

---

## 1.2 Tela de Recuperação de Senha (`ForgotPasswordView`)

### Layout

- Mesmo `AuthLayout` do login
- Instrução textual sobre o processo
- Campo de e-mail
- Botão "Enviar" e link "Voltar para login"

### Campos do formulário

| Campo | Tipo | Validação |
|-------|------|-----------|
| `email` | email | obrigatório, formato e-mail |

### Comportamento

1. Usuário informa o e-mail e clica em "Enviar"
2. Exibe loading no botão
3. Sucesso: exibe mensagem de confirmação "Se o e-mail estiver cadastrado, você receberá as instruções." (não revelar se o e-mail existe — mesma regra da API)
4. Após sucesso, o formulário é substituído pela mensagem de confirmação
5. Erro de validação: exibe inline

> **Nota MVP:** A API retorna o `resetToken` na response. No ambiente de desenvolvimento, exibir esse token em tela (em um bloco de código ou alerta) para facilitar o teste sem e-mail real.

### Chamada à API

```
POST /auth/forgot-password
Body: { email }
```

---

## 1.3 Tela de Redefinição de Senha (`ResetPasswordView`)

### Layout

- Mesmo `AuthLayout`
- Campos de nova senha e confirmação de senha
- Link "Voltar para login"

### Campos do formulário

| Campo | Tipo | Validação |
|-------|------|-----------|
| `newPassword` | password | obrigatório, mín. 8 caracteres |
| `confirmPassword` | password | obrigatório, deve ser igual a `newPassword` |

O `resetToken` é lido do query param `?token=` da URL.

### Comportamento

1. Ao montar, verifica se `?token=` está presente; se não, redireciona para `/forgot-password`
2. Usuário preenche nova senha, confirma e clica em "Redefinir senha"
3. Sucesso: exibe mensagem "Senha redefinida com sucesso" e redireciona para `/login` após 2 segundos
4. Erro `TOKEN_INVALID`: exibe mensagem "Token inválido ou expirado. Solicite um novo link."
5. Erro de validação de campos: exibe inline

### Chamada à API

```
POST /auth/reset-password
Body: { resetToken, newPassword }
```

---

## 1.4 Logout

Não tem tela própria — é uma ação acionada pelo usuário no header do `AppLayout`.

### Comportamento

1. Usuário clica em "Sair" no menu do header
2. Chama `POST /auth/logout` com o `refreshToken` do localStorage
3. Independente da resposta da API: chama `authStore.clear()`, remove tokens do localStorage e redireciona para `/login`

### Chamada à API

```
POST /auth/logout
Body: { refreshToken }
Authorization: Bearer <accessToken>
```

---

## Critérios de Aceitação

- [ ] Login com credenciais corretas redireciona para a home do role do usuário
- [ ] Login com credenciais erradas exibe mensagem sem revelar qual campo está incorreto
- [ ] Conta inativa exibe mensagem específica
- [ ] Recuperação de senha exibe mensagem de confirmação sem revelar se e-mail existe
- [ ] Redefinição de senha com token inválido exibe mensagem de erro adequada
- [ ] Logout limpa o estado e redireciona para `/login`
- [ ] Usuário autenticado que acessa `/login` é redirecionado automaticamente
- [ ] Token expirado durante navegação dispara refresh automático — usuário não percebe
- [ ] Refresh falho redireciona para `/login` preservando `redirect` na query
