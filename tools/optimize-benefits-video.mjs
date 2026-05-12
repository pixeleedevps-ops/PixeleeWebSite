import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const input = resolve(rootDir, "assets/videos/Desarrollo web .mp4");
const output = resolve(rootDir, "assets/videos/desarrollo-web-scroll.mp4");

if (!ffmpegPath || !existsSync(ffmpegPath)) {
  throw new Error("ffmpeg-static is not installed. Run `npm install` first.");
}

if (!existsSync(input)) {
  throw new Error(`Input video not found: ${input}`);
}

const args = [
  "-y",
  "-i", input,
  "-an",
  "-map_metadata", "-1",
  "-vf", "scale='min(1920,iw)':-2",
  "-c:v", "libx264",
  "-preset", "slow",
  "-crf", "20",
  "-pix_fmt", "yuv420p",
  "-profile:v", "high",
  "-level", "4.1",
  "-force_key_frames", "expr:gte(t,n_forced*0.25)",
  "-movflags", "+faststart",
  output
];

console.log(`Optimizing benefits video:\n${input}\n-> ${output}`);

const child = spawn(ffmpegPath, args, {
  stdio: "inherit"
});

child.on("exit", (code) => {
  if (code !== 0) {
    process.exitCode = code ?? 1;
    return;
  }

  console.log("Benefits video optimized for smoother scroll scrubbing.");
});
