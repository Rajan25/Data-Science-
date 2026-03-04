import streamlit as st
import re

from video_downloader import download_video
from transcriber import get_transcript
from content_engine import (
    extract_ideas,
    generate_hooks,
    linkedin_post,
    twitter_thread,
    instagram_carousel
)
from viral_clip_detector import detect_viral_moments
from video_clip_generator import generate_short_clips


st.set_page_config(
    page_title="AI Content Multiplier",
    layout="wide"
)

st.title("AI Content Multiplier")


def get_youtube_video_id(url):

    pattern = r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})"

    match = re.search(pattern, url)

    if match:
        return match.group(1)

    return None


url = st.text_input("Paste YouTube URL")

language_option = st.selectbox(
    "Select Video Language",
    [
        "Auto Detect",
        "English",
        "Hindi",
        "Odia",
        "Hinglish"
    ]
)


if url:

    video_id = get_youtube_video_id(url)

    if video_id:

        thumbnail = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"

        st.subheader("Video Preview")

        col1, col2 = st.columns([1,2])

        with col1:
            st.image(thumbnail)

        with col2:
            st.video(url)


if st.button("Generate Content"):

    progress = st.progress(0)

    st.write("Downloading video...")

    video_file, title, description = download_video(url)

    progress.progress(15)

    st.subheader("Video Title")
    st.write(title)

    st.subheader("Video Description")
    st.write(description[:500])

    st.write(f"Language selected: {language_option}")

    st.write("Transcribing video...")

    transcript, segments = get_transcript(video_file, language_option)

    progress.progress(40)

    st.write("Extracting ideas...")

    ideas = extract_ideas(transcript)

    progress.progress(55)

    st.subheader("Ideas")
    st.write(ideas)

    st.write("Generating hooks...")

    hooks = generate_hooks(ideas)

    st.subheader("Hooks")
    st.write(hooks)

    progress.progress(65)

    st.write("Generating LinkedIn post...")

    linkedin = linkedin_post(title, description, transcript)

    st.subheader("LinkedIn Post")
    st.write(linkedin)

    progress.progress(75)

    st.write("Generating Twitter thread...")

    twitter = twitter_thread(title, description, transcript)

    st.subheader("Twitter Thread")
    st.write(twitter)

    progress.progress(85)

    st.write("Generating Instagram carousel...")

    carousel = instagram_carousel(ideas)

    st.subheader("Instagram Carousel")
    st.write(carousel)

    progress.progress(92)

    st.write("Detecting viral clips...")

    clips = detect_viral_moments(segments)

    st.subheader("Viral Moments")

    for clip in clips:

        st.write(f"{clip['start']:.2f} - {clip['end']:.2f}")
        st.write(clip["text"])

    progress.progress(95)

    st.write("Generating short clips...")

    short_videos = generate_short_clips(video_file, clips)

    st.subheader("Generated Shorts")

    for video in short_videos:
        st.video(video)

    progress.progress(100)

    st.success("Content generation complete")