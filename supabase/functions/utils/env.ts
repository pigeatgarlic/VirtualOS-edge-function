export class Env {
    constructor(){
        const url =	        Deno.env.get("SUPABASE_URL")
        const admin_key =	Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
        const anon_key =	Deno.env.get("SUPABASE_ANON_KEY")
        // const jwt_secret =	Deno.env.get("JWT_SECRET")

        if (url == null || anon_key == null || admin_key == null ) {
            throw ("missing environment variable")
        }

        this.url = url
        this.admin_key = admin_key 
        this.anon_key = anon_key
        // this.jwt_secret = jwt_secret
    }

    url :        string 
    admin_key :  string 
    anon_key :   string 
    // jwt_secret :   string 
}
