FROM node:latest

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN docker run -e NEW_RELIC_LICENSE_KEY=2cf598354e84137ebf051624638e296cFFFFNRAL \
  -e NEW_RELIC_APP_NAME="sdp-test-app-apm" \
  your_image_name:latest

ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true \
NEW_RELIC_LOG=stdout
# etc.

COPY . .

EXPOSE 80
CMD [ "npm", "start" ]