#!/bin/sh

# Checking if current tag matches the package version
current_tag=$(echo $GITHUB_REF | cut -d '/' -f 3 | sed -r 's/^v//')

package_json_version=$(grep '"version":' package.json | cut -d ':' -f 2- | tr -d ' ' | tr -d '"' | tr -d ',')
if [ "$current_tag" != "$package_json_version" ]; then
  echo "Error: the current tag does not match the version in package file(s)."
  echo "$current_tag vs $package_json_version"
  exit 1
fi

package_version_ts=$(grep "PACKAGE_VERSION =" src/package-version.ts | cut -d "=" -f 2- | tr -d " " | tr -d "'")
if [ "$current_tag" != "$package_version_ts" ]; then
  echo "Error: the current tag does not match the version in src/package-version.ts."
  echo "$current_tag vs $package_version_ts"
  exit 1
fi

echo 'OK'
exit 0
