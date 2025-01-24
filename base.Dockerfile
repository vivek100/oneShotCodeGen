FROM node:16
WORKDIR /base

# Copy base package files
COPY src/templates/package.json /base/
COPY src/templates/package-lock.json /base/

# Pre-install dependencies
RUN npm install

# Add vite dependencies
RUN npm install vite@^4.0.0 @vitejs/plugin-react@^4.0.0 --save-dev

# Keep container running
CMD ["tail", "-f", "/dev/null"] 