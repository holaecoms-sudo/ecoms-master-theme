#!/usr/bin/env bash
# Builds an uploadable Shopify theme ZIP (theme folders only) into dist/.
set -euo pipefail
cd "$(dirname "$0")/.."
version=$(python3 -c "import json;print(json.load(open('config/settings_schema.json'))[0]['theme_version'])")
mkdir -p dist
out="dist/ecoms-master-${version}.zip"
rm -f "$out"
zip -qr "$out" assets config layout locales sections snippets templates -x '*.DS_Store'
echo "$out"
