#!/bin/sh

# Checking if current tag matches the required formating
is_pre_release=$1
current_tag=$(echo $GITHUB_REF | cut -d '/' -f 3 | tr -d ' ',v)

if [ $is_pre_release = false ]; then
  # Works with the format vX.X.X
  #
  # Example of correct format:
  # v0.1.0
  echo "$current_tag" | grep -E "[0-9]*\.[0-9]*\.[0-9]*$"
  if [ $? != 0 ]; then
    echo "Error: Your tag: $current_tag is wrongly formatted."
    echo 'Please refer to the contributing guide for help.'
    exit 1
  fi
  exit 0
elif [ $is_pre_release = true ]; then
  # Works with the format vX.X.X-xxx-beta.X
  # none or multiple -xxx are valid
  #
  # Examples of correct format:
  # v0.1.0-beta.0
  # v0.1.0-xxx-beta.0
  # v0.1.0-xxx-xxx-beta.0
  echo "$current_tag" | grep -E "[0-9]*\.[0-9]*\.[0-9]*-([a-z]*-)*beta\.[0-9]*$"

  if [ $? != 0 ]; then
    echo "Error: Your beta tag: $current_tag is wrongly formatted."
    echo 'Please refer to the contributing guide for help.'
    exit 1
  fi
  exit 0
fi

exit 0
