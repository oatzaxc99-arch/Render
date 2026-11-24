# hf-thai-video

Thai 9:16 short-form video pipeline: **Paxa Labs TTS -> HyperFrames (HTML -> MP4)**, rendered on GitHub Actions.

## Setup (once)

1. Push this folder to a GitHub repo.
2. Repo -> Settings -> Secrets and variables -> Actions -> New secret:
   `PAXA_API_KEY` = your key from https://paxalabs.com/app/keys (starts with `pxa_`).
3. (Optional) add `assets/music.mp3` for background music.

## Make a video

1. Edit `project.json` (scenes: `narration`, `caption`, `sub`, `bg`).
   - `narration` is what Paxa speaks. Direction tags like `[warm, unhurried]` are supported by `paxa-tts-flash-v2`; they are stripped from on-screen text automatically.
   - `caption` / `sub` are the on-screen text. Omit `caption` to reuse the narration.
2. Commit + push (or Actions -> Render video -> Run workflow).
3. Download the `video` artifact from the finished run.

## Pipeline

| Step | Command | What it does |
|------|---------|--------------|
| TTS | `npm run tts` | One MP3 per scene -> `assets/audio/` (cached by content hash) |
| Build | `npm run build` | Measures audio with ffprobe, writes `index.html` (scene lengths follow the narration) |
| Lint | `npx hyperframes lint` | Validates the composition contract |
| Render | `npx hyperframes render` | HTML -> MP4 |

Local preview (optional): `npm i && PAXA_API_KEY=pxa_... npm run tts && npm run build && npx hyperframes preview`
Requires Node 22+ and FFmpeg.

## Notes

- Defaults: 1080x1920, 30 fps. Change in `project.json` -> `video`.
- Voice / model: `tts.voice`, `tts.model`; override per scene with `voice` / `speed`.
- Fonts: Noto Sans Thai / Thai TLWG are installed in CI so Thai text renders without network fonts.
