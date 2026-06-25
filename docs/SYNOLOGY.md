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

Additional accounts are created under **Config → New User**.
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

## Rebuild and recovery

After your Synology installation is working, create a fresh backup from
**Config → Administrator → Back up**. Keep that `.dump` file somewhere outside
`/volume1/docker/buffetiser`, with another copy on separate storage if
possible.

You can safely rebuild containers and images because the portfolio lives in the
named Docker volume `buffetiser_db_data`:

```bash
cd /volume1/docker/buffetiser
sudo docker compose -f docker-compose.synology.yml up -d --build
```

Stopping containers keeps the data:

```bash
sudo docker compose -f docker-compose.synology.yml down
```

Do not use `down -v` unless you intentionally want to delete the database:

```bash
sudo docker compose -f docker-compose.synology.yml down -v
```

To recover after a complete wipe:

1. Copy the Buffetiser project back to `/volume1/docker/buffetiser`.
2. Recreate `.env` from `.env.example`.
3. Set `BUFFETISER_PORT`, `POSTGRES_PASSWORD` and `ALLOWED_ORIGINS`.
4. Start the project with `docker-compose.synology.yml`.
5. Create the first administrator account.
6. Restore your latest `.dump` backup through **Config → Administrator**.
