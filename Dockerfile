# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /scrollcaster

# Set production environment
ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package.json nodemon.json tsconfig.json ./
RUN npm install

# Copy application code
COPY . .

RUN npm run build

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /scrollcaster/dist /scrollcaster
COPY --from=build /scrollcaster/package.json /scrollcaster
COPY --from=build /scrollcaster/server/resources /scrollcaster/server/resources

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "node", "server.js" ]
