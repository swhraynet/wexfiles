#!/usr/bin/env bash

source_dir="$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)";
cd "$source_dir";

DENO_BIN="deno";

# Do not check for deno updates
export DENO_NO_UPDATE_CHECK="1";

FILES=$(find ./src/ -name "*.ts")

echo "Vendoring npm dependencies..";
${DENO_BIN} cache --node-modules-dir=true ${FILES}

echo "Vendoring deno dependencies..";
${DENO_BIN} vendor --force ${FILES}

