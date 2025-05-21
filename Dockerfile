FROM denoland/deno:2.3.3

# Create working directory
WORKDIR /app

# Copy source
COPY . .

# Run the app
CMD ["deno", "run", "-A", "server/main.ts"]
