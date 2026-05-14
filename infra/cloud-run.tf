resource "google_artifact_registry_repository" "images" {
  location      = var.region
  repository_id = var.artifact_registry_repository_id
  description   = "Application container images"
  format        = "DOCKER"
}

resource "google_service_account" "api" {
  account_id   = local.api_service_account
  display_name = "API (${var.environment})"
}

resource "google_service_account" "web" {
  account_id   = local.web_service_account
  display_name = "Web (${var.environment})"
}
