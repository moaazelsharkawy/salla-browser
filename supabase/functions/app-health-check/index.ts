import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': 'https://browser.salla-shop.com', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  try{
    const { app_id }=await req.json();
    if(typeof app_id!=='string'||!app_id)return json({error:'APP_ID_REQUIRED'},400);
    const url=Deno.env.get('SUPABASE_URL'); const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if(!url||!key)return json({error:'SERVER_CONFIG_MISSING'},500);
    const db=createClient(url,key,{auth:{persistSession:false}});
    const {data:app,error}=await db.from('apps').select('id,website_url,status').eq('id',app_id).eq('status','published').maybeSingle();
    if(error||!app)return json({error:'APP_NOT_FOUND'},404);
    const {data:cached}=await db.from('app_health_checks').select('*').eq('app_id',app_id).maybeSingle();
    const checked=cached?.checked_at?new Date(cached.checked_at).getTime():0;
    if(checked&&Date.now()-checked<10*60*1000)return json({app_id:app.id,probe_status:cached.probe_status,http_status:cached.http_status,latency_ms:cached.latency_ms,checked_at:cached.checked_at,cached:true});
    const started=Date.now(); let http:number|null=null; let probe:'online'|'offline'='offline';
    try{
      let res=await fetch(app.website_url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(6000),headers:{'User-Agent':'SallaBrowser-Health/1.0'}});
      if(res.status===405||res.status===501){res=await fetch(app.website_url,{method:'GET',redirect:'follow',signal:AbortSignal.timeout(6000),headers:{'User-Agent':'SallaBrowser-Health/1.0','Range':'bytes=0-0'}});try{await res.body?.cancel()}catch{/* noop */}}
      http=res.status; probe=res.status<500?'online':'offline';
    }catch{/* offline */}
    const latency=Date.now()-started; const now=new Date().toISOString();
    await db.from('app_health_checks').upsert({app_id:app.id,probe_status:probe,checked_at:now,latency_ms:latency,http_status:http},{onConflict:'app_id'});
    return json({app_id:app.id,probe_status:probe,http_status:http,latency_ms:latency,checked_at:now,cached:false});
  }catch(error){console.error('[APP-HEALTH-CHECK]',error);return json({error:'CHECK_FAILED'},500)}
});
