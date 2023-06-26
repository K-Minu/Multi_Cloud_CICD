#!/bin/sh

docker run -e NEW_RELIC_LICENSE_KEY=2cf598354e84137ebf051624638e296cFFFFNRAL \
  -e NEW_RELIC_APP_NAME="sdp-apm" \
  sdptestregistry/myapp:3bc358707ed85c0f195f6f55fccbdbde9d92492e

npm start