node -r newrelic server.js
node --experimental-loader=newrelic/esm-loader.mjs server.js
docker run \
  -d \
  --name newrelic-infra \
  --network=host \
  --cap-add=SYS_PTRACE \
  --privileged \
  --pid=host \
  -v "/:/host:ro" \
  -v "/var/run/docker.sock:/var/run/docker.sock" \
  -e NRIA_LICENSE_KEY=2cf598354e84137ebf051624638e296cFFFFNRAL \
  newrelic/infrastructure:latest
npm start