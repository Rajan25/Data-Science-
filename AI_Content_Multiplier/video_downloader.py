import yt_dlp
import logging

logging.basicConfig(level=logging.INFO)


def download_audio(url):

    logging.info("Downloading audio for transcription")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": "audio.%(ext)s",
        "quiet": True,
        "noplaylist": True,
        "geo_bypass": True,
        "nocheckcertificate": True,
        "http_headers": {
            "User-Agent": "Mozilla/5.0"
        },
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192"
            }
        ]
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:

        info = ydl.extract_info(url, download=True)

        title = info.get("title", "")
        description = info.get("description", "")

    return "audio.mp3", title, description


def download_video(url):

    logging.info("Downloading video for clip generation")

    ydl_opts = {
        "format": "best[height<=720]",
        "outtmpl": "video.%(ext)s",
        "quiet": True,
        "noplaylist": True,
        "geo_bypass": True,
        "nocheckcertificate": True,
        "http_headers": {
            "User-Agent": "Mozilla/5.0"
        }
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:

        info = ydl.extract_info(url, download=True)

        ext = info.get("ext", "mp4")

    video_file = f"video.{ext}"

    return video_file
