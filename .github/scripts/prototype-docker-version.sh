#!/bin/sh

# This script is ran whenever a PR is made to implement a Meilisearch prototype.
# For example if Meilisearch creates a prototype for radioactive search, the SDK may implement a way to try out the radioactive search.
# Nonetheless, the tests of this implentation should run against the prototype and not the latest release of Meilisearch.
# To be able to do so, Meilisearch creates a docker image with the changes.
# The purpose of this script is to find the correct docker image containing the changes.
# For example,
# The radioactive search docker image is named `prototype-radioactive-search-0`
# our branch is named `prototype-beta/prototype-radioactive-search`
# Using the branch name, this script is going to retrieve the name of the docker image.

# See https://docs.github.com/en/actions/learn-github-actions/environment-variables#default-environment-variables for references on GITHUB_REF_NAME
prototype_branch=$1                                                        # $GITHUB_REF_NAME
prototype_branch=$(echo $prototype_branch | sed -r 's/prototype-beta\///') # remove pre-prending prototype-beta/

docker_image=$(curl "https://hub.docker.com/v2/repositories/getmeili/meilisearch/tags?&page_size=100" | jq | grep "$prototype_branch" | head -1)
docker_image=$(echo $docker_image | grep '"name":' | cut -d ':' -f 2- | tr -d ' ' | tr -d '"' | tr -d ',')
echo $docker_image
