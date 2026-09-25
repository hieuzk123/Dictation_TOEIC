import asyncio
import os
import edge_tts

async def generate_part3_audio(output_path: str):
    """
    Generate Part 3 dialogue with 2 distinct native voices:
    Woman: en-US-JennyNeural
    Man: en-US-GuyNeural
    """
    lines = [
        ("en-US-JennyNeural", "Mark, did you get a chance to order the replacement toner cartridges for the fourth-floor printer? We're almost out of black ink."),
        ("en-US-GuyNeural", "I was about to, but our usual supplier is currently out of stock. They said new shipments won't arrive until next Tuesday."),
        ("en-US-JennyNeural", "That's a problem because the marketing team needs to print brochures for the client presentation on Monday morning."),
        ("en-US-GuyNeural", "Don't worry. I'll call a local office supply store downtown to see if we can pick some up this afternoon.")
    ]
    
    temp_files = []
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Generate each line
    combined_audio = bytearray()
    for idx, (voice, text) in enumerate(lines):
        communicate = edge_tts.Communicate(text, voice, rate="-5%")
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                combined_audio.extend(chunk["data"])
    
    with open(output_path, "wb") as f:
        f.write(combined_audio)
    print(f"Generated Part 3 audio: {output_path} ({len(combined_audio)} bytes)")

async def generate_part4_audio(output_path: str):
    """
    Generate Part 4 short talk / announcement:
    Announcer: en-US-AriaNeural
    """
    text = (
        "Attention passengers on Horizon Air Flight 418 to Seattle. "
        "Due to scheduled maintenance on the aircraft's navigation system, our departure has been delayed by approximately forty-five minutes. "
        "We now anticipate boarding to commence at gate 14 around two thirty. "
        "If you have connecting flights in Seattle, please speak with an agent at the customer service desk near gate 12. "
        "We apologize for the inconvenience and thank you for your patience."
    )
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    communicate = edge_tts.Communicate(text, "en-US-AriaNeural", rate="-4%")
    await communicate.save(output_path)
    print(f"Generated Part 4 audio: {output_path}")

async def main():
    base_dir = os.path.join(os.path.dirname(__file__), "sample_data")
    os.makedirs(base_dir, exist_ok=True)
    
    part3_audio = os.path.join(base_dir, "ets2024_test1_part3_q32_34.mp3")
    part4_audio = os.path.join(base_dir, "ets2024_test1_part4_q71_73.mp3")
    
    await generate_part3_audio(part3_audio)
    await generate_part4_audio(part4_audio)

if __name__ == "__main__":
    asyncio.run(main())
