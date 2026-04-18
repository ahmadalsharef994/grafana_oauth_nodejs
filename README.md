# Grafana OAuth2 — Node.js OIDC Integration

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-green?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Grafana-10+-orange?logo=grafana" alt="Grafana">
  <img src="https://img.shields.io/badge/OAuth2-OIDC-blue" alt="OAuth2">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

A working example of **wiring Grafana's built-in OAuth2/OIDC authentication to a custom Node.js authorization server**. Log in to Grafana with your own identity provider — no third-party SSO required.

---

## 🔑 How It Works

```mermaid
sequenceDiagram
    participant User
    participant Grafana
    participant NodeServer as Node.js Auth Server

    User->>Grafana: Access dashboard
    Grafana->>NodeServer: GET /authorize
    NodeServer->>User: Login form
    User->>NodeServer: Credentials
    NodeServer->>Grafana: Redirect with ?code=...
    Grafana->>NodeServer: POST /token
    NodeServer->>Grafana: access_token + id_token
    Grafana->>NodeServer: GET /userinfo
    NodeServer->>Grafana: { name, email, role }
    Grafana->>User: Authenticated dashboard
```

---

## 🚀 Quick Start

```bash
docker-compose up
```

Then open **http://localhost:3000** (Grafana) and click **Sign in with OAuth**.

---

## ⚙️ Grafana Config (`grafana.ini`)

```ini
[auth.generic_oauth]
enabled = true
name = MyAuthServer
client_id = grafana-client
client_secret = secret
scopes = openid profile email
auth_url = http://localhost:4000/authorize
token_url = http://localhost:4000/token
api_url = http://localhost:4000/userinfo
```

---

## 📁 Structure

```
├── auth-server/          # Node.js OIDC provider
│   ├── index.js
│   └── routes/
├── grafana/
│   └── grafana.ini       # OAuth config
└── docker-compose.yml
```

---

## 📄 License

MIT
