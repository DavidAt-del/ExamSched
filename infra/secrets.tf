resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${local.name_prefix}-jwt-secret"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "sendgrid_api_key" {
  secret_id = "${local.name_prefix}-sendgrid-api-key"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "email_from" {
  secret_id = "${local.name_prefix}-email-from"
  replication {
    auto {}
  }
}
