output "resource_prefix" {
  description = "Shared prefix used for named infrastructure resources."
  value       = local.resource_prefix
}

output "artifact_registry_repository_id" {
  description = "Artifact Registry repository id used by Cloud Build and Cloud Run."
  value       = google_artifact_registry_repository.images.repository_id
}

output "database_name" {
  description = "PostgreSQL database name used by the application."
  value       = google_sql_database.app.name
}

output "api_service_account_id" {
  description = "API service-account id."
  value       = google_service_account.api.account_id
}

output "api_service_account_email" {
  description = "API service-account email."
  value       = google_service_account.api.email
}

output "web_service_account_id" {
  description = "Web service-account id."
  value       = google_service_account.web.account_id
}

output "web_service_account_email" {
  description = "Web service-account email."
  value       = google_service_account.web.email
}

output "api_service_name" {
  description = "Cloud Run service name for the API."
  value       = google_cloud_run_v2_service.api.name
}

output "web_service_name" {
  description = "Cloud Run service name for the web frontend."
  value       = google_cloud_run_v2_service.web.name
}

output "vpc_name" {
  description = "VPC name used by the Cloud Run API service."
  value       = google_compute_network.vpc.name
}

output "subnet_name" {
  description = "Subnet name used by the Cloud Run API service."
  value       = google_compute_subnetwork.subnet.name
}

output "jwt_secret_name" {
  description = "Secret Manager secret id for the JWT signing secret."
  value       = google_secret_manager_secret.jwt_secret.secret_id
}

output "sendgrid_secret_name" {
  description = "Secret Manager secret id for the SendGrid API key."
  value       = google_secret_manager_secret.sendgrid_api_key.secret_id
}

output "email_from_secret_name" {
  description = "Secret Manager secret id for the EMAIL_FROM value."
  value       = google_secret_manager_secret.email_from.secret_id
}

output "api_url" {
  value = google_cloud_run_v2_service.api.uri
}

output "web_url" {
  value = google_cloud_run_v2_service.web.uri
}

