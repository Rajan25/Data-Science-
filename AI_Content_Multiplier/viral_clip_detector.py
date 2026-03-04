import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")


def detect_viral_moments(segments):

    texts = [seg.text for seg in segments]

    embeddings = model.encode(texts)

    similarity_matrix = cosine_similarity(embeddings)

    scores = []

    for i in range(len(segments)):

        similarity_score = np.mean(similarity_matrix[i])

        uniqueness = 1 - similarity_score

        length_score = min(len(texts[i]) / 120, 1)

        score = (0.7 * uniqueness) + (0.3 * length_score)

        scores.append((i, score))

    scores.sort(key=lambda x: x[1], reverse=True)

    top = scores[:5]

    clips = []

    for idx, score in top:

        seg = segments[idx]

        clips.append({
            "start": seg.start,
            "end": seg.end,
            "text": seg.text
        })

    return clips