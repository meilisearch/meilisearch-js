#!/usr/bin/env bash

set -euo pipefail

MEILISEARCH_REPO="${MEILISEARCH_REPO:-meilisearch/meilisearch}"
MEILISEARCH_DOCKER_IMAGE="${MEILISEARCH_DOCKER_IMAGE:-getmeili/meilisearch-enterprise}"
BASE_BRANCH="${BASE_BRANCH:-main}"
BRANCH_PREFIX="${BRANCH_PREFIX:-bump-meilisearch-v}"

DOCKER_COMPOSE_FILE="docker-compose.yml"
TESTS_WORKFLOW_FILE=".github/workflows/tests.yml"

write_result() {
  local should_update="$1"

  if [[ -n "${GITHUB_ENV:-}" ]]; then
    {
      echo "SHOULD_UPDATE=${should_update}"
      echo "LATEST_TAG=${LATEST_TAG}"
      echo "TARGET_TAG=${TARGET_TAG}"
      echo "NEW_BRANCH=${NEW_BRANCH}"
    } >> "${GITHUB_ENV}"
  fi

  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    {
      echo "should_update=${should_update}"
      echo "latest_tag=${LATEST_TAG}"
      echo "target_tag=${TARGET_TAG}"
      echo "new_branch=${NEW_BRANCH}"
    } >> "${GITHUB_OUTPUT}"
  fi
}

echo "Checking latest stable release from ${MEILISEARCH_REPO}"
LATEST_TAG="$(gh api "repos/${MEILISEARCH_REPO}/releases/latest" --jq '.tag_name')"
if ! [[ "${LATEST_TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Unexpected latest tag format: ${LATEST_TAG}" >&2
  exit 1
fi

LATEST_VERSION="${LATEST_TAG#v}"
LATEST_MM="$(echo "${LATEST_VERSION}" | awk -F. '{print $1"."$2}')"
TARGET_TAG="v${LATEST_MM}"
NEW_BRANCH="${BRANCH_PREFIX}${LATEST_MM}"

CURRENT_TAG="$(sed -nE "s|.*${MEILISEARCH_DOCKER_IMAGE}:(v[0-9]+\.[0-9]+(\.[0-9]+)?)|\1|p" "${DOCKER_COMPOSE_FILE}" | head -n 1 || true)"
CURRENT_MM=""
if [[ -n "${CURRENT_TAG}" ]]; then
  CURRENT_VERSION="${CURRENT_TAG#v}"
  CURRENT_MM="$(echo "${CURRENT_VERSION}" | awk -F. '{print $1"."$2}')"
fi

NEED_UPDATE=0
if [[ -z "${CURRENT_MM}" || "${CURRENT_MM}" != "${LATEST_MM}" ]]; then
  NEED_UPDATE=1
fi

# Normalize to patchless minor tag in both files.
if ! grep -q "${MEILISEARCH_DOCKER_IMAGE}:${TARGET_TAG}" "${DOCKER_COMPOSE_FILE}" \
  || ! grep -q "${MEILISEARCH_DOCKER_IMAGE}:${TARGET_TAG}" "${TESTS_WORKFLOW_FILE}"; then
  NEED_UPDATE=1
fi

if [[ "${NEED_UPDATE}" -eq 0 ]]; then
  echo "No update needed. Already on latest minor (${LATEST_MM}.x) with patchless tags."
  write_result "false"
  exit 0
fi

OPEN_COUNT="$(gh pr list --state open --head "${NEW_BRANCH}" --base "${BASE_BRANCH}" --json number --jq 'length')"
if [[ "${OPEN_COUNT}" -gt 0 ]]; then
  echo "Open PR already exists for ${NEW_BRANCH}, skipping."
  write_result "false"
  exit 0
fi

sed -i.bak -E "s|(${MEILISEARCH_DOCKER_IMAGE}:)(latest|v[0-9]+\.[0-9]+(\.[0-9]+)?)|\1${TARGET_TAG}|g" "${DOCKER_COMPOSE_FILE}"
rm "${DOCKER_COMPOSE_FILE}.bak"

sed -i.bak -E "s|(${MEILISEARCH_DOCKER_IMAGE}:)(latest|v[0-9]+\.[0-9]+(\.[0-9]+)?)|\1${TARGET_TAG}|g" "${TESTS_WORKFLOW_FILE}"
rm "${TESTS_WORKFLOW_FILE}.bak"

grep "${MEILISEARCH_DOCKER_IMAGE}:${TARGET_TAG}" "${DOCKER_COMPOSE_FILE}" >/dev/null
grep "${MEILISEARCH_DOCKER_IMAGE}:${TARGET_TAG}" "${TESTS_WORKFLOW_FILE}" >/dev/null

write_result "true"

echo "Prepared Meilisearch bump to ${TARGET_TAG} (${LATEST_TAG}) on branch ${NEW_BRANCH}"
