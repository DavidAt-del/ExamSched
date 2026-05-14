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

# API service. The actual image:tag is updated by Cloud Build at deploy time.
resource "google_cloud_run_v2_service" "api" {
  name     = local.api_service_name
  location = var.region

  template {
    service_account = google_service_account.api.email

    scaling {
      min_instance_count = 0
      max_instance_count = 5
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}/api:placeholder"
      ports {
        container_port = 8080
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "CLOUD_SQL_INSTANCE"
        value = google_sql_database_instance.pg.connection_name
      }
      env {
        name  = "DB_USER"
        value = var.db_iam_user
      }
      env {
        name  = "DB_NAME"
        value = google_sql_database.app.name
      }
      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "SENDGRID_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.sendgrid_api_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "EMAIL_FROM"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.email_from.secret_id
            version = "latest"
          }
        }
      }
    }

    vpc_access {
      network_interfaces {
        network    = google_compute_network.vpc.id
        subnetwork = google_compute_subnetwork.subnet.id
      }
      egress = "PRIVATE_RANGES_ONLY"
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }
}

resource "google_cloud_run_v2_service" "web" {
  name     = local.web_service_name
  location = var.region

  template {
    service_account = google_service_account.web.email
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.images.repository_id}/web:placeholder"
      ports {
        container_port = 8080
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }
}

resource "google_cloud_run_v2_service_iam_member" "api_public" {
  name     = google_cloud_run_v2_service.api.name
  location = google_cloud_run_v2_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  name     = google_cloud_run_v2_service.web.name
  location = google_cloud_run_v2_service.web.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

