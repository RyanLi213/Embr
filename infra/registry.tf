# Artifact Registry: the shelf where the deploy workflow puts each new Docker
# image of the API, and where Cloud Run picks it up from.

resource "google_artifact_registry_repository" "api" {
  repository_id = "embr"
  location      = var.region
  format        = "DOCKER"
  description   = "Docker images of the Embr API"

  # Keep the 5 newest images (enough to roll back) and delete older ones, so
  # storage stays inside the free 0.5 GB. KEEP wins over DELETE.
  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "keep-newest-5"
    action = "KEEP"
    most_recent_versions {
      keep_count = 5
    }
  }

  cleanup_policies {
    id     = "delete-older"
    action = "DELETE"
    condition {
      tag_state = "ANY"
    }
  }

  depends_on = [google_project_service.apis]
}
