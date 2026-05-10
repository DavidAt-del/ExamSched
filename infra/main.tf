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
  description = "Service account email used for IAM DB auth (no @-suffix)"
  type        = string
}

locals {
  name_prefix = "proctor-${var.environment}"
}
