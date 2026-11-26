# Lets GitHub Actions deploy without a stored Google key (Workload Identity
# Federation). GitHub gives each workflow run a signed token saying which repo
# and branch it is from; Google checks GitHub's signature (like our API checks
# Clerk's) and hands back a login that lasts about an hour.

resource "google_iam_workload_identity_pool" "github" {
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"

  depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "embr-repo"
  display_name                       = "Embr repo"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  # Which parts of GitHub's token Google keeps
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  # Only this repo's main branch may log in
  attribute_condition = "assertion.repository == '${var.github_repo}' && assertion.ref == 'refs/heads/main'"
}

# The identity GitHub Actions deploys as
resource "google_service_account" "deployer" {
  account_id   = "github-deployer"
  display_name = "GitHub Actions deployer"

  depends_on = [google_project_service.apis]
}

resource "google_service_account_iam_member" "github_can_use_deployer" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repo}"
}

# What the deployer may do, and nothing more. 1: put images on the shelf
resource "google_artifact_registry_repository_iam_member" "deployer_pushes_images" {
  repository = google_artifact_registry_repository.api.name
  location   = google_artifact_registry_repository.api.location
  role       = "roles/artifactregistry.writer"
  member     = google_service_account.deployer.member
}

# 2: deploy new versions of the API
resource "google_cloud_run_v2_service_iam_member" "deployer_deploys_api" {
  name     = google_cloud_run_v2_service.api.name
  location = google_cloud_run_v2_service.api.location
  role     = "roles/run.developer"
  member   = google_service_account.deployer.member
}

# 3: start those versions running as the API's identity
resource "google_service_account_iam_member" "deployer_runs_as_api" {
  service_account_id = google_service_account.api.name
  role               = "roles/iam.serviceAccountUser"
  member             = google_service_account.deployer.member
}
