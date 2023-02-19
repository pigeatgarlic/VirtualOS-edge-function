  import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.2.3'
import { Env } from "./env.ts";
import { getRandomString } from "./rand.ts";


export function GenerateAnonSBClient(): SupabaseClient<any, "public", any> {
    const sb = new Env()
    return new SupabaseClient(sb.url,sb.anon_key);
}
export function GenerateAdminSBClient(): SupabaseClient<any, "auth", any> {
    const sb = new Env()
    console.log(`using admin client`)
    return new SupabaseClient(sb.url,sb.admin_key);
}




export async function GenerateNonSigninableAccount(domain: string): Promise<{uuid: string,username: string,password: string}> {
	const randpass     =  `${getRandomString(20)}`
	const randemail    =  `${getRandomString(20)}${domain}`

    const admin = await GenerateAdminSBClient();
	const { data, error } = await admin.auth.admin.createUser({
		email: randemail,
        email_confirm: true
    })

    if (error != null) 
        throw error
    
    const updateResult = await admin.auth.admin.updateUserById(data.user.id,{ password: randpass })
	if(updateResult.error != null)
        throw updateResult.error

    admin.auth.signOut()

    const account = await GenerateAnonSBClient();
	const result = await account.auth.signInWithPassword({
        email: randemail,
        password: randpass
    })

    if (result.error != null) 
        throw error

    if (result.data.user?.id == null) 
        throw "no uuid generated"
    

    return {
        uuid: result.data.user?.id,
        username: randemail,
        password: randpass
    }
}