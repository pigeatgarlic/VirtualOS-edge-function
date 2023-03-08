// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { EdgeWrapper } from "../utils/wrapper.ts";
import { GenerateAdminSBClient } from "../utils/auth.ts";
import { Schema } from "../utils/schema.ts";



class _SessionAccess {
	match_session: number[] = [];
	is_server: boolean | null = null;
	start_at: string | null = null; 
	id: number | null = null;
}


serve(async (req: Request) =>{ return await EdgeWrapper(req,Handle) })
async function Handle(req: Request): Promise<{queue: string[]; route: any}> {
	const { queue } = await req.json()
	const route = new Map<string,string>()
	let [old_queue, new_queue] = [queue as string[],[] as string[]]
	const old_queue_data =  new Map<_SessionAccess,string>()

	const client = await GenerateAdminSBClient();
	for (let index = 0; index < old_queue.length; index++) {
		const element = old_queue[index];
		
		const data = JSON.parse(atob(element)) as _SessionAccess
		old_queue_data.set(data,element);
	}


	// tag match sessions for each session
	old_queue_data.forEach(async (val,key) => {
		const sesinsert  = await client.from(('account_session') as Schema)
			.select("last_check")
			.eq('id',key.id)
		if (sesinsert.error != null) 
			throw `error add relationship ${sesinsert.error}`
		
		// empty tag session if session last check is more than 5 sec
		if (Date.now() - Date.parse(sesinsert.data.at(0)?.last_check) > 5 * 1000) {
			return;
		}


		const relinsert  = await client.from(('session_relationship') as Schema)
			.select("worker_session,user_session")
			.eq("relationship",'REMOTE')
			.eq(key.is_server ? "worker_session" : "user_session",key.id)
		if (relinsert.error != null) 
			throw `error add relationship ${relinsert.error}`
		
		relinsert.data.forEach(data => {
			key.match_session = [...key.match_session,key.is_server ? data.user_session : data.worker_session]
		})
	});




	// match session based on previous result
	old_queue_data.forEach((val,key) => {
		old_queue_data.forEach((val2,key2) => {

			let match = false
			key .match_session.forEach(ms =>  { if (ms == key2.id) {
			key2.match_session.forEach(ms2 => { if (ms2 == key.id) {
				match = true
			} }) } })

			if (match) {
				route.set(key.is_server ? val : val2, key.is_server ? val2 : val)
			}
		})
	})





	// add or remove token from queue
	old_queue_data.forEach((val,key) => {
		if(key.match_session.length == 0) // abort invalid session
			return

		let inroute = false
		route.forEach((key2,val2) => {
			if (val2 == val || key2 == val) {
				inroute = true
			}
		})

		if (inroute) // abort session that already in queue
			return
		
		new_queue = [...new_queue,val];
	})


	const rm : any = {}
	route.forEach((val,key) => { rm[key] = val })
	return {
		queue : new_queue,
		route : rm
	}
}


// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
