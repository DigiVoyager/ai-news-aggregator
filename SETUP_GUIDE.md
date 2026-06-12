# AI News Feed — Setup Guide (Plain Language)

This guide assumes zero technical background. Follow the steps in order.
Each step explains WHAT you're doing and WHY.

---

## What you're building

A website (your own URL) that:
- Checks 6 AI news sources every minute
- Shows headlines sorted by category (Industry, Research, Tools, Policy)
- Auto-tags stories with hashtags (#OpenAI, #LLM, etc.)
- Updates itself automatically, forever, with no ongoing work from you

Three free services work together:
1. **GitHub** = where your project's code lives (like Google Drive, but for code)
2. **Vercel** = the "engine" that runs your website and stores the news data
3. **cron-job.org** = a free alarm clock service. Every minute, it "rings" your
   website and says "go fetch new news now"

---

## STEP 1: Create a GitHub account

GitHub is just storage for your project's files. Think of it as a folder
that Vercel will read from.

1. Go to github.com
2. Sign up (free) using your email
3. Click "New repository" (the green button)
4. Name it `ai-news-aggregator`
5. Leave everything else default, click "Create repository"

You'll now see an empty page with some commands. Leave this tab open.

---

## STEP 2: Upload the project files to GitHub

I've built all the code already (in this conversation). You have two options:

**Option A (easier):** I package everything into a zip file for you to
download. On the GitHub page from Step 1, look for "uploading an existing
file" — click that, then drag in the unzipped folder contents.

**Option B:** If you're comfortable, I can give you the exact commands to
paste into a terminal (a text-based control window) instead.

→ I'll prepare the zip file for you next.

---

## STEP 3: Create a Vercel account and import your project

Vercel is the "engine" — it takes your code and turns it into a live
website with a real URL.

1. Go to vercel.com
2. Click "Sign Up" → choose "Continue with GitHub" (this links the two
   accounts so Vercel can see your project)
3. After signing in, click "Add New" → "Project"
4. Find `ai-news-aggregator` in the list and click "Import"
5. Leave all settings as default, click "Deploy"

Wait ~1-2 minutes. Vercel will give you a URL like:
`ai-news-aggregator-yourname.vercel.app`

This is your live site — but it won't show news yet. Two things are
still missing: (1) a database to store news, (2) the "alarm clock" to
fetch it. Steps 4-5 fix this.

---

## STEP 4: Add the database (Vercel KV)

"KV" stands for "Key-Value" — just a simple storage box. Your site needs
somewhere to save the news it collects every minute.

1. In your Vercel project page, click the "Storage" tab
2. Click "Create Database"
3. Choose "KV" (sometimes labeled "Upstash" or "Redis")
4. Name it anything, e.g. `news-storage`
5. Click "Create" then "Connect" to link it to your project

Vercel automatically adds some hidden settings (called "environment
variables") that let your code talk to this storage. You don't need to
touch these manually.

---

## STEP 5: Set your secret password (CRON_SECRET)

This stops random people on the internet from spamming your "fetch news"
button. You'll create a password, and only requests with that exact
password will work.

1. In Vercel, go to your project → "Settings" → "Environment Variables"
2. Add a new variable:
   - Name: `CRON_SECRET`
   - Value: make up any random password, e.g. `myAInewsSecret2026xyz`
     (write this down — you'll need it in Step 6)
3. Click "Save"
4. Go to "Deployments" tab, click the three dots on the latest deployment,
   click "Redeploy" (this makes the new password take effect)

---

## STEP 6: Set up the "alarm clock" (cron-job.org)

This is the service that pings your site every minute to fetch fresh news.

1. Go to cron-job.org, sign up (free)
2. Click "Create cronjob"
3. **Title**: AI News Refresh
4. **URL**: paste your Vercel URL + `/api/refresh-feeds`
   Example: `https://ai-news-aggregator-yourname.vercel.app/api/refresh-feeds`
5. **Schedule**: every 1 minute
6. Scroll to "Advanced" → "Request headers" → add:
   - Header name: `Authorization`
   - Header value: `Bearer myAInewsSecret2026xyz`
   (replace with YOUR password from Step 5 — keep the word "Bearer " before it)
7. Save and enable the job

---

## STEP 7: Visit your site

Go to your Vercel URL. Within 1-2 minutes, the cron job will have run at
least once, and headlines should appear.

If it's empty after 5 minutes, let me know and I'll help debug — the most
common issue is a typo in the password (Step 5/6) or the URL.

---

## Ongoing maintenance

None, really. It runs itself. Occasional things that might happen:
- A news source changes its feed format → that one source might stop
  showing up. Easy fix, just tell me and I'll patch it.
- Vercel free tier has generous limits; you're very unlikely to hit them
  with this small project.

---

## What I'll prepare next

A downloadable zip of all the code, ready for Step 2.
