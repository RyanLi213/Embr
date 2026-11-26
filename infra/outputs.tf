# Values Terraform prints after `terraform apply` (and on `terraform output`).
# None of them are secret.

output "api_url" {
  description = "The API's address. Vercel's NEXT_PUBLIC_API_URL is set to this"
  value       = google_cloud_run_v2_service.api.uri
}

output "image_repository" {
  description = "Where the deploy workflow puts the API's images"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.api.repository_id}"
}

output "workload_identity_provider" {
  description = "For the deploy workflow's Google login step"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deployer_service_account" {
  description = "For the deploy workflow's Google login step"
  value       = google_service_account.deployer.email
}
