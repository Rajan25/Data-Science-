import logging
from faster_whisper import WhisperModel
from openai import OpenAI

logging.basicConfig(level=logging.INFO)

model = WhisperModel("base", compute_type="int8")


def map_language(language_option):

    mapping = {
        "English": "en",
        "Hindi": "hi",
        "Hinglish": "en",
        "Odia": "hi",
        "Auto Detect": None
    }

    return mapping.get(language_option)


def translate_to_english(text, api_key):

    client = OpenAI(api_key=api_key)

    prompt = f"""
Translate the following content into English.

Do not summarize.
Do not add information.

{text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"user","content":prompt}]
    )

    return response.choices[0].message.content


def get_transcript(video_path, language_option, api_key):

    language_code = map_language(language_option)

    segments_generator, info = model.transcribe(
        video_path,
        language=language_code,
        beam_size=1
    )

    segments = []
    transcript_parts = []

    for seg in segments_generator:

        segments.append(seg)
        transcript_parts.append(seg.text)

    transcript_original = " ".join(transcript_parts)

    transcript_english = translate_to_english(
        transcript_original,
        api_key
    )

    return transcript_english, segments