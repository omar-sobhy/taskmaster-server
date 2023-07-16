#!/bin/bash

VALID_ARGS=$(getopt -o tpdb --long testing,prod,detatch,build -- "$@")

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
    -b | --build)
      BUILD=true;
      ;;
    --)
      shift
      break
      ;;
  esac
  shift
done

COMMAND="docker compose "

if [ "$MODE" = "testing" ]; then
  COMMAND+="-f compose.test.yaml "
elif [ "$MODE" != "prod" ]; then
  COMMAND+="-f compose.dev.yaml "
fi

COMMAND+="up "

if [ "$MODE" = "testing" ]; then
  COMMAND+="--abort-on-container-exit --no-attach mongodb"
fi

if [ $DETATCH ]; then
  COMMAND+="-d "
fi

if [ $BUILD ]; then
  COMMAND+="--build "
fi

echo "running $COMMAND"
eval "$COMMAND"
