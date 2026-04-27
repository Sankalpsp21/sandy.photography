// Supabase Edge Function: sign-cloudinary-upload
// Generates a signed Cloudinary upload signature server-side.
// CLOUDINARY_API_SECRET never reaches the browser.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

async function sha1Hex(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-1', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY')

  if (!apiSecret || !cloudName || !apiKey) {
    return new Response(JSON.stringify({ error: 'Missing Cloudinary configuration' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  let body: { folder?: string } = {}
  try {
    body = await req.json()
  } catch {
    // Use defaults if body is empty or invalid
  }

  const folder = body.folder ?? 'sandy-photography'
  const timestamp = Math.round(Date.now() / 1000)

  // Build sorted param string (only include defined params)
  const params: Record<string, string | number> = {
    folder,
    timestamp,
  }

  // Sort keys alphabetically and build the string to sign
  const sortedKeys = Object.keys(params).sort()
  const paramString = sortedKeys.map((k) => `${k}=${params[k]}`).join('&')
  const stringToSign = `${paramString}${apiSecret}`

  const signature = await sha1Hex(stringToSign)

  return new Response(
    JSON.stringify({
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
    }),
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    }
  )
})
