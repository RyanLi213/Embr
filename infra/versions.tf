# Settings for Terraform itself: which versions to use and where it keeps its
# record of what it has made (the "state").

terraform {
  required_version = ">= 1.9"

  required_providers {
    # The plugin that knows how to talk to Google Cloud
    google = {
      source  = "hashicorp/google"
      version = "~> 8.12" # any 8.x from 8.12 on, never 9.0 (which may break things)
    }
  }

  # The state lives in a Google Cloud Storage bucket, not on a laptop, so it
  # can't get lost and GitHub Actions sees the same record. The bucket is made
  # once by hand before the first `terraform init`, because Terraform needs
  # somewhere to write before it can make anything.
  backend "gcs" {
    bucket = "grand-magpie-515906-i0-tfstate"
    prefix = "embr"
  }
}

# Every Google piece below goes into this project and region unless it says otherwise
provider "google" {
  project = var.project_id
  region  = var.region
}
