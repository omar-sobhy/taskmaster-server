#!/bin/bash

docker compose -f compose.dev.yaml down

VALID_ARGS=$(getopt -o tpd --long testing,prod,detatch -- "$@")

eval set -- "$VALID_ARGS"

while [ : ]; do
  case "$1" in
    -t | --testing)
      MODE="testing"
      ;;
    -p | --prod)
      MODE="prod"
      ;;
    -d | --detatch)
      DETATCH=true;
      ;;
    --)
      shift
      break
      ;;
  esac
  shift
done

COMMAND="docker compose -f compose.dev.yaml "

if [ "$MODE" = "prod" ]; then
  COMMAND+="-f compose.prod.yaml "
elif [ "MODE" = "testing" ]; then
  COMMAND+="-f compose.test.yaml "
fi

COMMAND+="up "

if [ $DETATCH ]; then
  COMMAND+="-d "
fi

echo "running $COMMAND"
eval "$COMMAND"

# if [ "$1" = "prod" ]; then
#   docker compose -f compose.dev.yaml -f compose.prod.yaml up
# elif [ "$1" = "test" ]; then
#   docker compose -f compose.dev.yaml -f compose.test.yaml up
# else
#   docker compose -f compose.dev.yaml up
# fi
