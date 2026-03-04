import yt_dlp
import logging

logging.basicConfig(level=logging.INFO)


def download_video(url):

    logging.info("Downloading video")

    ydl_opts = {
        "format": "best[height<=720]",
        "outtmpl": "video.%(ext)s"
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:

        info = ydl.extract_info(url, download=True)

        title = info.get("title", "")
        description = info.get("description", "")
        ext = info.get("ext", "mp4")

    video_file = f"video.{ext}"

    return video_file, title, description