import json
import os
import re
from typing import List, Dict, Any
from faster_whisper import WhisperModel

# Common English stopwords (articles, prepositions, auxiliary verbs, pronouns)
STOPWORDS = {
    "a", "an", "the", "in", "on", "at", "to", "for", "with", "and", "or", "but",
    "is", "am", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did",
    "can", "could", "will", "would", "shall", "should", "may", "might", "must",
    "it", "its", "they", "them", "their", "theirs", "we", "us", "our", "ours",
    "you", "your", "yours", "he", "him", "his", "she", "her", "hers", "i", "me", "my", "mine",
    "this", "that", "these", "those", "of", "from", "by", "as", "if", "so", "than", "too", "very",
    "just", "about", "into", "through", "during", "before", "after", "above", "below", "up", "down",
    "there", "here", "where", "when", "why", "how", "all", "any", "both", "each", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same", "then", "now"
}

def clean_word(token: str) -> str:
    """Strip punctuation and lowercase for comparison, preserving internal hyphens and apostrophes."""
    return re.sub(r"[^\w\s'-]", "", token).strip()

def is_important_word(word: str) -> bool:
    """Check if a word is a keyword for dictation blanking."""
    cleaned = clean_word(word).lower()
    if not cleaned or len(cleaned) <= 1:
        return False
    if cleaned in STOPWORDS:
        return False
    return True

class ToeicDataPipeline:
    def __init__(self, model_size: str = "base", device: str = "cpu"):
        print(f"Loading Whisper model '{model_size}' on {device}...")
        self.model = WhisperModel(model_size, device=device, compute_type="int8")
        print("Model loaded successfully.")

    def process_item(
        self,
        audio_path: str,
        transcript_path: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process an audio file and its ground truth transcript:
        1. Read ground truth lines (sentences).
        2. Transcribe audio with word-level timestamps using faster-whisper.
        3. Align ground truth sentences with timestamps.
        4. Generate tokens with `is_keyword` metadata for Cloze testing.
        """
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
        if not os.path.exists(transcript_path):
            raise FileNotFoundError(f"Transcript file not found: {transcript_path}")

        # Read ground truth sentences
        with open(transcript_path, "r", encoding="utf-8") as f:
            gt_lines = [line.strip() for line in f if line.strip()]

        print(f"Transcribing '{os.path.basename(audio_path)}' ({len(gt_lines)} sentences in ground truth)...")
        segments_gen, info = self.model.transcribe(
            audio_path,
            word_timestamps=True,
            language="en",
            beam_size=5
        )

        all_words = []
        for segment in segments_gen:
            if segment.words:
                for w in segment.words:
                    all_words.append({
                        "word": w.word.strip(),
                        "start": round(w.start, 2),
                        "end": round(w.end, 2),
                        "probability": round(w.probability, 2)
                    })

        print(f"Extracted {len(all_words)} timestamped words from audio.")

        # Align ground truth sentences with word timestamps sequentially
        aligned_segments = []
        word_cursor = 0
        total_words_count = len(all_words)

        for seg_idx, sentence in enumerate(gt_lines, start=1):
            sentence_words = sentence.split()
            seg_tokens = []
            seg_start = None
            seg_end = None

            for raw_token in sentence_words:
                cleaned = clean_word(raw_token)
                matched_w = None

                # Search forward for the matching word in timestamped words
                for lookahead in range(word_cursor, min(word_cursor + 8, total_words_count)):
                    cand = clean_word(all_words[lookahead]["word"])
                    if cand.lower() == cleaned.lower():
                        matched_w = all_words[lookahead]
                        word_cursor = lookahead + 1
                        break

                if matched_w:
                    token_start = matched_w["start"]
                    token_end = matched_w["end"]
                else:
                    # Fallback estimate based on neighboring words
                    token_start = seg_end if seg_end is not None else (aligned_segments[-1]["end_time"] if aligned_segments else 0.0)
                    token_end = token_start + 0.4

                if seg_start is None:
                    seg_start = token_start
                seg_end = token_end

                seg_tokens.append({
                    "raw": raw_token,
                    "word": cleaned,
                    "start_time": token_start,
                    "end_time": token_end,
                    "is_keyword": is_important_word(cleaned)
                })

            # Add slight buffer (0.15s) to sentence start/end for smooth playback
            buffered_start = max(0.0, round(seg_start - 0.05, 2))
            buffered_end = round(seg_end + 0.15, 2)

            aligned_segments.append({
                "segment_index": seg_idx,
                "start_time": buffered_start,
                "end_time": buffered_end,
                "full_transcript": sentence,
                "total_words": len(seg_tokens),
                "keyword_count": sum(1 for t in seg_tokens if t["is_keyword"]),
                "tokens": seg_tokens
            })

        output_data = {
            "year": metadata.get("year", "ETS 2024"),
            "test_number": metadata.get("test_number", 1),
            "part": metadata.get("part", 3),
            "item_number": metadata.get("item_number", "32-34"),
            "title": metadata.get("title", "Practice Item"),
            "audio_filename": os.path.basename(audio_path),
            "audio_duration": round(info.duration, 2),
            "total_segments": len(aligned_segments),
            "segments": aligned_segments
        }

        return output_data

def main():
    base_dir = os.path.join(os.path.dirname(__file__), "sample_data")
    output_dir = os.path.join(os.path.dirname(__file__), "output")
    os.makedirs(output_dir, exist_ok=True)

    items_to_process = [
        {
            "audio": os.path.join(base_dir, "ets2024_test1_part3_q32_34.mp3"),
            "transcript": os.path.join(base_dir, "ets2024_test1_part3_q32_34.txt"),
            "metadata": {
                "year": "ETS 2024",
                "test_number": 1,
                "part": 3,
                "item_number": "32-34",
                "title": "Office Supply Toner Order"
            },
            "output_json": "ets2024_test1_part3_q32_34.json"
        },
        {
            "audio": os.path.join(base_dir, "ets2024_test1_part4_q71_73.mp3"),
            "transcript": os.path.join(base_dir, "ets2024_test1_part4_q71_73.txt"),
            "metadata": {
                "year": "ETS 2024",
                "test_number": 1,
                "part": 4,
                "item_number": "71-73",
                "title": "Airport Flight Delay Announcement"
            },
            "output_json": "ets2024_test1_part4_q71_73.json"
        }
    ]

    pipeline = ToeicDataPipeline(model_size="base")

    for item in items_to_process:
        print(f"\nProcessing {item['metadata']['title']}...")
        result = pipeline.process_item(item["audio"], item["transcript"], item["metadata"])
        out_path = os.path.join(output_dir, item["output_json"])
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(f"Successfully generated: {out_path}")

if __name__ == "__main__":
    main()
