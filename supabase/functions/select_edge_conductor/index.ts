// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { EdgeWrapper } from "../utils/wrapper.ts";
import { select_region } from "../utils/turn.ts";


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






serve(async (req: Request) =>{ return await EdgeWrapper(req,Handle) })
async function Handle(req: Request) {


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

  const {
    continent_code,
    country_code2,
    city,
    latitude,
    longitude,
    isp
  } = await info_resp.json()


  console.log(`turn server request from ${city} ${country_code2} ${continent_code}`)
  const selection  = await select_region(country_code2,continent_code)
  if (selection == null) {
    throw "unable to find turn server in this region"
  }

  const { metadata,ip } = selection
  console.log(`match from client ${public_ip} at ${city} ${country_code2} ${continent_code} to turn server ${ip}`)


  return metadata.RTCConfiguration
}


// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
