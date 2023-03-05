export async function EdgeWrapper(req: Request,func: ((req: Request) => (any))) : Promise<Response> {
    console.log(`user request body: ${JSON.stringify(await req.clone().json())}`)


    try {
        const resp_body = await func(req);
        return new Response(
            JSON.stringify( resp_body),
            { headers: { "Content-Type": "application/json" }, status:200 },
        ) 
    } catch(e) {
        console.log(`error ${e}`)
        return new Response(
            JSON.stringify( e),
            { 
                headers: { "Content-Type": "application/json" },
                status: 400,
            },
        ) 
    }
}