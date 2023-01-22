import { Session, SupabaseClient } from "https://esm.sh/v102/@supabase/supabase-js@2.2.3/dist/module/index";
import { Env } from "./env.ts";
import { getRandomString } from "./rand.ts";

// find user match the deploy token
// const cluster_id = await async function (): Promise<number>{
//     const ownerresult = await client.auth.getUser(deploy_token)
//     if(ownerresult.error != null) {
//         throw (ownerresult.error.message)
//     }

//     const cluster = await system.from("Cluster")
//         .select("public_ip,id")
//         .eq( "public_ip", public_ip)
//         .eq( "owner", ownerresult.data.user.id)
    
//     if(cluster.error != null) {
//         throw new Error(cluster.error.message)
//     }

//     if(cluster.count == 0){
//         const cluster_insert_result = await system.from("Cluster").insert({
//             public: false,
//             owner: ownerresult.data.user.id,
//             public_ip: public_ip,
//         }).select("id")

//         if (cluster_insert_result.error != null) {
//             throw new Error(`cluster insert error ${cluster_insert_result.error.message}`);
//         }

//         throw cluster_insert_result.data[0].id
//     } else {
//         throw cluster.data[0].id;
//     }
// }


export async function GenerateSBClient(session: {access_token: string, refresh_token: string}): Promise<SupabaseClient<any, "public", any>> {
    const sb = await GenerateAnonSBClient()
    sb.auth.setSession(session)
    return sb;
}
export function GenerateAnonSBClient(): SupabaseClient<any, "public", any> {
    const sb = new Env()
    return new SupabaseClient(sb.url,sb.anon_key);
}
export async function GenerateNonSigninableAccount(): Promise<Session> {
	const randpass     =  `${getRandomString(20)}`
	const randemail    =  `${getRandomString(20)}@worker.com`

	const { data, error } = await (await GenerateAnonSBClient()).auth.signUp({
		email: randemail,
		password: randpass,

        options: {
            data: { 
                description: 'worker proxy account'	
            }
        }
	})

    if (error != null || data.session == null) {
        throw error
    }

    return data.session
}