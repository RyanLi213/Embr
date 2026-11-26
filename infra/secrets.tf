# Secret Manager: a locked box for Neon's address, which contains the
# database password. Terraform only makes the box. The real address is added
# by hand in the console (Secret Manager > embr-database-url > New version),
# so it never appears in this repo, in Terraform's state or in chat.

resource "google_secret_manager_secret" "database_url" {
  secret_id = "embr-database-url"

  replication {
    auto {} # Google decides where to keep copies
  }

  depends_on = [google_project_service.apis]
}

# Cloud Run won't start while the box is empty, so the box starts with a
# placeholder. The real address, added later, becomes the "latest" version,
# which is the one Cloud Run reads.
resource "google_secret_manager_secret_version" "placeholder" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "placeholder"
}
