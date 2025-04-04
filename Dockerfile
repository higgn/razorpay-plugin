# Use an official Node.js runtime as a parent image
# Choose a version compatible with your code (e.g., Node 18 or 20)
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
# This layer is cached and only re-runs if these files change
COPY package*.json ./

# Install app dependencies
# Use --only=production to install only production dependencies
# Or remove --only=production if you have devDependencies needed at runtime
RUN npm install --only=production --ignore-scripts

# Bundle app source inside the Docker image
COPY . .

# Make port 8080 available to the world outside this container
# Cloud Run will map requests to this port
EXPOSE 8080

# Define the command to run your app using Node
# Use ["node", "server.js"] instead of npm start for better signal handling
CMD [ "node", "server.js" ]