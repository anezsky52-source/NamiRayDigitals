# NamiRayDigitals AI Gateway

## What is included
- `custom-studio/minami-ai/index.html`: Minami AI 2.0 interface, local project/character memory, prompt studio, and backend connector.
- `backend/cloudflare-worker.js`: OpenAI-compatible Cloudflare Worker proxy. Provider credentials remain server-side.
- This static website still works in local/offline-assistant mode without a provider key.

## Deploy the backend
1. Create a Cloudflare Worker and paste `backend/cloudflare-worker.js`.
2. For the free-first option, enable **Workers AI** in Cloudflare and add an AI binding named `AI` to this Worker. The template uses `@cf/meta/llama-3.1-8b-instruct` by default; set `AI_MODEL` to a model currently available to your account if needed. No provider API key is required for this binding.
3. Alternatively, set Worker secret `AI_API_KEY` and variables `AI_BASE_URL` (default: `https://api.openai.com/v1/chat/completions`) and `AI_MODEL` for an OpenAI-compatible provider.
4. Set `ALLOWED_ORIGIN` to the exact GitHub Pages origin, e.g. `https://anezsky52-source.github.io`.
5. Deploy and open the Minami AI 2.0 module. In AI Connection, paste the Worker URL and test.

Do not commit API keys. Do not put provider keys into browser storage, HTML, JavaScript, or GitHub Pages. Workers AI and other providers have account-specific quotas and billing terms; confirm current limits before use. GitHub Pages cannot run this Worker by itself.

## Endpoints
- `GET /health`
- `POST /api/chat` with JSON: `{"message":"...","history":[],"context":{}}`

## Limits / honest status
The prompt studio creates prompts only; it does not render images or videos. Actual image/video generation requires a provider with a compatible media API and its own backend adapter. Local character memory is stored in the current browser only; export JSON to back it up.
