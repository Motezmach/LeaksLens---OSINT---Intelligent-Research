#!/usr/bin/env sh
# Build and vulnerability-scan the backend image with Trivy.
# Usage: sh deploy/trivy-scan.sh
set -eu

IMAGE="leaklens-backend:scan"

echo ">> Building $IMAGE"
docker build -t "$IMAGE" ./backend

echo ">> Scanning $IMAGE with Trivy (HIGH/CRITICAL, fail on findings)"
# Uses the official Trivy container so nothing extra needs installing.
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image \
  --severity HIGH,CRITICAL \
  --ignore-unfixed \
  --exit-code 1 \
  "$IMAGE"
