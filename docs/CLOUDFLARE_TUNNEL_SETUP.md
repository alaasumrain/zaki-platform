# Exposing OpenClaw Securely with Cloudflare Tunnels & Workers VPC

**Date:** 2026-02-04  
**Purpose:** Guide for exposing OpenClaw to the internet securely without opening ports on your home router

---

## 🎯 Overview

This tutorial shows how to expose your self-hosted OpenClaw AI assistant to the internet while keeping your Raspberry Pi (or any server) safely behind your firewall. Instead of opening ports on your router, we use:

- **Cloudflare Tunnel** - Creates a secure, outbound-only connection
- **Workers VPC** - Allows Workers to access your private OpenClaw instance
- **Cloudflare Access** - Provides authentication layer
- **Cloudflare Worker** - Proxies requests and WebSocket connections

### Architecture

```
Internet → Cloudflare Access → Worker → VPC Service → Tunnel → Raspberry Pi → OpenClaw (localhost:18789)
```

---

## ✅ Prerequisites

Before you begin, ensure you have:

- ✅ OpenClaw running on your Raspberry Pi (see [Part 1: Run OpenClaw on Raspberry Pi])
- ✅ A Cloudflare account
- ✅ Node.js 18+ installed on your development machine

**Note:** Workers VPC is currently in beta and available for free on all Workers plans.

---

## Step 1: Setting Up Cloudflare Tunnel

Cloudflare Tunnel creates a secure, outbound-only connection from your Raspberry Pi to Cloudflare's network. Your Pi initiates the connection, so you don't need to open any ports on your router.

### Create a Tunnel

1. Navigate to the [Workers VPC dashboard](https://dash.cloudflare.com/) and make sure you are on the **Tunnels** tab.

2. Click **Create Tunnel** to create a new tunnel.

3. Enter a name for your tunnel (e.g., `openclaw-tunnel`) and click **Create Tunnel**.

4. The dashboard will show installation instructions for your operating system. Since we're installing on Raspberry Pi, select **Debian** and **arm64-bit**.

5. Follow the instructions shown on the dashboard to install `cloudflared` on your Pi and connect the tunnel.

6. Once installed, the status in the **Connection Status** should show **Connected**.

**Important:** The token shown in the command is sensitive. Don't share it publicly.

### Reusing an Existing Tunnel

If you've already set up a tunnel (e.g., from another tutorial), you can reuse that tunnel. Just note the Tunnel ID for the next step.

---

## Step 2: Creating a VPC Service

Now that the tunnel is connected, we need to create a VPC Service. This tells Cloudflare Workers how to reach your OpenClaw instance through the tunnel.

### Using the Dashboard

1. Navigate to the **VPC Services** tab.

2. Click **Create VPC Service** to create a new VPC Service.

3. Configure the service:
   - **Service name:** `openclaw-service`
   - **Tunnel:** Select the tunnel you created in Step 1
   - **Host or IP address:** `localhost`
   - **Ports:** Select **Provide port values** and enter `18789` for the HTTP port

4. Click **Create service**.

5. The dashboard will display your new VPC Service with a unique **Service ID**. Copy this ID—you'll need it when configuring the Worker.

### Alternative: Using the CLI

If you prefer the command line, you can create the VPC Service with Wrangler:

```bash
npx wrangler vpc service create openclaw-service \
  --type http \
  --tunnel-id <YOUR_TUNNEL_ID> \
  --hostname localhost \
  --http-port 18789
```

Replace `<YOUR_TUNNEL_ID>` with your tunnel ID from Step 1. The command will output a Service ID.

---

## Step 3: Creating Your Worker

The Worker acts as a gateway between the internet and your private OpenClaw instance. It proxies HTTP requests and bridges WebSocket connections for real-time chat. It also integrates with Cloudflare Access for authentication.

### Clone and Configure

1. Clone the repository:

```bash
git clone https://github.com/harshil1712/workers-openclaw-vpc
cd workers-openclaw-vpc
npm install
```

2. Open `wrangler.jsonc` and update the configuration:

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "workers-openclaw-vpc",
  "main": "src/index.ts",
  "compatibility_date": "2026-01-28",
  "vars": {
    "TEAM_DOMAIN": "https://YOUR_TEAM.cloudflareaccess.com"
  },
  "vpc_services": [
    {
      "binding": "VPC_SERVICE",
      "service_id": "<YOUR_VPC_SERVICE_ID>",
      "remote": true
    }
  ]
}
```

Replace:
- `YOUR_TEAM` with your Cloudflare Access team name (found in Zero Trust dashboard URL)
- `<YOUR_VPC_SERVICE_ID>` with the Service ID from Step 2

### Understanding the Code

The Worker uses Hono as a lightweight web framework. Here's what each part does:

- **Authentication Middleware** (`src/middleware/auth.ts`): Validates the JWT token from Cloudflare Access on every request. If the token is invalid or missing, the request is rejected.

- **Chat Completions API** (`/v1/chat/completions`): Proxies requests to OpenClaw's OpenAI-compatible API endpoint. This allows you to use OpenClaw programmatically from any application.

- **WebSocket Proxy** (`/`): Bridges WebSocket connections between your browser and OpenClaw for real-time chat in the Control UI.

- **SPA Routes** (`/app/*`): Serves the OpenClaw dashboard with proper client-side routing support.

### Testing Locally

If you want to test the Worker locally before deploying, you will need to disable the authentication middleware temporarily:

1. Open `src/index.ts` and comment out the authentication middleware line:

```typescript
// app.use(authMiddleware);
```

**Note:** Do not forget to re-enable authentication before deploying!

2. Rename the `.dev.vars.example` file to `.dev.vars` and set `OPENCLAW_GATEWAY_TOKEN` to your Gateway token. You will need this token to access OpenClaw. You also need to set `POLICY_AUD` to your Cloudflare Access Application Audience (AUD) Tag. But for local testing, you can leave it empty.

To get your OpenClaw Gateway token, SSH into your Pi and run:

```bash
ssh username@openclaw-pi.local
cat ~/.openclaw/openclaw.json | grep token
```

3. Start the Worker locally:

```bash
npm run dev
```

4. Navigate to the local URL provided by Wrangler (usually `http://localhost:8787/app`) to test the Worker. You will see the OpenClaw dashboard if everything is set up correctly. To try it out, enter your Gateway token.

You can now access OpenClaw through the Worker locally!

### Deploy

1. Re-enable the authentication middleware in `src/index.ts` if you had disabled it for local testing.

2. Deploy the Worker:

```bash
npm run deploy
```

The command will output your Worker URL (e.g., `https://workers-openclaw-vpc.your-account.workers.dev`).

3. Navigate to the Cloudflare Dashboard, find your Worker, and go to the **Settings** tab. Under the **Domains & Routes** section, click on the menu next to your Worker URL, and enable **Cloudflare Access**. It will show you the **Audience (AUD) Tag**—copy this value for the next step.

### Set Secrets

The Worker needs two secrets that shouldn't be in your configuration file:

1. Set the Policy AUD:

```bash
npx wrangler secret put POLICY_AUD
```

When prompted, paste the **Application Audience (AUD) Tag** from the previous step.

2. Set the Gateway token:

```bash
npx wrangler secret put OPENCLAW_GATEWAY_TOKEN
```

When prompted, paste your OpenClaw Gateway token. You can find this in your Pi's OpenClaw configuration:

```bash
ssh username@openclaw-pi.local
cat ~/.openclaw/openclaw.json | grep token
```

### Configure Custom Domain (Optional)

If you want your Worker available at a subdomain:

1. Go to **Workers & Pages** in the Cloudflare dashboard.
2. Select your Worker.
3. Go to **Settings → Triggers**.
4. Under **Custom Domains**, add `openclaw.yourdomain.com`.

---

## Step 4: Testing Your Setup

Let's verify everything works:

1. Open your browser and navigate to your Worker URL (or custom domain).

2. Cloudflare Access will redirect you to authenticate. Complete the authentication flow. (You can setup Access policies with different methods like Google login, GitHub, etc.)

3. After authentication, you should be redirected to the OpenClaw dashboard.

4. Enter your Gateway token if prompted and start a conversation.

5. If you see the OpenClaw Control UI and can chat with your assistant, congratulations! Your setup is complete.

### Quick Testing with the Demo Chat

The Worker includes a simple demo chat interface at `/chat.html` for quick API testing. Navigate to `https://your-worker-url/chat.html` to try it out. Note that it uses a hardcoded model name (`MiniMax-M2.1`), so you may need to modify it if you're using a different model.

---

## Step 5: Using the API Programmatically

One of the advantages of this setup is the OpenAI-compatible API endpoint at `/v1/chat/completions`. This allows you to integrate OpenClaw with other applications, scripts, or tools.

### Enable API Access

First, make sure API access is enabled in your OpenClaw Gateway. Check your configuration on the Pi:

```bash
cat ~/.openclaw/openclaw.json
```

It should include:

```json
{
  "http": {
    "endpoints": {
      "chatCompletions": {
        "enabled": true
      }
    }
  }
}
```

Ensure the API is enabled for your Gateway.

### Create a Service Token

For programmatic access (without browser authentication), you need a Cloudflare Access service token:

1. Go to the Zero Trust dashboard.

2. Navigate to **Access controls → Service credentials → Service Tokens**.

3. Click **Create Service Token**.

4. Enter a name (e.g., `OpenClaw API`) and select a duration.

5. Click **Generate token**.

**Important:** Copy the Client ID and Client Secret immediately. The Client Secret is only shown once.

### Add Service Token to Access Policy

Return to your Access application and add a policy that accepts the service token:

1. Go to **Access controls → Applications → Your OpenClaw application**.

2. Add a new policy with **Action** set to **Service Auth**.

3. Add a rule with **Selector** set to **Service Token** and select your token.

### Make API Requests

Now you can make authenticated API requests:

```bash
curl -X POST https://openclaw.yourdomain.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "CF-Access-Client-Id: <CLIENT_ID>" \
  -H "CF-Access-Client-Secret: <CLIENT_SECRET>" \
  -d '{
    "model": "MiniMax-M2.1",
    "messages": [
      {"role": "user", "content": "What can you help me with today?"}
    ]
  }'
```

Replace `<CLIENT_ID>` and `<CLIENT_SECRET>` with your service token credentials, and adjust the model name to match your configured provider.

The API also supports streaming responses—just add `"stream": true` to your request body.

---

## 🎉 Conclusion

You've successfully exposed your self-hosted OpenClaw AI assistant to the internet while keeping it secure behind Cloudflare's authentication layer. Your Raspberry Pi remains safely behind your firewall with no open ports, yet you can access your personal AI assistant from anywhere in the world.

### What We Accomplished

- ✅ Created a Cloudflare Tunnel for secure, outbound-only connectivity
- ✅ Set up a VPC Service to route Worker requests to your private network
- ✅ Configured Cloudflare Access for authentication
- ✅ Deployed a Worker gateway that proxies requests and WebSocket connections
- ✅ Enabled programmatic API access with service tokens

### Cost

The best part? This entire setup runs on Cloudflare's free tier (Workers VPC is free during beta), so you get enterprise-grade security for your personal AI assistant without any additional cost.

---

## 🔒 Security Considerations

While this is a solid foundation, there are additional security considerations:

- **Tool Access Control:** Consider implementing more granular access control for tools and services that your agent can use
- **Rate Limiting:** Configure rate limits in Cloudflare Access policies
- **Audit Logging:** Monitor access logs in Cloudflare Zero Trust dashboard
- **Token Rotation:** Regularly rotate your Gateway tokens and service tokens

---

## 🚀 Next Steps

Some ideas for what you can do next:

- Build a mobile app using the API endpoint
- Create automations that interact with your assistant
- Add more Access policies for family members
- Connect OpenClaw to messaging channels like Telegram or WhatsApp
- Set up monitoring and alerting for your tunnel connection

---

## 📚 References

- [Part 1: Run OpenClaw on Raspberry Pi]
- [GitHub Repository: workers-openclaw-vpc](https://github.com/harshil1712/workers-openclaw-vpc)
- [Workers VPC Documentation](https://developers.cloudflare.com/workers/configuration/vpc-services/)
- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/policies/access/)
- [OpenClaw Documentation](https://openclaw.dev)

---

## 🐛 Troubleshooting

### Tunnel Not Connecting

- Check that `cloudflared` is running on your Pi: `systemctl status cloudflared`
- Verify the tunnel token is correct
- Check firewall rules on your Pi (though no inbound ports should be needed)

### Worker Can't Reach OpenClaw

- Verify the VPC Service ID is correct in `wrangler.jsonc`
- Check that the tunnel is connected and shows "Connected" status
- Verify OpenClaw is running on port 18789: `openclaw gateway status`

### Authentication Issues

- Verify Cloudflare Access is enabled on your Worker route
- Check that the AUD tag matches between the Worker secret and Access application
- Ensure your Access policy allows your authentication method

### WebSocket Connection Fails

- Verify the Worker code includes WebSocket proxy logic
- Check browser console for WebSocket errors
- Ensure OpenClaw Gateway supports WebSocket connections

---

**Status:** Ready to implement! 🚀
