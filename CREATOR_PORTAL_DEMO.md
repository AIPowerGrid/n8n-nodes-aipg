# Creator Portal Demo Runbook

This runbook is for the uncut, five-minute-or-shorter video requested by the
n8n Creator Portal. It demonstrates the exact public package without exposing
an API key, an account identifier, a wallet, or a credit balance.

## Before recording

1. Use a clean n8n instance with no AI Power Grid community package installed.
2. Create a disposable Grid key scoped to `account.read` and
   `inference.submit`. Fund only the small amount needed for two short text
   requests, then revoke the key after recording.
3. Keep the key in a password manager or a text field outside the captured
   area. Never paste it while the recording shows the clipboard or keystrokes.
4. Download `examples/creator-portal-review.json` locally. It contains no
   credentials or account-specific values.
5. Use text generation only. Media generation is supported, but it makes the
   review slower and adds no evidence that the node works as an AI-agent tool.

## Uncut recording sequence

Target duration: 3:30 to 4:30.

Submission status: package `0.1.3` entered n8n manual review on 2026-08-30.

1. Open **Settings -> Community nodes -> Install**.
2. Install the exact public package
   `@aipowergrid/n8n-nodes-aipg@0.1.3`. Show the installed package name,
   version, and **AI Power Grid** node.
3. Create a new workflow and insert **AI Power Grid** once from the node
   picker. Briefly show the four operations: text, image, video, and audio.
4. Open **Credentials -> New -> AI Power Grid API**. Paste the disposable key
   while the key field is masked, then run **Test credential**. Show only the
   successful result.
5. Import `examples/creator-portal-review.json` and attach the AI Power Grid
   credential to both AI Power Grid nodes.
6. Run **Generate text with AIPG**. Show the successful completed response and
   the bounded settings (`auto`, 256 output tokens). The larger bound leaves
   room for reasoning-capable workers to reach a visible final answer while
   remaining comfortably inside the demo spend ceiling.
7. Add an **OpenAI API** credential for **AIPG-compatible chat model** using
   the same disposable key and `https://api.aipowergrid.io/v1` as its base
   URL. Keep the key masked. Attach it to the chat-model node, which is pinned
   to the production-proven `qwen38-flash-next-125b-nvfp4` route because it
   emits the structured OpenAI tool call required by n8n's Tools Agent.
8. Open the test chat and ask: `Use your tool to explain AI Power Grid in one
   sentence.` Show the AI-agent execution calling **AI Power Grid tool** and
   returning the tool result.
9. End on the successful workflow execution and installed package version.

## Recording rules

- Record one continuous take. Do not cut around failed steps.
- Keep the browser console, terminal, environment variables, credentials,
  account pages, balances, and wallet addresses out of frame.
- Do not claim n8n endorsement, Creator Portal approval, token streaming, or
  confidential inference.
- State that standard n8n executions return completed responses and that
  prompts may be processed by independent Grid workers.
- If either request fails, stop, fix the cause, revoke the disposable key, and
  record a new full take. Do not submit a stitched video.

## After recording

1. Revoke the disposable Grid key.
2. Verify the video is under five minutes and contains no visible secret or
   account-specific information.
3. Upload the final video only when the Creator Portal submission is ready.
4. Record the submission date and portal status in
   `CREATOR_PORTAL_SUBMISSION.md`; do not call the package verified until the
   portal reports **Approved For Publish**.
