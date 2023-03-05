import { GenerateAdminSBClient } from "./auth.ts";
import { Schema } from "./schema.ts";
import { formatTime } from "./time.ts";

export async function select_region (country_code2: string, continent_code: string) : Promise<{metadata: {RTCConfiguration: any; region:any },ip: string} | null>  
{
  const admin = await GenerateAdminSBClient()
  const {error,data}= await admin.from('regional_proxy' as Schema).select("metadata,ip,last_update,id")

  if (error != null) {
    throw error
  }

  console.log(`there are ${data.length} turn server available`)
  for (let index = 0; index < data.length; index++) {
    const element = data[index];

    try {
      const last_update = Date.parse(element.last_update);
      const from_now = Date.now().valueOf() - last_update.valueOf()
      console.log(`turn server ${element.ip}, last_update from now: ${formatTime(from_now)}`)
      if (
        element.metadata.region.country_code2 == country_code2 && 
        element.metadata.region.continent_code == continent_code && 
        from_now < 10 * 1000) { // 10 sec
        return {
          metadata: element.metadata,
          ip: element.ip
        }
      }

      if (from_now > 1000 * 60 * 60 * 24) { // one day
        console.log(`deleting turn server ${element.ip} for unactive for the last 1 day`)
        await admin.from('regional_proxy' as Schema).delete().eq("ip",element.ip);
      }



    } catch (error) {
        console.log(`model error : ${JSON.stringify(error)}`)
        console.log(`deleting turn server ${element.id} for invalid model`)
        try {
            await admin.from('regional_proxy' as Schema).delete().eq("id",element.id);
        } catch (error_delete) {
            console.log(`unable to delete : ${JSON.stringify(error_delete)}`)
        }
    }
  }

  return null;
}