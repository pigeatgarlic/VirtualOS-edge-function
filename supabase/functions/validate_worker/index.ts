// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/v102/@supabase/supabase-js@2.2.3/dist/module/index"

const url =	Deno.env.get("SUPABASE_URL")
const key =	Deno.env.get("SUPABASE_KEY")

serve(async (req) => { try {
	if (url == null || key == null) {
		throw new Error("missing environment variable")
	}

	const client = createClient( url, key)
	const { access_token, refresh_token } = await req.json()

	const res = await client.auth.setSession({
		access_token: access_token,
		refresh_token: refresh_token});
	if (res.error != null) {
		throw res.error
	}

	const workerRes = await client.from("WorkerNode")
		.select("*")
		.eq("account_id",res.data.user?.id);

	if (workerRes.error != null) {
		throw res.error
	}

	if (workerRes.count == null || workerRes.count > 1) {
		throw new Error("Invalid account");
	}

	return new Response(
		"true",
		{ headers: { "Content-Type": "application/json" } },
	)
} catch(e) {
	console.log("Worker function run failed with error "+ e)
	return new Response(
		JSON.stringify( e),
		{ 
			headers: { "Content-Type": "application/json" },
			status: 500,
		},
	) 
}})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
