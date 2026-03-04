import logging
from openai import OpenAI

logging.basicConfig(level=logging.INFO)

MODEL = "gpt-4o-mini"


def extract_ideas(transcript, api_key):

    client = OpenAI(api_key=api_key)

    logging.info("Extracting key ideas")

    prompt = f"""
Extract the 5 most important ideas from the following content.

Return them as bullet points.

Content:
{transcript[:5000]}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


def generate_hooks(ideas, api_key):

    client = OpenAI(api_key=api_key)

    logging.info("Generating viral hooks")

    prompt = f"""
Generate 5 high-engagement hooks for social media.

Hooks should create curiosity and make people want to read further.

Ideas:
{ideas}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


def linkedin_post(title, description, transcript, api_key):

    client = OpenAI(api_key=api_key)

    logging.info("Generating LinkedIn summary")

    prompt = f"""
Create a LinkedIn post summarizing this video.

STRICT RULES
- Use only the information provided
- Do not add external knowledge
- Do not say "from the transcript" or "the video says"

TITLE
{title}

DESCRIPTION
{description}

CONTENT
{transcript[:5000]}

FORMAT

Hook

Key Takeaways
• point
• point
• point
• point
• point

Closing insight
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role":"user","content":prompt}]
    )

    return response.choices[0].message.content


def twitter_thread(title, description, transcript, api_key):

    client = OpenAI(api_key=api_key)

    logging.info("Generating Twitter thread")

    prompt = f"""
Create a Twitter thread summarizing this video.

RULES
- Use only the information provided
- Do not invent information
- Each tweet should contain one insight

TITLE
{title}

DESCRIPTION
{description}

CONTENT
{transcript[:5000]}

FORMAT

Tweet 1 - Hook
Tweet 2 - Insight
Tweet 3 - Insight
Tweet 4 - Insight
Tweet 5 - Insight
Tweet 6 - Insight
Tweet 7 - Closing thought
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role":"user","content":prompt}]
    )

    return response.choices[0].message.content


def instagram_carousel(ideas, api_key):

    client = OpenAI(api_key=api_key)

    logging.info("Generating Instagram carousel")

    prompt = f"""
Create a 6-slide Instagram carousel.

Slide 1: Hook
Slide 2-5: Insights
Slide 6: Call to action

Ideas:
{ideas}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role":"user","content":prompt}]
    )

    return response.choices[0].message.content