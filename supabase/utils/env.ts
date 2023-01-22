export class Env {
    constructor(){
        const url =	    Deno.env.get("SUPABASE_URL")
        const admin_key =	Deno.env.get("APP_SUPABASE_ADMIN_KEY")
        const anon_key =	Deno.env.get("APP_SUPABASE_ANON_KEY")
        if (url == null || anon_key == null || admin_key == null) {
            throw ("missing environment variable")
        }

        this.url = url
        this.admin_key = admin_key 
        this.anon_key = anon_key
    }

    url :        string 
    admin_key :  string 
    anon_key :   string 
}
