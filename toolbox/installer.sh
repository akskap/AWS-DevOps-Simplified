#!/usr/bin/env bash

# Switch to Cloud9 home directory
pushd /home/ec2-user/environment

# Remove existing readme.md file
rm -f README.md || true

# Setup resources for AWS DevOps Simplified
git init .
git remote add origin https://github.com/akskap/AWS-DevOps-Simplified.git
git fetch origin
git checkout main
rm -rf .git

# Install Tools
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo
sudo yum -y install packer
echo "export PATH=/usr/bin/packer:$PATH" >> /home/ec2-user/.bashrc
echo "export PATH=/usr/bin/packer:$PATH" >> /home/ec2-user/.bash_profile