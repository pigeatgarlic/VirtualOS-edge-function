import { Session, SupabaseClient, User } from "https://esm.sh/v102/@supabase/supabase-js@2.2.3/dist/module/index";
import { GenerateAnonSBClient, GenerateSBClient } from "./auth.ts";
import { Schema } from "./schema.ts";



export class WorkerInfor {
    constructor(){
        this.os  = "unknown"
        this.cpu = "unknown"
        this.gpu = "unknown"
        this.ram = "unknown"
        this.public_ip  = "unknown"
        this.private_ip = "unknown"

        this.owner_id   = "unknown"
        this.account_id = null
    }

    cpu : string
    gpu : string
    ram : string
    os : string

    private_ip: string
    public_ip: string

    account_id: string | null
    owner_id: string 
}

export async function InsertWorkerInfor(session: {access_token: string, refresh_token: string}, info: WorkerInfor) {
    const client = await GenerateSBClient(session);

    await client.from(Schema.CLUSTER)
        .insert({
            gpu: info.gpu,
            cpu: info.cpu,
            ram: info.ram,
            os: info.os,

            private_ip: info.private_ip,
            public_ip: info.public_ip,
        })
}


export async function GetWorkerInforFromAssociatedAccount(session: Session) : Promise<WorkerInfor>{
    const client = await GenerateSBClient(session);

    const result = await client.from(Schema.CLUSTER)
        .select("os,cpu,gpu,ram,private_ip,public_ip,owner_id,account_id")
        .eq("account_id",(await client.auth.getUser()).data.user?.id)
    
    if (result.count == 0) {
        throw `non associated account`
    }

    return {
        os : result.data?.at(0)?.os,
        cpu : result.data?.at(0)?.cpu,
        gpu : result.data?.at(0)?.gpu,
        ram : result.data?.at(0)?.ram,
        private_ip : result.data?.at(0)?.private_ip,
        public_ip  : result.data?.at(0)?.public_ip,
        account_id : result.data?.at(0)?.account_id,
        owner_id   : result.data?.at(0)?.owner_id,
    }
}