"""Test script to inspect Piper API."""
from piper import PiperVoice
from pathlib import Path

model_path = Path("models/piper/en_US-lessac-medium.onnx")
config_path = model_path.with_suffix('.onnx.json')

print("Loading Piper model...")
voice = PiperVoice.load(str(model_path), str(config_path))

print("\nPiperVoice methods:")
for attr in dir(voice):
    if not attr.startswith('_'):
        print(f"  - {attr}")

print("\nTesting synthesize method:")
text = "Hello world"
result = voice.synthesize(text)

print(f"Result type: {type(result)}")
print(f"Result is generator: {hasattr(result, '__iter__')}")

# Inspect first chunk
print("\nInspecting first audio chunk:")
for i, chunk in enumerate(result):
    print(f"\nChunk {i}:")
    print(f"  Type: {type(chunk)}")
    print(f"  Dir: {[attr for attr in dir(chunk) if not attr.startswith('_')]}")
    
    # Try to access data
    if hasattr(chunk, 'audio'):
        print(f"  chunk.audio type: {type(chunk.audio)}")
        print(f"  chunk.audio shape: {chunk.audio.shape if hasattr(chunk.audio, 'shape') else 'N/A'}")
    
    # Try different attributes
    for attr in ['audio', 'data', 'pcm', 'samples', 'bytes']:
        if hasattr(chunk, attr):
            val = getattr(chunk, attr)
            print(f"  chunk.{attr}: type={type(val)}, len={len(val) if hasattr(val, '__len__') else 'N/A'}")
    
    # If chunk is bytes-like
    if isinstance(chunk, (bytes, bytearray)):
        print(f"  Direct bytes length: {len(chunk)}")
    
    # If chunk is numpy array
    try:
        import numpy as np
        if isinstance(chunk, np.ndarray):
            print(f"  Numpy array: shape={chunk.shape}, dtype={chunk.dtype}")
            print(f"  Can convert to bytes: {chunk.tobytes()[:20]}")
    except:
        pass
    
    if i >= 2:  # Only check first 3 chunks
        break

print("\nTest complete!")
