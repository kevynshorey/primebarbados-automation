import { verifySignature, makeCorrelationId } from "../../../../lib/signing";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifySignature(raw, sig)) return Response.json({ ok: false, error: "bad_signature" }, { status: 401 });

  const body = JSON.parse(raw);
  const owner = process.env.GITHUB_OWNER as string;
  const repo = process.env.GITHUB_REPO as string;
  const token = process.env.GITHUB_TOKEN as string;

  if (!owner || !repo || !token) return Response.json({ ok: false, error: "github_not_configured" }, { status: 400 });

  const slug = body.slug || `post-${Date.now()}`;
  const branch = `pb-blog-${slug}-${Date.now()}`;

  const baseRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, {
    headers: { Authorization: `token ${token}` }
  });
  if (!baseRes.ok) return Response.json({ ok: false, error: "base_branch_fetch_failed" }, { status: 400 });
  const base = await baseRes.json();
  const baseSha = base.object.sha;

  const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha })
  });
  if (!refRes.ok) return Response.json({ ok: false, error: "branch_create_failed" }, { status: 400 });

  const path = `content/posts/${slug}.mdx`;
  const content = body.mdx || `# ${body.title || "Post"}\n`;

  const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
    method: "POST",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content, encoding: "utf-8" })
  });
  if (!blobRes.ok) return Response.json({ ok: false, error: "blob_create_failed" }, { status: 400 });
  const blob = await blobRes.json();

  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      base_tree: baseSha,
      tree: [{ path, mode: "100644", type: "blob", sha: blob.sha }]
    })
  });
  if (!treeRes.ok) return Response.json({ ok: false, error: "tree_create_failed" }, { status: 400 });
  const tree = await treeRes.json();

  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: `PB blog: ${slug}`, tree: tree.sha, parents: [baseSha] })
  });
  if (!commitRes.ok) return Response.json({ ok: false, error: "commit_create_failed" }, { status: 400 });
  const commit = await commitRes.json();

  const upd = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: "PATCH",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sha: commit.sha, force: true })
  });
  if (!upd.ok) return Response.json({ ok: false, error: "branch_update_failed" }, { status: 400 });

  const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ title: body.title || `PB blog: ${slug}`, head: branch, base: "main", body: "Automated draft" })
  });
  if (!prRes.ok) return Response.json({ ok: false, error: "pr_create_failed" }, { status: 400 });
  const pr = await prRes.json();

  return Response.json({ ok: true, pr_url: pr.html_url, branch, path });
}
