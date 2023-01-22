export async function EdgeWrapper(req: Request,func: ((req: Request) => (any))) : Promise<Response> {
    try {
        const resp_body = await func(req);
        return new Response(
            JSON.stringify( resp_body),
            { headers: { "Content-Type": "application/json" }, status:200 },
        ) 
    } catch(e) {
        return new Response(
            JSON.stringify( e),
            { 
                headers: { "Content-Type": "application/json" },
                status: 500,
            },
        ) 
    }
}