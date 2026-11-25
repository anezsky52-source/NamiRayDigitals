# NamiRayDigitals AI Gateway

## What is included
- `custom-studio/minami-ai/index.html`: Minami AI 2.0 interface, local project/character memory, prompt studio, and backend connector.
- `backend/cloudflare-worker.js`: OpenAI-compatible Cloudflare Worker proxy. Provider credentials remain server-side.
- This static website still works in local/offline-assistant mode without a provider key.

## Deploy the backend
1. Create a Cloudflare Worker and paste `backend/cloudflare-worker.js`.
2. Set Worker secret `AI_API_KEY` to a provider API key.
3. Set Worker variable `AI_BASE_URL` to the provider's OpenAI-compatible chat-completions endpoint (default: `https://api.openai.com/v1/chat/completions`).
4. Set `AI_MODEL` to a model supported by that provider.
5. Set `ALLOWED_ORIGIN` to the exact GitHub Pages origin, e.g. `https://anezsky52-source.github.io`.
6. Deploy and open the Minami AI 2.0 module. In AI Connection, paste the Worker URL and test.

Do not commit API keys. Do not put provider keys into browser storage, HTML, JavaScript, or GitHub Pages. Provider use may incur charges; check its current free-tier and billing rules. GitHub Pages cannot run this Worker by itself.

## Endpoints
- `GET /health`
- `POST /api/chat` with JSON: `{"message":"...","history":[],"context":{}}`

## Limits / honest status
The prompt studio creates prompts only; it does not render images or videos. Actual image/video generation requires a provider with a compatible media API and its own backend adapter. Local character memory is stored in the current browser only; export JSON to back it up.
