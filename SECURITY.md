# AGENTS.md: Project Code Generation Mandate
# Security Policy


1. Secret Manager: For all secrets: database passwords, third-party API keys, etc. Your Cloud Run services will be granted secure access at runtime.
2. IAM (Identity and Access Management): Enforce the Principle of Least Privilege. Services and developers should only have the exact permissions they need.
3. Cloud Logging & Monitoring: Your eyes and ears. All Cloud Run services automatically stream logs here. Set up dashboards and alerts to monitor application health and performance.
4. VPC & Serverless VPC Access Connector: This is critical for connecting your Cloud Run service to your Cloud SQL database securely and with low latency over a private network.
5. Cloud Armor: A Web Application Firewall (WAF) to protect your public-facing frontend from common web attacks and DDoS attempts.
