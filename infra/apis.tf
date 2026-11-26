# Turns on the Google services we use. Every service starts switched off in a
# new project ("Google APIs" here means these on/off switches, not our API).

resource "google_project_service" "apis" {
  for_each = toset([
    "artifactregistry.googleapis.com",     # stores the API's Docker images
    "cloudresourcemanager.googleapis.com", # lets Terraform give out permissions
    "iam.googleapis.com",                  # identities for the API and for GitHub Actions
    "iamcredentials.googleapis.com",       # short-lived logins for GitHub Actions
    "run.googleapis.com",                  # runs the API
    "secretmanager.googleapis.com",        # holds Neon's address
    "sts.googleapis.com",                  # swaps GitHub's token for a Google one
  ])

  service = each.value

  # If this file is ever removed, leave the services on: switching one off
  # can break whatever still uses it
  disable_on_destroy = false
}
