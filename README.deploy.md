# Deploy usando Docker Compose

Questa configurazione crea UN SERVIZIO UNICO che serve sia il backend (API) che il frontend (assets statici build).
- Server Node.js ascolta sulla porta 5000
- In produzione serve: `/api/*` → backend routes, `/` → frontend statico build

## Prerequisiti:
- Docker e Docker Compose installati sul server.

## Come buildare e avviare (in repository root):

```bash
# build & start in background
docker compose up -d --build

# segui i logs
docker compose logs -f
```

## Verifiche rapide:

```bash
# Frontend (assets statici)
curl -v http://localhost:5000/

# Backend API (esempio)
curl -v http://localhost:5000/api/otp/send
```

## URL pubblico in produzione:
Visita semplicemente: `http://<server_ip>:5000/`

Il frontend e le API saranno entrambe accessibili dallo stesso dominio (nessun problema CORS).

## Note:
- Se vuoi HTTPS/dominio/reverse proxy esterno, piazza NGINX davanti alla porta 5000.
- Per deploy cloud (Render, Railway, Fly), il provider imposterà la variabile `PORT` automaticamente.
