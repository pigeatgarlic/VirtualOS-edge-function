// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GenerateAdminSBClient } from "../utils/auth.ts";
import { Schema } from "../utils/schema.ts";
import { EdgeWrapper } from "../utils/wrapper.ts";
import { Hash } from "https://deno.land/std@0.110.0/node/crypto.ts";


const precheck = async(worker_session_id: number) => {
	const client = await GenerateAdminSBClient()
	let current_user_session : {metadata: any; email: string; start_at: string}[] = []
	{
		const {data,error}= await client.from(('session_relationship') as Schema)
			.select('user_session')
			.eq("worker_session",worker_session_id)
			.eq("relationship",'REMOTE')
		if (error != null) {
			throw `error add relationship ${error}`
		}

		for (let index = 0; index < data.length; index++) { const element = data[index]; {
			const {data,error}= await client.from(('account_session') as Schema)
				.select('id,account_id,last_check,start_at')
				.eq("id",element.user_session)
			if (error != null) {
				throw `error get account_session relationship ${error}`
			}

			const session = data.at(0);
			if ((Date.now() - Date.parse(session?.last_check)) < 5 * 1000) { // 5 sec
				const {data,error}= await client.from(('user_session') as Schema)
					.select('metadata,account_id')
					.eq('session_id',session?.id)

				if (error != null) {
					throw `error get account_session relationship ${error}`
				}

				const connecting_user = await client.auth.admin.getUserById(session?.account_id)
				const user_session = data.at(0);
				current_user_session = [...current_user_session,{
					metadata: user_session?.metadata,
					start_at: session?.start_at,
					email: connecting_user.data.user?.email ? connecting_user.data.user?.email : "",
				}]
			}
		}}
	}


	if (current_user_session.length > 2) {
		throw current_user_session
	}
}


serve(async (req: Request) =>{ return await EdgeWrapper(req,Handle) })
async function Handle(req: Request) {
	const { metadata,worker_session_id } = await req.json()
	const access_token = req.headers.get("access_token");
	if (access_token == null) {
		throw 'null access token'
	}

	await precheck(worker_session_id)
	const client = await GenerateAdminSBClient()

	// TODO : auth
	const {data:{user},error} = await client.auth.getUser(access_token)
	if (error != null) 
		throw `error get user info ${error}`
	
	const insertres = await client.from(('account_session') as Schema)
		.insert({ account_id: user?.id }).select("id,start_at")
	if (insertres.error != null) 
		throw `error get user info ${insertres.error}`
	
	const relinsert  = await client.from(('session_relationship') as Schema)
		.insert({worker_session:worker_session_id,user_session:insertres.data.at(0)?.id, relationship: 'REMOTE'})
	if (relinsert.error != null) 
		throw `error add relationship ${relinsert.error}`

	const updateres = await client.from(('user_session') as Schema)
		.update({ metadata : metadata })
		.eq("session_id",insertres.data.at(0)?.id)
	if (updateres.error != null) 
		throw `error get user info ${updateres.error}`

	

	// TODO better hash

	return btoa(JSON.stringify({
		metadata: metadata,
		start_at: insertres.data.at(0)?.start_at,
		is_server: false,
		id: insertres.data.at(0)?.id,
	}))
}


// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
