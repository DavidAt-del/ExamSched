resource "google_compute_network" "vpc" {
  name                    = "${local.resource_prefix}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "${local.resource_prefix}-subnet"
  ip_cidr_range = "10.10.0.0/20"
  region        = var.region
  network       = google_compute_network.vpc.id
}

resource "google_compute_global_address" "private_ip_alloc" {
  name          = "${local.resource_prefix}-pg-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_peering" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc.name]
}

resource "google_sql_database_instance" "pg" {
  name             = "${local.resource_prefix}-pg"
  region           = var.region
  database_version = "POSTGRES_17"
  depends_on       = [google_service_networking_connection.private_vpc_peering]

  settings {
    tier              = "db-custom-2-7680"
    availability_type = "ZONAL"
    disk_autoresize   = true
    disk_size         = 20
    disk_type         = "PD_SSD"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.vpc.id
      require_ssl     = true
    }

    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    insights_config {
      query_insights_enabled = true
    }
  }

  deletion_protection = true
}

resource "google_sql_database" "app" {
  name     = var.database_name
  instance = google_sql_database_instance.pg.name
}

# IAM-based DB user (no password). The service account must have the
# `cloudsql.client` and `cloudsql.instanceUser` roles, granted in iam.tf.
resource "google_sql_user" "iam_user" {
  name     = var.db_iam_user
  instance = google_sql_database_instance.pg.name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}
