require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const yts = require("yt-search");
const youtubedl = require("youtube-dl-exec").raw;
const fs = require("fs");
const path = require("path");

const token = process.env.BOT_TOKEN;

// Only for Render hosting
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is running"));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

const bot = new TelegramBot(token, { polling: true });
const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

// Path to local yt-dlp binary
const YT_DLP_PATH = path.join(__dirname, "bin", "yt-dlp");

// /play command
bot.onText(/\/play (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  bot.sendMessage(chatId, `Searching top results for "${query}"...`);

  try {
    const results = await yts(query);
    const topVideos = results.videos.slice(0, 5);

    if (!topVideos.length) {
      return bot.sendMessage(chatId, "No results found.");
    }

    const inlineKeyboard = topVideos.map((video) => [
      {
        text: `${video.title} (${video.timestamp})`,
        callback_data: `yt::${video.videoId}`,
      },
    ]);

    bot.sendMessage(chatId, "Choose a video:", {
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Error fetching results.");
  }
});

// Handle video selection
bot.on("callback_query", async (callback) => {
  const chatId = callback.message.chat.id;
  const videoId = callback.data.split("yt::")[1];

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const safeName = videoId + ".m4a";
    const filePath = path.join(cacheDir, safeName);

    bot.sendMessage(chatId, "Downloading... please wait");

    if (fs.existsSync(filePath)) {
      return bot.sendAudio(chatId, filePath);
    }

    await youtubedl(videoUrl, {
      exec: YT_DLP_PATH,
      output: filePath,
      format: "bestaudio[ext=m4a]/bestaudio",
    });

    bot.sendAudio(chatId, filePath);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Error downloading the audio.");
  }
});
