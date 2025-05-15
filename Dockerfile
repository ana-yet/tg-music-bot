# Use Node.js base image
FROM node:18

# Install ffmpeg and yt-dlp
RUN apt update && \
    apt install -y ffmpeg curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy files and install dependencies
COPY . .
RUN npm install

# Expose a port (optional for Telegram bots, but required by Railway)
EXPOSE 3000

# Start the bot
CMD ["node", "bot.js"]
