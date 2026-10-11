"""Génère les phrases d'échantillon avec une voix Piper (voix française libre)."""
import sys, wave
from piper import PiperVoice
model, speaker, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
voice = PiperVoice.load(model)
lines = [l.strip() for l in open("tools/phrases_echantillon.txt", encoding="utf-8") if l.strip()]
for i, text in enumerate(lines, 1):
    with wave.open(f"out/{prefix}_{i}.wav", "wb") as wf:
        try:
            from piper import SynthesisConfig
            cfg = SynthesisConfig(speaker_id=int(speaker) if speaker else None, length_scale=1.08)
            voice.synthesize_wav(text, wf, syn_config=cfg)
        except ImportError:
            voice.synthesize(text, wf, speaker_id=int(speaker) if speaker else None, length_scale=1.08, sentence_silence=0.25)
print("ok", prefix)
