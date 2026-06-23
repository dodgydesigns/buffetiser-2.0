# Running Buffetiser on Synology

## Requirements

- DSM 7.2 with Container Manager installed
- A NAS model supported by Container Manager
- A local folder containing this repository, for example:
  `/volume1/docker/buffetiser`

## Configure

Copy `.env.example` to `.env` in the project root and set:

```dotenv
POSTGRES_USER=buffetiser
POSTGRES_PASSWORD=replace-this-with-a-long-random-password
POSTGRES_DB=BUFFETISER_DB
BUFFETISER_PORT=8080
ALLOWED_ORIGINS=http://192.168.1.50:8080
COOKIE_SECURE=false
SESSION_DAYS=30
```

Replace `192.168.1.50` with the NAS address. Do not reuse an existing
PostgreSQL password.

## Create the Container Manager project

1. Open **Container Manager → Project → Create**.
2. Name the project `buffetiser`.
3. Select `/volume1/docker/buffetiser` as its path.
4. Choose **Use existing docker-compose.yml**.
5. Select `docker-compose.synology.yml`.
6. Build and start the project.

Open `http://NAS-IP:8080`. On first launch, Buffetiser asks you to create the
administrator. If a database was migrated from an older installation, all
existing investments are assigned to this first account.

Additional accounts are created under **Config → Administrator → Accounts**.
Each account can only read or change its own portfolio.

## Move an existing portfolio

1. Create a backup from the old Buffetiser installation.
2. Complete first-account setup on the NAS.
3. Open **Config → Administrator → Restore**.
4. Select the PostgreSQL `.dump` backup.

The database backup includes accounts. After restoring a backup created before
multi-user support, reload the page and complete administrator setup.

## HTTPS and remote access

Buffetiser has no reason to be directly exposed to the public internet.
For remote access, use a private VPN such as Tailscale.

For HTTPS on the LAN, create a DSM reverse-proxy rule forwarding a hostname to
`http://127.0.0.1:8080`, then set:

```dotenv
ALLOWED_ORIGINS=https://buffetiser.example.com
COOKIE_SECURE=true
```

Rebuild the project after changing these values.

## Updating

Replace or pull the source files, then choose **Project → Action → Build** in
Container Manager. The PostgreSQL data remains in the named
`buffetiser_db_data` volume.
