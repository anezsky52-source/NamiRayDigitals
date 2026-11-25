# NamiRayDigitals AI Gateway

## Included modules
- `custom-studio/minami-ai/index.html`: MINAMI AI 2.0 chat, local project/character memory, storyboard builder, prompt studio, and backend connector.
- `custom-studio/ai-generator/index.html`: image/video generator UI. Image generation can call this Worker directly; video generation uses a configurable provider adapter.
- `backend/cloudflare-worker.js`: Cloudflare Worker with chat, image, and video routes. Provider secrets stay on the server.

## Deploy (free-first path)
1. Create a Cloudflare Worker. For dashboard deployment, paste `backend/cloudflare-worker.js`. For Wrangler deployment, copy `backend/wrangler.toml.example` to `backend/wrangler.toml`, then run `npx wrangler deploy` from the `backend` directory.
2. Enable Cloudflare **Workers AI** and add a binding named exactly `AI` to the Worker (the Wrangler example already declares this binding).
3. The default chat model is `@cf/google/gemma-4-26b-a4b-it`; the default image model is `@cf/black-forest-labs/flux-2-klein-4b`. Both are current catalog models in Cloudflare documentation. If a model is unavailable to your account or plan, set Worker variables `AI_MODEL` or `IMAGE_MODEL` to models enabled for your account. FLUX.2 Klein uses multipart input for prompt and dimensions.
4. Set `ALLOWED_ORIGIN` to `https://anezsky52-source.github.io` (the GitHub Pages origin, without a path).
5. Deploy. In MINAMI AI 2.0 → AI Connection, paste the Worker URL and test it. With Wrangler, use `npx wrangler secret put VIDEO_API_KEY` only if your video adapter requires it.
6. The same backend URL is used by AI Generator. Open AI Generator and select Generate Image; if the Worker is connected, it calls `POST /api/image` and displays the returned image.

### Optional chat provider
Instead of Workers AI for chat, configure Worker secret `AI_API_KEY` and variables `AI_BASE_URL` (OpenAI-compatible chat-completions endpoint) and `AI_MODEL`. Never commit API keys.

### Optional video provider adapter
Video generation is **not automatically provided by Workers AI** in this template. To enable it, set:
- `VIDEO_API_URL`: HTTPS endpoint for a video provider or your own adapter.
- `VIDEO_API_KEY`: optional secret bearer token, if your provider requires one.

The adapter must accept `POST application/json` with:
```json
{
  "prompt": "cinematic motion prompt",
  "duration": 5,
  "aspect_ratio": "16:9",
  "image_base64": "optional base64 image without data URL prefix"
}
```
It must return JSON, ideally `{"video_url":"https://...","status":"completed"}` or a task identifier/status that your adapter understands. The UI displays the returned JSON and makes `video_url` clickable when supplied. Different providers use different authentication, payloads, polling, and media formats; implement those details in your adapter rather than assuming one generic API works for every service.

## API endpoints
- `GET /health` — service status and enabled route indicators.
- `POST /api/chat` — `{"message":"...","history":[],"context":{}}`.
- `POST /api/image` — `{"prompt":"...","aspect_ratio":"16:9","seed":123}`; returns image bytes.
- `POST /api/video` — payload described above; returns provider JSON.

## Security and usage notes
- Do not put provider API keys in browser code, localStorage, HTML, JavaScript, or Git.
- Restrict `ALLOWED_ORIGIN` to the GitHub Pages origin. Configure Cloudflare rate limiting / abuse protection for public endpoints before sharing widely; public Workers endpoints can otherwise be called by anyone. The example config is a starting point, not a production abuse-control policy.
- Workers AI and external providers have account-specific quotas, limits, and billing terms. Check your current Cloudflare dashboard and provider terms. “Free-first” does not mean unlimited free generation.
- GitHub Pages cannot execute the Worker. The Worker must be deployed separately.
- Local project/character memory and storyboard data are saved in the current browser only. Export project memory and storyboard backups when needed.
- Video generation remains disabled until a real `VIDEO_API_URL` adapter is configured. External links in the UI are manual fallbacks, not a connected in-page video renderer.
