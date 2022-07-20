#!/bin/sh

# Checking if current tag matches the required formating
is_pre_release=$1

current_tag=$(echo $GITHUB_REF | cut -d '/' -f 3 | tr -d ' ',v)

if [ $is_pre_release = false ]; then
  echo "$current_tag" | grep -E "[0-9]*\.[0-9]*\.[0-9]*$"
  if [ $? != 0 ]; then
    echo "Your tag is badly formatted for a none pre-release"
    exit 1
  fi
  exit 0
fi

if [ $is_pre_release = true ]; then
  # Works with the format vX.X.X-xxx-beta.X
  # none or multiple -xxx are valid
  #
  # Exemple of correct format
  # vX.X.X-beta.0
  # vX.X.X-xxx-beta.0
  # vX.X.X-xxx-xxx-beta.0
  echo "$current_tag" | grep -E "[0-9]*\.[0-9]*\.[0-9]*-([a-z]*-)*beta\.[0-9]*$"

  if [ $? != 0 ]; then
    echo "Your pre release tag: $current_tag is badly formatted. Please refer to contributing guide"
    exit 1
  fi
  exit 0
fi
