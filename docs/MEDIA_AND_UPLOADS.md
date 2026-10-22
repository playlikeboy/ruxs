# RUXs Media, Uploads & Micro-Animations Guide

## 1. ImgBB Image Hosting Integration

All merchant and admin image uploads (store banners, profile avatars, verification certificates, photo galleries, and card posters) use the ImgBB REST API.

- **API Key**: `f17ca0bb7aec377dd84d30b752c8d6ba`
- **Client & Server Integration**:
  - `src/lib/imgbb.ts`: `uploadToImgbb(file: File)` converts images into FormData and dispatches to `https://api.imgbb.com/1/upload`.
  - `src/features/assets/actions.ts`: `uploadImageAction` server action for server-side upload flows.
  - `src/components/ui/image-upload.tsx`: UI upload component with instant preview, loading state, fallback URL manual input, certificate multi-file grid, and full-resolution modal preview.

---

## 2. YouTube Preview Videos

Vendors can showcase their classroom, teaching style, robotics demonstrations, or dance performances via YouTube preview links:

- **Supported URL Formats**:
  - Standard watch URLs: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
  - Shortened URLs: `https://youtu.be/dQw4w9WgXcQ`
  - YouTube Shorts: `https://youtube.com/shorts/dQw4w9WgXcQ`
  - Embed URLs: `https://www.youtube.com/embed/dQw4w9WgXcQ`
- **Core Processor**: `src/core/media.ts`
  - `extractYouTubeVideoId(url)` extracts the unique 11-character video ID.
  - `getYouTubeEmbedUrl(url)` generates privacy-compliant embed URLs with `rel=0&modestbranding=1&playsinline=1`.
  - `getYouTubeThumbnailUrl(url)` provides fallback card thumbnails (`hqdefault.jpg`).

---

## 3. Micro-Interaction Animated Icons (`animate-icons`)

Following the playful, high-engagement aesthetic of `Avijit07x/animateicons`, RUXs features custom animated SVG micro-interaction icons in `src/components/ui/animate-icons.tsx`:

- `AnimateTeddyIcon`: Kids category header and toggle.
- `AnimateBalloonIcon`: Birthday and celebratory workshop activities.
- `AnimateRocketIcon`: STEM, science, and space exploration.
- `AnimatePaletteIcon`: Painting, drawing, and crafts.
- `AnimateMusicIcon`: Singing, guitar, and keyboard lessons.
- `AnimateRobotIcon`: Coding, robotics, and mechanics.
- `AnimateCampIcon`: Outdoor and holiday camps.
- `AnimatePuzzleIcon`: Chess, Rubik's cube, and logic games.
- `AnimateShieldCheckIcon`: Parent trust and child safeguarding guarantee.
- `AnimateCertificateIcon`: Verified mentor credential tags.
- `AnimateVideoPlayIcon`: Preview class video buttons.
- `AnimateHomeIcon`: Household everyday store switcher.

All icons include hover transitions, floating keyframes, and accessible SVG labels.
