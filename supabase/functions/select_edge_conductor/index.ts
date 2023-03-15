// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { EdgeWrapper } from "../utils/wrapper.ts";
import { select_region } from "../utils/turn.ts";

const TWILIO_ACCOUNT_SID = "ACedcb3f462432e8ebf70c25c540a01778"
const TWILIO_AUTH_TOKEN  = "8fc3aff8f138434a6390c4004bf1e474"

const IPGeolocation = "6e9cb53e26ad471c89b02adec2ba0250"

type RTCRtcpMuxPolicy = "require";
type RTCIceTransportPolicy = "all" | "relay";
type RTCBundlePolicy = "balanced" | "max-bundle" | "max-compat";
interface RTCIceServer {
    credential?: string;
    urls: string | string[];
    username?: string;
}

interface RTCConfiguration {
    bundlePolicy?: RTCBundlePolicy;
    iceCandidatePoolSize?: number;
    iceServers?: RTCIceServer[];
    iceTransportPolicy?: RTCIceTransportPolicy;
    rtcpMuxPolicy?: RTCRtcpMuxPolicy;
}

interface IPGeolocation {
    continent_code : string | null,
    country_code2 : string | null,
    city? : string,
    latitude? : string,
    longitude? : string,
    isp? : string
}





serve(async (req: Request) =>{ return await EdgeWrapper(req,Handle) })
async function Handle(req: Request) : Promise<RTCConfiguration> {
	const { public_ip } = await req.json()
  if (public_ip == null) {
    throw "invalid user request"
  }


  const info_resp = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=${IPGeolocation}&ip=${public_ip}`, {
    method: "GET"
  })

  if (!info_resp.ok) {
    throw 'fail to lookup ip ' + await info_resp.text()
  }

  const location : IPGeolocation = await info_resp.json() 
  console.log(`turn server request from ${location.city} ${location.country_code2} ${location.continent_code}`)
  const selection  = await select_region(location.country_code2,location.continent_code)
  if (selection == null) {
    // curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Tokens.json" \
    //   -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
    const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Tokens.json`,{
      method: 'POST',
      headers: {
        "Authorization" : `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
      }
    })

    if (resp.status != 201) 
      throw `not valid twilio account ${resp.status}`
      
    console.log(`using twilio credential`)
    const {ice_servers} = await resp.json()
    return { iceServers: ice_servers } as RTCConfiguration
  }

  const { metadata,ip } = selection
  console.log(`match to turn server ${ip}`)
  return metadata.RTCConfiguration as RTCConfiguration
}


// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
