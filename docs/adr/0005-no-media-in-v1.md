# 0005: No photos or video in v1

- Date: 2026-10-07
- Status: Accepted

## Context
Photos and video would make logs richer. Many of the clubs this app targets do not allow
phones on the dancefloor, and media brings storage, transcoding, and moderation costs.

## Options considered
- **No media.** Text and ratings only.
- **Photos, capped per log.** Some storage cost and a moderation process.
- **Photos and video.** Highest storage, transcoding, and moderation cost.

## Decision
No photos or video in v1.

## Consequences
- No file storage, image processing, or media moderation in v1.
- Logs are text and ratings. Share previews use generated images, not user photos.
- Revisit if users ask for photos after launch.
