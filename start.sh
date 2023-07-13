#!/bin/bash

docker compose -f compose.dev.yaml down

if [ "$1" = "dev" ]; then
  docker compose -f compose.dev.yaml up
elif [ "$1" = "test" ]; then
  docker compose -f compose.dev.yaml -f compose.test.yaml up
else
  docker compose -f compose.dev.yaml -f compose.prod.yaml up
fi
