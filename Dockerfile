FROM node:14.7.0-buster-slim

RUN npm install -g parcel-bundler@1.12.3
RUN npm install -g react@16.13.1 react-dom@16.13.1

WORKDIR /frontend