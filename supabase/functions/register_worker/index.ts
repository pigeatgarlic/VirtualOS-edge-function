// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GenerateAdminSBClient, GenerateAnonSBClient, GenerateNonSigninableAccount  } from "../utils/auth.ts";
import { Schema } from "../utils/schema.ts";
import { EdgeWrapper } from "../utils/wrapper.ts";

const req_url   = 'https://oauth2.googleapis.com/token'
const client_id = '610452128706-mplpl7mhld1u05p510rk9dino8phcjb8.apps.googleusercontent.com'
const client_secret = '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'


serve(async (req: Request) =>{ return await EdgeWrapper(req,Handle) })
async function Handle(req: Request) {
	const metadata = await req.json()




	let email: string
	{
		const token = `${req.headers.get("Oauth2-Token")}&client_id=${client_id}&client_secret=${client_secret}`
		const resp = await fetch(req_url,{
			body: token,
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		})

		if (resp.status != 200) {
		throw (resp.status)
		}

		const data = await resp.clone().json()
		const info_resp = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${data.access_token}`, {
			method: "GET"
		})

		const info = await info_resp.clone().json()
		email = info.email
	}


	let owner_id: string
	{
		const admin = GenerateAdminSBClient() 
		const {data: {users},error}= await admin.auth.admin.listUsers()
		if(error != null) 
			throw error

		const result = users.find((u) => {
			if (u.email == email) 
				return true; 
			else
				return false;
		})

		if(result == undefined) 
			throw 'undefined user'

		console.log(`signing up worker with owner email: ${result?.email}`)
		owner_id = result.id;
	}

	{
		const {uuid,username,password} = await GenerateNonSigninableAccount(".worker@thinkmay.net")

		const client = GenerateAnonSBClient()
		const {data:{user}} 		= await client.auth.signInWithPassword({
			email: username,
			password: password	
		})

		const {error} = await client.from(Schema.WORKER_PROFILE).update({
			metadata: metadata}).eq("account_id",user?.id).select("id,account_id")

		if (error != null) 
			throw error.message

		const owner = await client.from(Schema.RELATIONSHIP).insert({
			user_account:   owner_id,
			worker_account: user?.id,
			o_type: 'OWNER'
		})

		if (owner.error != null) 
			throw owner.error.message

		return {
			username: username,
			password: password
		}
	}
}

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
