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
  name_prefix = "proctor-${var.environment}"
}
