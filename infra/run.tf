# Cloud Run: runs the API's Docker image on Google's computers, at an
# https:// address, only while someone is using it.

# The API's own identity (a "service account"): it may read Neon's address
# and nothing else, so a bug in the API can't touch anything else in Google Cloud
resource "google_service_account" "api" {
  account_id   = "embr-api"
  display_name = "Embr API (runs on Cloud Run)"

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_iam_member" "api_reads_database_url" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = google_service_account.api.member
}

resource "google_cloud_run_v2_service" "api" {
  name     = "embr-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL" # reachable from the internet

  template {
    service_account = google_service_account.api.email

    # 0 copies when nobody uses it (costs nothing), at most 2 so costs can't
    # run away. With real users, set the minimum to 1 so nobody waits for a
    # cold start.
    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      # Google's sample image, only for the very first start. The deploy
      # workflow swaps in our image, and Terraform leaves it alone after that
      # (see lifecycle below).
      image = "us-docker.pkg.dev/cloudrun/container/hello"

      ports {
        container_port = 8000 # the port in apps/api/Dockerfile
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true # CPU only while answering a request: the cheapest way
      }

      # The API's settings (see apps/api/src/embr_api/core/config.py)
      env {
        name  = "EMBR_ENVIRONMENT"
        value = "production"
      }
      env {
        name  = "EMBR_CLERK_ISSUER"
        value = var.clerk_issuer
      }
      env {
        name  = "EMBR_CORS_ORIGINS"
        value = jsonencode(var.cors_origins)
      }
      env {
        name = "EMBR_DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image, # set by the deploy workflow
      client,                          # which tool last deployed
      client_version,
    ]
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_version.placeholder,
    google_secret_manager_secret_iam_member.api_reads_database_url,
  ]
}

# Anyone may call the API, because browsers call it directly. Sign-in is
# checked by the API itself (core/auth.py).
resource "google_cloud_run_v2_service_iam_member" "public" {
  name     = google_cloud_run_v2_service.api.name
  location = google_cloud_run_v2_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
