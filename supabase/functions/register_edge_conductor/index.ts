// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GenerateAdminSBClient, GenerateAnonSBClient, GenerateNonSigninableAccount } from "../utils/auth.ts";
import { getRandomString } from "../utils/rand.ts";
import { Schema } from "../utils/schema.ts";
import { EdgeWrapper } from "../utils/wrapper.ts";


const EdgeSecret = "conlongamtoi"
const EdgeID     = "conlongamtoi"

const IPGeolocation    = "6e9cb53e26ad471c89b02adec2ba0250"
const IPGeolocationURL = "https://api.ipgeolocation.io/ipgeo"


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
  const client_secret = req.headers.get("client_secret")
  const client_id     = req.headers.get("client_id")
  if (client_secret != EdgeSecret || client_id != EdgeID) {
    throw "unauthorized"
  }


	const { public_ip, turn_port } = await req.json()
  if (public_ip == null || turn_port == null) {
    throw "invalid user request"
  }


  const info_resp = await fetch(`${IPGeolocationURL}?apiKey=${IPGeolocation}&ip=${public_ip}`, {
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

  const {uuid,username,password} = await GenerateNonSigninableAccount(".proxy@thinkmay.net")

	const randpass     =  getRandomString(20)
	const randuser     =  getRandomString(20)

  const admin = await GenerateAdminSBClient()
  const insertResult = await admin.from(("regional_proxy") as Schema).update({
    ip : public_ip,
    metadata : {

      region: {
        continent_code : continent_code,
        country_code2  : country_code2,
        city           : city,
        latitude       : latitude,
        longitude      : longitude,
        isp            : isp,
      }, 

      RTCConfiguration : {
        iceServers: [{
          urls: `stun:${public_ip}:${turn_port}`
        },{
          urls: `turn:${public_ip}:${turn_port}`,
          credential: randpass,
          username: randuser
        }]
      } as RTCConfiguration
    }
  }).eq("account_id",uuid)

  if (insertResult.error != null) 
    throw insertResult.error.message

  return {
    username: username,
    password: password,

    IceServer : {
      credential: randpass,
      username: randuser
    } as RTCIceServer
  }
}


// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
