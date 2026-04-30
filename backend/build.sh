#!/usr/bin/env bash
# Render Build Script — installs dependencies + Terraform

set -e

echo "=== Installing Node dependencies ==="
npm install

echo "=== Installing Terraform ==="
TERRAFORM_VERSION="1.7.5"
curl -fsSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" -o terraform.zip
unzip -o terraform.zip
mkdir -p terraform_bin
mv terraform terraform_bin/terraform
chmod +x terraform_bin/terraform
echo "=== Terraform installed successfully ==="
./terraform_bin/terraform --version
