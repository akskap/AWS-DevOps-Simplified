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
