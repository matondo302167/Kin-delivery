# Deploy using Docker Compose

Questa configurazione crea due servizi: `backend` (Node) e `frontend` (Nginx che serve la build). Il backend ascolta sulla porta 5000 e il frontend sulla porta 5001.

Prerequisiti:
- Docker e Docker Compose installati sulla macchina o server.

Come buildare e avviare (in repository root):
```bash
# build & start in background
docker compose up -d --build

# segui i logs
docker compose logs -f
```

Verifiche rapide:
```bash
# frontend
curl -v http://127.0.0.1:5001/

# backend
curl -v http://127.0.0.1:5000/api/otp/send
```

Note:
- In produzione potresti voler esporre solo il backend su un dominio e configurare un reverse proxy (NGINX) esterno per gestire HTTPS e routing. Oppure mettere il frontend e il backend dietro lo stesso load balancer.
- Se preferisci che il backend serva i file statici (anziché usare il container nginx), rimuovi il servizio `frontend` e usa solo `backend` (il server è già capace di servire `dist/public` in production).

