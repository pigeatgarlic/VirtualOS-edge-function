// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { EdgeWrapper } from "../../utils/wrapper.ts";
import { InsertWorkerInfor } from "../../utils/worker.ts";
import { GenerateNonSigninableAccount, GenerateSBClient } from "../../utils/auth.ts";
import { getIP } from "https://deno.land/x/get_ip/mod.ts";


serve(async (req: Request) =>{ return await EdgeWrapper(req,Handle) })
async function Handle(req: Request){
	const { 
		cpu,
		gpu,
		ram,
		os,

		private_ip,
		public_ip,
	} = await req.json()

	const header = req.headers.get("Authorization");
	if (header == null) {
		throw `no owner token`
	}

	const {access_token,refresh_token} =  JSON.parse(header);
	if (access_token == null || refresh_token == null) {
		throw `missing header`
	}

	const owner = await GenerateSBClient(
	{
		access_token: access_token,
		refresh_token: refresh_token
	})

	const worker_account_session = await GenerateNonSigninableAccount();
	const owner_info 		   = (await owner.auth.getUser()).data.user
	if (owner_info == null) 
		throw `unknown owner`
	

	await InsertWorkerInfor( 
	{
		access_token: worker_account_session.access_token,
		refresh_token: worker_account_session.refresh_token,
	},
	{
		cpu: cpu,
		gpu: gpu,
		ram: ram,
		os: os,

		private_ip: private_ip,
		public_ip: public_ip,

		owner_id: owner_info.id,
		account_id: worker_account_session.user.id
	})

	return worker_account_session
}

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
