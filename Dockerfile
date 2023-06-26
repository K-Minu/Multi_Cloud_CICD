FROM node:latest

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm install newrelic --save
ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true \
NEW_RELIC_LOG=stdout
# etc.

COPY . .

EXPOSE 80
CMD [ "/start.sh" ]