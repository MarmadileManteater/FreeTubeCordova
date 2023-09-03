
## Dependency Stage ##
FROM node:18-alpine AS dep
WORKDIR /app
COPY package.json ./package.json
COPY yarn.lock ./yarn.lock
# copy `dist` if it exists already
COPY dis[t]/web ./dist/web
# git is needed for jinter
RUN apk add git
# don't rebuild if you don't have to
RUN if [ ! -d 'dist/web' ]; then yarn ci; fi

## Build Stage ##
FROM node:18-alpine AS build
WORKDIR /app
COPY . .
COPY --from=dep /app/dis[t]/web ./dist/web
COPY --from=dep /app/node_module[s] ./node_modules
# don't rebuild if you don't have to
RUN if [ ! -d 'dist/web' ]; then yarn pack:web; fi

## App Stage ##
FROM nginx:latest as app
COPY --from=build /app/dist/web /usr/share/nginx/html
