# Deploying Embr

How Embr runs online, how a change goes live, and what to do when something goes wrong. Written for anyone working on the code, including people new to cloud hosting.

- [What runs where](#what-runs-where)
- [How a change goes live](#how-a-change-goes-live)
- [Deploy the API by hand](#deploy-the-api-by-hand)
- [Roll back the API](#roll-back-the-api)
- [See the API's logs](#see-the-apis-logs)
- [Change a setting](#change-a-setting)
- [Change Neon's password](#change-neons-password)
- [Costs and limits](#costs-and-limits)
- [Build it all again from nothing](#build-it-all-again-from-nothing)
- [Problems we have hit](#problems-we-have-hit)

---

## What runs where

```
Browser → Website (Vercel) → API (Google Cloud Run) → Database (Neon)
                ↑                    ↑
             Clerk (sign-in, checked by the API on every account request)
```

| Piece | Where it runs | Address | Set up by |
| --- | --- | --- | --- |
| Website (`apps/web`) | Vercel, project `embr` | https://embr-lovat.vercel.app | Vercel's dashboard |
| API (`apps/api`) | Google Cloud Run, service `embr-api`, region `us-east4` (N. Virginia) | https://embr-api-ofe5jagaaq-uk.a.run.app | Terraform (`infra/`) |
| Database | Neon, project `lucky-recipe-73407544`, branch `production` (AWS US East 1) | in Google Secret Manager, never in code | Neon's dashboard |
| API images | Google Artifact Registry, repository `embr` | `us-east4-docker.pkg.dev/grand-magpie-515906-i0/embr/api` | Terraform |

The website only knows the API's address (`NEXT_PUBLIC_API_URL` in Vercel). Only the API knows the database's address. Browsers never see the database.

Google Cloud project: `grand-magpie-515906-i0`. None of the names and addresses on this page are secret.

---

## How a change goes live

1. Merge a pull request into `main`.
2. **Website:** Vercel builds `main` and puts it live within about a minute.
3. **API:** when CI passes on `main`, `.github/workflows/deploy.yml` runs:

| Step | What it does | Why |
| --- | --- | --- |
| Log in to Google | Swaps GitHub's signed token for a Google login that lasts about an hour | No Google password or key is stored in GitHub (`infra/github.tf`) |
| Build the image | Packs `apps/api` into a Docker image, labelled with the commit's ID | Cloud Run runs images; the label shows which code is live |
| Push it | Uploads the image to Artifact Registry | Cloud Run can only pull images from there |
| Migrate | Runs `alembic upgrade head` on Neon, from the new image | The database is updated before new code needs it. Safe to repeat |
| Deploy | Points Cloud Run at the new image | Only the image changes; Terraform's settings stay |
| Check | Calls `/v1/health` and fails unless it says `"status": "ok"` | `/v1/health` answers 200 even when the database is down, so the reply is read |

Watch it in the repo's **Actions** tab. To run it without a new commit: **Actions → Deploy API → Run workflow** (only works on `main`).

If a new version fails to start, Cloud Run keeps sending all traffic to the last working version, so a bad deploy can't take the API down.

---

## Deploy the API by hand

Only needed if the workflow can't run. Open Docker Desktop, then from the repo root in PowerShell:

```
gcloud auth configure-docker us-east4-docker.pkg.dev   # first time only: lets Docker upload to Google
$tag = git rev-parse HEAD
docker build --tag "us-east4-docker.pkg.dev/grand-magpie-515906-i0/embr/api:$tag" apps/api
docker push "us-east4-docker.pkg.dev/grand-magpie-515906-i0/embr/api:$tag"
gcloud run services update embr-api --image "us-east4-docker.pkg.dev/grand-magpie-515906-i0/embr/api:$tag" --region us-east4
```

If the change adds a migration, run it on Neon first (from `apps/api`): `uv run --env-file .env.production alembic upgrade head`.

Then open https://embr-api-ofe5jagaaq-uk.a.run.app/v1/health. It should say `"status":"ok"` and `"database":"connected"`.

---

## Roll back the API

Every deploy makes a new **revision** (a saved version). Old ones stay, so going back is instant and nothing is rebuilt.

```
# List versions, newest first
gcloud run revisions list --service embr-api --region us-east4

# Send all traffic to an older one
gcloud run services update-traffic embr-api --region us-east4 --to-revisions=embr-api-00003-spx=100

# Once fixed: let new deploys get traffic again
gcloud run services update-traffic embr-api --region us-east4 --to-latest
```

While traffic is pinned to an old revision, new deploys don't receive any traffic, so remember `--to-latest`.

Rolling back the code does not undo database migrations. Write migrations so the previous version of the API still works with them (for example, add a column first, and remove the old one in a later release).

To roll back the website: Vercel → **Deployments** → an older Production deployment → **⋯** → **Promote to Production**.

---

## See the API's logs

Every request (with its status and how long it took) and anything the API prints. Kept 30 days, free.

- **Browser:** Google Cloud console → **Cloud Run** → **embr-api** → **Logs**.
- **Terminal:**

  ```
  gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="embr-api"' --freshness=1d --limit=20 --format="table(timestamp,httpRequest.requestMethod,httpRequest.status,httpRequest.requestUrl,httpRequest.latency)"
  ```

Status **200**: worked. **401**: no sign-in token, or a bad one. **5xx**: the API failed; open the entry for the error.

---

## Change a setting

The API's settings (Clerk's address, the allowed websites, memory, how many copies) live in `infra/`. Change them there, never in the Google Cloud console, or Terraform will undo the change next time.

From `infra/`:

```
terraform plan    # preview: lists what would change, changes nothing
terraform apply   # makes the change, after you type yes
```

Common ones:

- **Allow another website** (for example a new domain): add it to `cors_origins` in `infra/variables.tf`.
- **No more cold starts** (once there are real users): set `min_instance_count = 1` in `infra/run.tf`. This costs money: one copy always running.

Website settings live in Vercel → **Settings → Environment Variables**. `NEXT_PUBLIC_` values are copied into the website when it is built, so after changing one, redeploy the newest Production deployment from `main`, with **Use existing Build Cache** unticked.

---

## Change Neon's password

1. Reset the password in Neon and copy the new connection address.
2. Google Cloud console → **Secret Manager** → **embr-database-url** → **New version** → paste it → **Add new version**.
3. Cloud Run reads the secret when a copy of the API starts, so start fresh copies: **Actions → Deploy API → Run workflow** (or deploy by hand).
4. Check `/v1/health` says `"database":"connected"`.
5. Update `apps/api/.env.production` on your laptop.

---

## Costs and limits

- **Cloud Run:** free up to 2 million requests and 180,000 vCPU-seconds a month. Scales to 0 copies when unused, at most 2.
- **Cold start:** the first request after a quiet spell starts the API (about 4 seconds); after that, `/v1/me` answers in about 25 ms.
- **Artifact Registry:** keeps the newest 5 images and deletes older ones, to stay inside the free 0.5 GB.
- **Budget alert:** $5 CAD a month (Google Cloud → Billing → Budgets & alerts). It warns by email; it doesn't stop anything.
- **Free trial credits** end 2027-02-24. Upgrade to a paid billing account before then, or Google switches the API off.

---

## Build it all again from nothing

For a new Google Cloud project, or if everything was deleted. You need the `gcloud` CLI and Terraform installed.

1. `gcloud init` (sign in, pick the project), then `gcloud auth application-default login` (lets Terraform act as you; tick every permission on Google's page).
2. Make the bucket for Terraform's state (change the name if the project ID changes, here and in `infra/versions.tf`):

   ```
   gcloud storage buckets create gs://grand-magpie-515906-i0-tfstate --location=us-east4 --uniform-bucket-level-access
   gcloud storage buckets update gs://grand-magpie-515906-i0-tfstate --versioning
   ```

3. If the project ID changed, update `project_id` in `infra/variables.tf` and the addresses in `.github/workflows/deploy.yml`.
4. From `infra/`: `terraform init`, then `terraform apply`. It prints the API's address.
5. Put Neon's address in Secret Manager (see [Change Neon's password](#change-neons-password), step 2).
6. Deploy the API by hand once (see above).
7. Set `NEXT_PUBLIC_API_URL` in Vercel to the new address and redeploy the website.

---

## Problems we have hit

- **"Error code 7: The service has encountered an internal error"** on the first `terraform apply`: Google was still switching services on. Run `terraform apply` again a few minutes later.
- **`docker build` says `path "apps/api" not found`:** run it from the repo root, not from `infra/`.
- **The live site doesn't call the API after setting `NEXT_PUBLIC_API_URL`:** the website was built before the setting existed. Redeploy Production from `main` with the build cache unticked.
- **Redeploy shows a `feature/...` branch:** pick a deployment from `main`. Redeploying a branch's build to Production puts that branch live before its pull request.
