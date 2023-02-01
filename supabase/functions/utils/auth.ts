import { Session, SupabaseClient } from "https://esm.sh/v102/@supabase/supabase-js@2.2.3/dist/module/index";
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




export async function GenerateNonSigninableAccount(): Promise<{client: SupabaseClient<any, "public", any>,username: string,password: string}> {
	const randpass     =  `${getRandomString(20)}`
	const randemail    =  `${getRandomString(20)}@worker.com`

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

    return {
        client: account,
        username: randemail,
        password: randpass
    }
}