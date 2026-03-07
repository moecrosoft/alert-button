import OpenAI from "openai";
import { execSync, spawn } from "child_process";
import { writeFile, readdir, readFile, rm, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function resolveFfmpeg() {
  const candidates = [
    join(process.cwd(), "node_modules/ffmpeg-static/ffmpeg"),
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
  ];

  for (const p of candidates) {
    try {
      execSync(`test -x "${p}"`, { stdio: "ignore" });
      return p;
    } catch {}
  }

  try {
    return execSync("which ffmpeg", { encoding: "utf8" }).trim();
  } catch {}

  throw new Error("ffmpeg not found. Run: brew install ffmpeg");
}

// Resolved once synchronously at module load — no async, no webpack
const FFMPEG_PATH = resolveFfmpeg();

async function extractFrames(buffer, mimeType) {
  const workDir = join(tmpdir(), randomUUID());
  await mkdir(workDir, { recursive: true });

  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const videoPath = join(workDir, `input.${ext}`);
  await writeFile(videoPath, buffer);

  await new Promise((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH, [
      "-i", videoPath,
      "-vf", "fps=0.5",
      "-frames:v", "10",
      "-q:v", "2",
      join(workDir, "frame-%03d.jpg")
    ]);
    proc.on("close", code =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`))
    );
    proc.stderr.on("data", () => {});
  });

  const files = (await readdir(workDir))
    .filter(f => f.startsWith("frame-"))
    .sort();

  const frames = await Promise.all(
    files.map(f => readFile(join(workDir, f)))
  );

  await rm(workDir, { recursive: true, force: true });
  return frames;
}

export async function analyseVideo(file) {
  const openai = getOpenAI();

  const buffer = Buffer.from(await file.arrayBuffer());
  const frames = await extractFrames(buffer, file.type);

  if (frames.length === 0) {
    throw new Error("No frames could be extracted from the video");
  }

  const prompt = `
You are an AI emergency monitoring system analysing frames from a security camera recording.

Carefully analyse all the provided frames and determine the situation.

Classify into ONE category:

urgent
Immediate danger such as:
- physical violence
- weapon present
- fire
- car accident
- person unconscious
- medical emergency
- robbery

non-urgent
Suspicious or concerning activity but not immediate danger:
- argument
- person loitering
- suspicious movement
- minor disturbance

false alarm
Normal everyday activity:
- walking
- normal behaviour

Return STRICT JSON:

{
  "classification": "urgent | non-urgent | false alarm",
  "confidence": "low | medium | high",
  "reason": "short explanation"
}
`;

  const imageContent = frames.map(frameBuffer => ({
    type: "image_url",
    image_url: {
      url: `data:image/jpeg;base64,${frameBuffer.toString("base64")}`,
      detail: "low"
    }
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...imageContent
        ]
      }
    ],
    response_format: { type: "json_object" }
  });

  return response.choices[0].message.content;
}