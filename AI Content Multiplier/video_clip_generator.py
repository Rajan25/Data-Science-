import subprocess
import logging

logging.basicConfig(level=logging.INFO)


def generate_short_clips(video_path, clips):

    generated_clips = []

    for i, clip in enumerate(clips):

        start = clip["start"]
        end = clip["end"]

        duration = end - start

        # ensure minimum clip length
        if duration < 15:
            duration = 20

        output_file = f"short_clip_{i}.mp4"

        command = [
            "ffmpeg",
            "-y",
            "-ss", str(start),
            "-i", video_path,
            "-t", str(duration),
            "-c:v", "libx264",
            "-c:a", "aac",
            "-strict", "experimental",
            output_file
        ]

        logging.info(f"Generating clip {i}")

        subprocess.run(
            command,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        generated_clips.append(output_file)

    logging.info("Short clips created")

    return generated_clips