// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";

console.log("Hello from Functions!")

serve(async (req: Request)  => {
	const { cpu,gpu,ram,public_ip,private_ip,deploy_token } = await req.json()

	const key = await crypto.subtle.generateKey(
	{ name: "HMAC", hash: "SHA-512" },
	true,
	["sign", "verify"],
	);

	const jwt = await djwt.create(
		{ alg: "HS512", typ: "JWT" }, 
		{ foo: "bar" }, 
		key
	);


	const data = {
		"token": jwt
	}

	return new Response(
		JSON.stringify(data),
		{ headers: { "Content-Type": "application/json" } },
	)
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
