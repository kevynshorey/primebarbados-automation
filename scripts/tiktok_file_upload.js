import fs from "fs";

async function apiPost(url, accessToken, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8", "Authorization": `Bearer ${accessToken}` },
    body: JSON.stringify(payload)
  });
  const out = await res.json();
  if (!res.ok) throw new Error(`tiktok_api_error_${res.status}_${JSON.stringify(out)}`);
  return out;
}

async function putChunk(uploadUrl, mime, chunk, start, end, total) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mime,
      "Content-Length": String(chunk.length),
      "Content-Range": `bytes ${start}-${end}/${total}`
    },
    body: chunk
  });
  if (!(res.status === 200 || res.status === 201 || res.status === 206)) {
    const text = await res.text().catch(() => "");
    throw new Error(`tiktok_chunk_failed_${res.status}_${text}`);
  }
  return res.status;
}

function chooseChunkSize(totalBytes) {
  const preferred = 10 * 1024 * 1024;
  return Math.min(preferred, totalBytes);
}

async function main() {
  const cfg = JSON.parse(fs.readFileSync(process.argv[2], "utf-8"));
  const accessToken = cfg.access_token;
  const initUploadUrl = cfg.init_upload_url;
  const initPostUrl = cfg.init_post_url;
  const videoPath = cfg.video_path;
  const caption = cfg.caption || "";

  const buf = fs.readFileSync(videoPath);
  const total = buf.length;
  const chunkSize = chooseChunkSize(total);
  const totalChunks = Math.floor(total / chunkSize) + (total % chunkSize === 0 ? 0 : 1);

  const initUpload = await apiPost(initUploadUrl, accessToken, {
    source_info: {
      source: "FILE_UPLOAD",
      video_size: total,
      chunk_size: chunkSize,
      total_chunk_count: totalChunks
    }
  });

  const uploadUrl = initUpload?.data?.upload_url || initUpload?.data?.uploadUrl || initUpload?.upload_url;
  if (!uploadUrl) throw new Error("tiktok_missing_upload_url");

  const mime = "video/mp4";
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize - 1, total - 1);
    const chunk = buf.subarray(start, end + 1);
    await putChunk(uploadUrl, mime, chunk, start, end, total);
  }

  const initPost = await apiPost(initPostUrl, accessToken, {
    post_info: { title: caption },
    source_info: { source: "FILE_UPLOAD" }
  });

  console.log(JSON.stringify({ ok: true, initUpload, initPost }, null, 2));
}

main().catch(e => {
  console.error(JSON.stringify({ ok: false, error: e.message || String(e) }));
  process.exit(1);
});
