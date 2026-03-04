import logging
from openai import OpenAI

logging.basicConfig(level=logging.INFO)

client = OpenAI()

MODEL = "gpt-4o-mini"


def extract_ideas(transcript):

    logging.info("Extracting key ideas")

    prompt = f"""
Extract the 5 most important ideas from this content.

Return as bullet points.

Content:
{transcript[:5000]}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


def generate_hooks(ideas):

    logging.info("Generating viral hooks")

    prompt = f"""
Generate 5 viral hooks for social media.

Ideas:
{ideas}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


def linkedin_post(title, description, transcript):

    logging.info("Generating LinkedIn summary")

    prompt = f"""
Create a LinkedIn post summarizing this content.

RULES
- Use only the information provided
- Do not add outside knowledge
- Do not mention transcript or speaker

TITLE
{title}

DESCRIPTION
{description}

CONTENT
{transcript[:5000]}

FORMAT

Hook

Key Takeaways
• idea
• idea
• idea
• idea
• idea

Closing insight
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role":"user","content":prompt}]
    )

    return response.choices[0].message.content


def twitter_thread(title, description, transcript):

    logging.info("Generating Twitter thread")

    prompt = f"""
Create a Twitter thread summarizing this content.

RULES
- Only use the information provided
- Do not add external knowledge
- Do not mention transcript or speaker

TITLE
{title}

DESCRIPTION
{description}

CONTENT
{transcript[:5000]}

FORMAT

Tweet1 Hook
Tweet2 Insight
Tweet3 Insight
Tweet4 Insight
Tweet5 Insight
Tweet6 Insight
Tweet7 Closing takeaway
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role":"user","content":prompt}]
    )

    return response.choices[0].message.content


def instagram_carousel(ideas):

    logging.info("Generating Instagram carousel")

    prompt = f"""
Create a 6-slide Instagram carousel.

Slide1 Hook
Slide2-5 insights
Slide6 CTA

Ideas
{ideas}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role":"user","content":prompt}]
    )

    return response.choices[0].message.content