// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.2.3"

const url =	Deno.env.get("SUPABASE_URL")
const key =	Deno.env.get("SUPABASE_KEY")
if (url == null || key == null) {
	throw ("missing environment variable")
}


function getRandomString(s: number){
  if (s % 2 == 1) {
    throw ("Only even sizes are supported");
  }

  const buf = new Uint8Array(s / 2);
  crypto.getRandomValues(buf);
  let ret = "";
  for (let i = 0; i < buf.length; ++i) {
    ret += ("0" + buf[i].toString(16)).slice(-2);
  }
  return ret;
}

serve(async (req: Request)  => { try {
	const client = createClient(url, key)

	const { 
		cpu,
		gpu,
		ram,
		public_ip,
		private_ip,
		deploy_token 
	} = await req.json()


	// find user match the deploy token
	const cluster_id = await async function (): Promise<number>{
		const ownerresult = await client.auth.getUser(deploy_token)
		if(ownerresult.error != null) {
			throw (ownerresult.error.message)
		}

		const cluster = await client.from("Cluster")
			.select("public_ip,id")
			.eq( "public_ip", public_ip)
			.eq( "owner", ownerresult.data.user.id)
		
		if(cluster.error != null) {
			throw new Error(cluster.error.message)
		}

		if(cluster.count == 0){
			const cluster_insert_result = await client.from("Cluster").insert({
				public: false,
				owner: ownerresult.data.user.id,
				public_ip: public_ip,
			}).select("id")

			if (cluster_insert_result.error != null) {
				throw new Error(`cluster insert error ${cluster_insert_result.error.message}`);
			}

			throw cluster_insert_result.data[0].id
		} else {
			throw cluster.data[0].id;
		}
	}()

	const insert_result = await client.from("Cluster-Worker").insert({
		cluster_id: cluster_id,
		private_ip: private_ip,

		ram: ram,
		cpu: cpu,
		gpu: gpu,
	})

	if(insert_result.error) {
		throw (`unable to insert worker table ${insert_result.error.details}`);
	}

	const randpass = `${getRandomString(20)}`
	const randemail = `${getRandomString(20)}@worker.account`

	const user = await client.auth.admin.createUser({
		email: randemail,
		password: randpass,

		email_confirm: true,
  		data: { 
			description: 'worker proxy account'	
		}
	})

	const auth_response = await client.auth.signInWithPassword({
		email: randemail,
		password: randpass
	})

	if (user.error != null) {
		throw (user.error.message);
	}

	return new Response(
		JSON.stringify( auth_response.data.session),
		{ headers: { "Content-Type": "application/json" }, status:200 },
	) 
}catch(e){
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
