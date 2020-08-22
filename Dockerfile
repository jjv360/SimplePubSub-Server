#
# Dockerfile for the SimplePubSub server

# Base our build on Node 12 LTS
FROM node:12

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install

# Bundle app source after installing dependencies, this makes things faster via Docker layers.
COPY . .

# Expose the app's port
EXPOSE 8089

# Start the app
CMD [ "npm", "start" ]
