PRIME BARBADOS AUTOMATION PACK
VERSION: 2025-12-15

WHAT THIS IS
This package is the closest possible equivalent to “agent mode” without logging into your accounts.
It is a deploy-ready Vercel app plus n8n workflow imports plus a minimal operator setup wizard.
I cannot connect your Instagram, TikTok, X, Supabase, or Vercel accounts from chat.
You will still need to do a small number of clicks to connect OAuth and paste environment variables.

WHAT YOU WILL DO (10 TO 20 MINUTES IF YOU FOLLOW IN ORDER)
1) Create Supabase project (UI), then run the SQL in supabase/schema.sql (one paste).
2) Create a private Storage bucket named media (UI toggles).
3) Create a GitHub repo and upload this folder (drag and drop to GitHub web UI is fine).
4) Deploy to Vercel from that repo (one click), then paste env vars from .env.example.
5) Connect platform tokens:
   a) Instagram Graph API long-lived token and IG_USER_ID
   b) X OAuth2 refresh token and client id/secret
   c) TikTok user access token (for FILE_UPLOAD) and refresh token
6) Import the n8n workflows from n8n/workflows and set 2 env vars in n8n.

AFTER SETUP
You will use the Vercel “/setup” page to run live connection tests.
You will use the Vercel “/queue” page to see pending approvals and due publishes.

SECURITY RULES
Do not paste passwords or 2FA codes anywhere.
Only paste tokens into platform credential managers or Vercel env vars.
Do not store secrets in workflow JSON, repo code, or Supabase tables.

SUPPORT MODEL
If you want me to push this into your GitHub automatically, you must connect GitHub in ChatGPT and tell me the repository_full_name.
If you want me to generate a one-click Vercel deploy button URL, you will still need to click it and set env vars in Vercel.
