#!/usr/bin/env bash
run () {
  QUERY=$(jq -n --arg q "$LINE" '{ query: $q }')
  echo -e "Request\n" $QUERY
  echo Response
  curl -s -H "Content-Type: application/json; charset=utf-8" -d "$QUERY" http://localhost:3080/graphql | jq .
}

# Prepare data from input :)
if read -t 0 ; then
  echo "Waiting stdin..."
  LINE=$(</dev/stdin)
  run
else
  if [[ ! ${@} ]]; then
    echo "Usage:"
    echo "$0 your-query.gql"
  else
    if [ ! -f $1 ]; then
      echo File "$1" not found!
      echo "Usage:"
      echo "$0 your-query.gql"
    else
      echo "stdin is empty"
      LINE="$(cat $1 | tr -d '\n')"
      run
    fi
  fi
fi
