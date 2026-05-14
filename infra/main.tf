terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.10"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "GCP project id"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Deployment environment (staging|production)"
  type        = string
  default     = "staging"
}

variable "app_slug" {
  description = "Short, lowercase slug used to derive default resource names. Override for a renamed product or a different owning organization."
  type        = string
  default     = "proctor"
}

variable "resource_prefix" {
  description = "Optional explicit prefix for shared named resources (VPC, SQL instance, secrets). Leave empty to use '<app_slug>-<environment>'."
  type        = string
  default     = ""
}

variable "artifact_registry_repository_id" {
  description = "Artifact Registry repository id that stores the API and web container images."
  type        = string
  default     = "proctor-scheduler"
}

variable "database_name" {
  description = "PostgreSQL database name used by the application."
  type        = string
  default     = "proctor_scheduler"
}

variable "api_service_account_id" {
  description = "Optional service-account id for the API workload. Leave empty to use 'api-<environment>'."
  type        = string
  default     = ""
}

variable "web_service_account_id" {
  description = "Optional service-account id for the web workload. Leave empty to use 'web-<environment>'."
  type        = string
  default     = ""
}

variable "api_service_name" {
  description = "Optional Cloud Run service name for the API. Leave empty to use 'api-<environment>'."
  type        = string
  default     = ""
}

variable "web_service_name" {
  description = "Optional Cloud Run service name for the web frontend. Leave empty to use 'web-<environment>'."
  type        = string
  default     = ""
}

variable "github_repository" {
  description = "GitHub repository allowed to authenticate to GCP through Workload Identity Federation, in owner/repo form."
  type        = string
  default     = "DavidAt-del/ExamSched"
}

variable "github_actions_service_account_id" {
  description = "Optional service-account id that GitHub Actions impersonates to submit Cloud Build deployments. Leave empty to use 'github-actions-<environment>'."
  type        = string
  default     = ""
}

variable "db_iam_user" {
  # Cloud SQL IAM authentication: when the IAM user is a service account, the
  # username is the service account's email with the trailing
  # ".gserviceaccount.com" stripped (Postgres caps usernames at 63 bytes).
  # Example: api-staging@my-project.iam.gserviceaccount.com →
  #   db_iam_user = "api-staging@my-project.iam"
  description = "Cloud SQL IAM database username (service-account email with the '.gserviceaccount.com' suffix removed). Example: 'api-staging@my-project.iam'."
  type        = string
}

locals {
  resource_prefix                = trimspace(var.resource_prefix) != "" ? trimspace(var.resource_prefix) : "${var.app_slug}-${var.environment}"
  api_service_account            = trimspace(var.api_service_account_id) != "" ? trimspace(var.api_service_account_id) : "api-${var.environment}"
  web_service_account            = trimspace(var.web_service_account_id) != "" ? trimspace(var.web_service_account_id) : "web-${var.environment}"
  api_service_name               = trimspace(var.api_service_name) != "" ? trimspace(var.api_service_name) : "api-${var.environment}"
  web_service_name               = trimspace(var.web_service_name) != "" ? trimspace(var.web_service_name) : "web-${var.environment}"
  github_actions_service_account = trimspace(var.github_actions_service_account_id) != "" ? trimspace(var.github_actions_service_account_id) : "github-actions-${var.environment}"
  github_wif_pool_id             = substr("${local.resource_prefix}-github", 0, 32)
}
