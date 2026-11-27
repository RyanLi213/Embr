# Our settings, in one place. Other files use them as var.<name>.
# None of these are secret.

variable "project_id" {
  description = "The Google Cloud project that holds everything for Embr"
  type        = string
  default     = "grand-magpie-515906-i0"
}

variable "region" {
  description = "N. Virginia: the same area as Neon's database (AWS US East 1), so the API reaches it quickly"
  type        = string
  default     = "us-east4"
}

variable "github_repo" {
  description = "The only GitHub repo allowed to deploy the API"
  type        = string
  default     = "RyanLi213/Embr"
}

variable "clerk_issuer" {
  description = "Clerk's public address; the API uses it to check sign-in tokens"
  type        = string
  default     = "https://positive-dane-4610.clerk.accounts.dev"
}

variable "cors_origins" {
  description = "Websites allowed to call the API from a browser"
  type        = list(string)
  default     = ["https://embr-lovat.vercel.app"]
}
