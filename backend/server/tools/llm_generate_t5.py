#!/usr/bin/env python3
import os, sys, json

# This script reads JSON from stdin and outputs JSON with keys:
# { bullets: [..], summary: "..." }
# It uses a small encoder-decoder model (FLAN-T5) for local generation.

try:
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw else {}
except Exception:
    payload = {}

text = payload.get('text') or ''
missing = payload.get('missing') or []
present = payload.get('present') or []
topgood = payload.get('topGood') or []
domain = payload.get('domain') or 'generic'
model_name = os.environ.get('LLM_MODEL', 'google/flan-t5-small')
max_new = int(os.environ.get('LLM_MAX_NEW_TOKENS', '256'))

prompt = (
    f"You are a resume assistant. Domain: {domain}. "
    "Given the raw resume text, produce a concise professional summary (1-2 sentences) and 4-6 bullet points that are clear, action-driven, and use metrics when plausible. "
    "Prefer the following recommended or present skills if relevant. Output JSON with keys 'summary' (string) and 'bullets' (array of strings). Do not include any extra commentary.\n\n"
    f"Present skills: {', '.join(map(str, present))}\n"
    f"Recommended skills: {', '.join(map(str, missing))}\n"
    f"Strength terms: {', '.join(map(str, topgood))}\n\n"
    f"Resume text:\n{text[:6000]}\n\n"
    "JSON:"
)

try:
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
    tok = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    pipe = pipeline('text2text-generation', model=model, tokenizer=tok, device_map='auto')
    out = pipe(prompt, max_new_tokens=max_new, do_sample=False)
    generated = out[0]['generated_text'] if out and isinstance(out, list) else ''
except Exception as e:
    # On any failure, return empty outputs so the caller can fallback
    print(json.dumps({ 'summary': '', 'bullets': [] }))
    sys.exit(0)

# Try to parse JSON directly; otherwise, extract lines heuristically
try:
    data = json.loads(generated)
    summary = data.get('summary') if isinstance(data, dict) else ''
    bullets = data.get('bullets') if isinstance(data, dict) else []
    if not isinstance(bullets, list):
        bullets = []
except Exception:
    lines = [l.strip('-• ').strip() for l in generated.split('\n')]
    lines = [l for l in lines if l]
    summary = lines[0] if lines else ''
    bullets = lines[1:7]

# Final shape & trimming
bullets = [b.strip() for b in bullets if b.strip()][:8]
summary = (summary or '').strip()
print(json.dumps({ 'summary': summary, 'bullets': bullets }))