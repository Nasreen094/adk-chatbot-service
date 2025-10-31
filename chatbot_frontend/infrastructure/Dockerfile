FROM node:18-alpine AS builder

#set the working directory inside the container
WORKDIR /app

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# copy package files to the container
COPY package.json package-lock.json ./

# install dependencies
RUN npm install --legacy-peer-deps

COPY . ./

RUN npm run lint -- --fix || true

# Clear the npm cache to free up space
RUN npm cache clean --force

# Remove the Next.js cache directory to free up space
RUN rm -rf ./.next/cache

# build the Next.js app
RUN npm run build

# for production build
FROM node:18-alpine AS runner

# set the working directory inside the container
WORKDIR /app

# persist env variable for backend URL
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

# Copy package files for production install
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# copy the build output from the builder stage
COPY --from=builder /app/.next /app/.next
COPY --from=builder /app/public /app/public

# set the port
ENV PORT=3000

# expose the port for the frontend app
EXPOSE 3000

# create a non-root user and set permissions
RUN adduser -D nodeuser && chown -R nodeuser:nodeuser /app

# switch to the non-root user
USER nodeuser

# start the frontend app in production mode
CMD ["npm", "start"]
