/**
 * NamiRayDigitals AI Gateway — Cloudflare Workers
 * Required secret: AI_API_KEY
 * Optional vars: AI_BASE_URL (default OpenAI-compatible endpoint), AI_MODEL, ALLOWED_ORIGIN
 * Never put provider keys in frontend code or Git.
 */
const DEFAULT_BASE = "https://api.openai.com/v1/chat/completions";
const SYSTEM_PROMPT = `Kamu adalah MINAMI, AI Creative Production Assistant milik NamiRayDigitals.
Jawab dalam bahasa Indonesia yang natural kecuali pengguna meminta bahasa lain.
Bantu produksi kreatif: ide, sinopsis, Character DNA, environment bible, storyboard, dialog, prompt image/video, shot list, continuity dan social kit.
Utamakan instruksi eksplisit pengguna. Jangan mengarang hasil render atau mengklaim membuat file/media jika hanya menyusun prompt.
Jaga kontinuitas: wajah, usia visual, bentuk tubuh, rambut, kostum, aksesori, palet, properti, lokasi, arah cahaya, screen direction dan geografi adegan.
Jika konteks proyek diberikan, gunakan sebagai sumber utama. Jangan mengubah identitas karakter yang telah ditetapkan.
Buat output terstruktur dan siap produksi. Untuk prompt video, jelaskan aksi yang terbaca, gerak tubuh natural, gerak kamera, durasi, pencahayaan, ambience, dan negative prompt.
Jangan pernah meminta atau menampilkan API key pengguna.`;
function json(data,status=200,origin="*"){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Vary":"Origin","Cache-Control":"no-store"}})}
export default {
 async fetch(request,env){
  const origin=request.headers.get("Origin")||"*";
  const allowed=env.ALLOWED_ORIGIN||"*";
  const corsOrigin=allowed==="*"||origin===allowed?origin:allowed;
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":corsOrigin,"Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"86400","Vary":"Origin"}});
  const url=new URL(request.url);
  if(request.method==="GET"&&url.pathname==="/health")return json({ok:true,service:"NamiRayDigitals AI Gateway",model:env.AI_MODEL||"provider-default"},200,corsOrigin);
  if(request.method!=="POST"||url.pathname!=="/api/chat")return json({error:"Not found"},404,corsOrigin);
  if(!env.AI_API_KEY)return json({error:"Server belum dikonfigurasi: AI_API_KEY belum diisi."},503,corsOrigin);
  let body;try{body=await request.json()}catch{return json({error:"JSON request tidak valid."},400,corsOrigin)}
  const message=String(body.message||"").trim();
  if(!message)return json({error:"Pesan kosong."},400,corsOrigin);
  if(message.length>12000)return json({error:"Pesan terlalu panjang (maksimal 12.000 karakter)."},413,corsOrigin);
  const context=body.context&&typeof body.context==="object"?body.context:{};
  const safeContext=JSON.stringify({project:String(context.project||"").slice(0,500),story:String(context.story||"").slice(0,4000),characters:String(context.characters||"").slice(0,5000),continuity:String(context.continuity||"").slice(0,3000)});
  const history=Array.isArray(body.history)?body.history.slice(-12).filter(x=>x&&["user","assistant"].includes(x.role)&&typeof x.content==="string").map(x=>({role:x.role,content:x.content.slice(0,5000)})):[];
  const messages=[{role:"system",content:SYSTEM_PROMPT+"\n\nKONTEKS PROYEK (data pengguna):\n"+safeContext},...history,{role:"user",content:message}];
  const endpoint=(env.AI_BASE_URL||DEFAULT_BASE).trim();
  if(!/^https:\/\//i.test(endpoint))return json({error:"AI_BASE_URL harus menggunakan HTTPS."},500,corsOrigin);
  try{
   const upstream=await fetch(endpoint,{method:"POST",headers:{"Authorization":"Bearer "+env.AI_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:env.AI_MODEL||"gpt-4o-mini",messages,temperature:0.7,max_tokens:1800})});
   const data=await upstream.json().catch(()=>({}));
   if(!upstream.ok)return json({error:"Provider AI menolak permintaan.",provider_status:upstream.status,detail:String(data.error?.message||data.message||"Unknown provider error").slice(0,500)},502,corsOrigin);
   const reply=data.choices?.[0]?.message?.content;
   if(!reply)return json({error:"Provider tidak mengembalikan teks jawaban."},502,corsOrigin);
   return json({reply,model:data.model||env.AI_MODEL||"provider-default"},200,corsOrigin);
  }catch(error){return json({error:"Gateway gagal menghubungi provider AI.",detail:String(error.message||error).slice(0,300)},502,corsOrigin)}
 }
};
