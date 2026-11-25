/**
 * NamiRayDigitals AI Gateway
 * Free-first image generation via Cloudflare Workers AI binding (AI).
 * Chat fallback: OpenAI-compatible endpoint via AI_API_KEY.
 * Video: optional private adapter endpoint via VIDEO_API_URL + VIDEO_API_KEY.
 */
const DEFAULT_BASE="https://api.openai.com/v1/chat/completions";
const SYSTEM_PROMPT=`Kamu adalah MINAMI, AI Creative Production Assistant NamiRayDigitals. Jawab bahasa Indonesia natural. Bantu ide, sinopsis, Character DNA, environment bible, storyboard, dialog, prompt gambar/video, shot list, continuity dan social kit. Patuhi instruksi pengguna dan konteks proyek. Jaga wajah, bentuk tubuh, rambut, kostum, aksesori, palet, properti, lokasi, arah cahaya, screen direction dan geografi adegan. Jangan mengklaim merender media jika hanya membuat prompt.`;
const headers=(origin)=>({"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Vary":"Origin","Cache-Control":"no-store"});
const json=(data,status,origin)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8",...headers(origin)}});
function b64(bytes){let s="";const a=new Uint8Array(bytes);for(let i=0;i<a.length;i+=0x8000)s+=String.fromCharCode(...a.subarray(i,i+0x8000));return btoa(s)}
export default{async fetch(request,env){
 const origin=request.headers.get("Origin")||"*",allowed=env.ALLOWED_ORIGIN||"*",cors=allowed==="*"||origin===allowed?origin:allowed;
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{...headers(cors),"Access-Control-Max-Age":"86400"}});
 const path=new URL(request.url).pathname;
 if(request.method==="GET"&&path==="/health")return json({ok:true,service:"NamiRayDigitals AI Gateway",chat:!!(env.AI||env.AI_API_KEY),image:!!env.AI,video:!!env.VIDEO_API_URL},200,cors);
 if(request.method!=="POST")return json({error:"Method not allowed"},405,cors);
 let body;try{body=await request.json()}catch{return json({error:"JSON request tidak valid."},400,cors)}
 if(path==="/api/chat"){
  if(!env.AI&&!env.AI_API_KEY)return json({error:"Pasang Workers AI binding bernama AI atau secret AI_API_KEY."},503,cors);
  const message=String(body.message||"").trim();if(!message)return json({error:"Pesan kosong."},400,cors);if(message.length>12000)return json({error:"Pesan maksimal 12.000 karakter."},413,cors);
  const ctx=body.context&&typeof body.context==="object"?body.context:{};
  const safe=JSON.stringify({project:String(ctx.project||"").slice(0,500),story:String(ctx.story||"").slice(0,4000),characters:String(ctx.characters||"").slice(0,5000),continuity:String(ctx.continuity||"").slice(0,3000)});
  const history=Array.isArray(body.history)?body.history.slice(-12).filter(x=>x&&["user","assistant"].includes(x.role)&&typeof x.content==="string").map(x=>({role:x.role,content:x.content.slice(0,5000)})):[];
  const messages=[{role:"system",content:SYSTEM_PROMPT+"\nKONTEKS PROYEK:\n"+safe},...history,{role:"user",content:message}];
  try{if(env.AI){const model=env.AI_MODEL||"@cf/meta/llama-3.1-8b-instruct";const result=await env.AI.run(model,{messages,temperature:.7,max_tokens:1800});const reply=result.response||result.result||result.choices?.[0]?.message?.content;if(!reply)return json({error:"Model tidak mengembalikan teks."},502,cors);return json({reply,model},200,cors)}
   const endpoint=env.AI_BASE_URL||DEFAULT_BASE;const up=await fetch(endpoint,{method:"POST",headers:{"Authorization":"Bearer "+env.AI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:env.AI_MODEL||"gpt-4o-mini",messages,temperature:.7,max_tokens:1800})});const data=await up.json().catch(()=>({}));if(!up.ok)return json({error:"Provider AI menolak permintaan.",detail:String(data.error?.message||"Unknown").slice(0,300)},502,cors);const reply=data.choices?.[0]?.message?.content;if(!reply)return json({error:"Respons provider kosong."},502,cors);return json({reply,model:data.model||env.AI_MODEL},200,cors)
  }catch(e){return json({error:"Chat AI gagal.",detail:String(e.message||e).slice(0,300)},502,cors)}
 }
 if(path==="/api/image"){
  if(!env.AI)return json({error:"Image generation memerlukan Cloudflare Workers AI binding bernama AI."},503,cors);
  const prompt=String(body.prompt||"").trim();if(!prompt)return json({error:"Prompt gambar kosong."},400,cors);if(prompt.length>4000)return json({error:"Prompt maksimal 4.000 karakter."},413,cors);
  const model=env.IMAGE_MODEL||"@cf/black-forest-labs/flux-1-schnell";
  try{const ratio=String(body.aspect_ratio||"1:1");const dims=({"1:1":[1024,1024],"16:9":[1024,576],"9:16":[576,1024],"4:3":[1024,768],"3:2":[1024,682]})[ratio]||[1024,1024];const options={prompt,width:dims[0],height:dims[1],num_steps:4};if(Number.isInteger(Number(body.seed))&&body.seed!==""&&Number(body.seed)>=0)options.seed=Number(body.seed);const result=await env.AI.run(model,options);let bytes,mime="image/png";if(result instanceof ReadableStream){const response=new Response(result);bytes=await response.arrayBuffer();mime=response.headers.get("content-type")||mime}else if(result?.image){const raw=atob(result.image);const out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);bytes=out.buffer}else if(result instanceof ArrayBuffer||ArrayBuffer.isView(result)){bytes=result instanceof ArrayBuffer?result:result.buffer}else if(result?.response instanceof ReadableStream){bytes=await new Response(result.response).arrayBuffer()}else return json({error:"Format hasil gambar dari model tidak dikenali."},502,cors);return new Response(bytes,{status:200,headers:{"Content-Type":mime,...headers(cors),"X-NRD-Model":model}})}catch(e){return json({error:"Pembuatan gambar gagal.",detail:String(e.message||e).slice(0,350)},502,cors)}
 }
 if(path==="/api/video"){
  if(!env.VIDEO_API_URL)return json({error:"Video backend belum dikonfigurasi. Atur VIDEO_API_URL dan VIDEO_API_KEY pada Worker."},503,cors);
  const prompt=String(body.prompt||"").trim();if(!prompt)return json({error:"Prompt video kosong."},400,cors);if(prompt.length>5000)return json({error:"Prompt maksimal 5.000 karakter."},413,cors);
  const payload={prompt,duration:Number(body.duration)||5,aspect_ratio:String(body.aspect_ratio||"16:9"),image_base64:typeof body.image_base64==="string"?body.image_base64.slice(0,7_000_000):undefined};
  try{const up=await fetch(env.VIDEO_API_URL,{method:"POST",headers:{"Content-Type":"application/json",...(env.VIDEO_API_KEY?{"Authorization":"Bearer "+env.VIDEO_API_KEY}:{})},body:JSON.stringify(payload)});const data=await up.json().catch(()=>({}));if(!up.ok)return json({error:"Video provider menolak permintaan.",provider_status:up.status,detail:String(data.error||data.message||"Unknown").slice(0,350)},502,cors);return json({ok:true,...data},200,cors)}catch(e){return json({error:"Video provider tidak dapat dihubungi.",detail:String(e.message||e).slice(0,300)},502,cors)}
 }
 return json({error:"Not found"},404,cors)
}};
