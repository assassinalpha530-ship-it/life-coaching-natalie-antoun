const { createClient } = supabase;
const sb = createClient(BLOOM_CONFIG.supabaseUrl, BLOOM_CONFIG.supabaseKey);
const app = document.getElementById("app");
let role="client", chart=null, activeExercise="wheel", currentProfile=null;

const domains=["Career","Finances","Health","Family","Friends","Personal Growth","Fun","Love"];
const icons=["⌁","◇","♡","⌂","✦","◌","☼","∞"];

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function emailForUsername(u){return u.trim().toLowerCase().replace(/[^a-z0-9._-]/g,"-")+"@clients.local"}
function shell(content, label="Workspace"){
  return `<div class="shell"><div class="topbar"><div class="brand"><div class="logo">B</div><span>Bloom Coaching <small style="display:block;font-size:10px;color:var(--muted);font-weight:500">with Natalie Antoun</small></span></div><div class="right"><span class="badge">${label}</span><button class="btn ghost" onclick="logout()">Log out</button></div></div>${content}</div>`;
}
function login(){
 app.innerHTML=`<div class="login-wrap"><div class="card login"><div class="logo" style="margin:auto">B</div><h1>Bloom</h1><p>A quiet space to reflect, reset and grow — with <b>Natalie Antoun</b>.</p>
 <div class="tabs"><button class="tab active" id="clientTab" onclick="setRole('client')">Client</button><button class="tab" id="coachTab" onclick="setRole('coach')">Coach</button></div>
 <form onsubmit="loginSubmit(event)"><div class="field"><label>USERNAME</label><input id="username" autocomplete="username" required placeholder="Enter your username"></div>
 <div class="field"><label>PASSWORD</label><input id="password" type="password" autocomplete="current-password" required placeholder="Enter your password"></div>
 <div id="loginMsg"></div><button class="btn primary full" type="submit">Enter Bloom →</button></form>
 <p style="font-size:12px;margin-top:18px">Your coach controls the accounts and can review submitted worksheets.</p></div></div>`;
}
function setRole(r){role=r;document.getElementById("clientTab").classList.toggle("active",r==="client");document.getElementById("coachTab").classList.toggle("active",r==="coach");}
async function loginSubmit(e){
 e.preventDefault(); const u=username.value.trim(), p=password.value; loginMsg.innerHTML="";
 const {data,error}=await sb.auth.signInWithPassword({email:emailForUsername(u),password:p});
 if(error){loginMsg.innerHTML=`<div class="error">Login failed. Check your username and password.</div>`;return}
 const r=data.user.app_metadata?.role;
 if((role==="coach"&&r!=="coach")||(role==="client"&&r!=="client")){await sb.auth.signOut();loginMsg.innerHTML=`<div class="error">That account does not match the selected role.</div>`;return}
 await loadApp();
}
async function loadApp(){
 const {data:{user}}=await sb.auth.getUser(); if(!user){login();return}
 const {data:p}=await sb.from("coach_profiles").select("*").eq("id",user.id).single(); currentProfile=p;
 if(user.app_metadata?.role==="coach") coachDashboard(); else clientWorkspace();
}
async function logout(){await sb.auth.signOut();login()}

function coachDashboard(){
 app.innerHTML=shell(`<div class="hero"><div><div class="badge">NATALIE ANTOUN · LIFE COACH</div><h1>Coach Dashboard</h1><p>Manage clients, create accounts and review their reflections.</p><p class="muted" style="margin-top:6px">Life Coach: Natalie Antoun</p></div><button class="btn gold" onclick="openAddClient()">+ New client</button></div>
 <div class="grid3" id="stats"></div><div class="grid" style="margin-top:20px"><div class="card"><div class="section-title"><h2>Clients</h2><span>Account overview</span></div><div id="clients" class="client-list">Loading…</div></div><div class="card"><div class="section-title"><h2>Latest reflections</h2><span>Most recent</span></div><div id="results">Loading…</div></div></div>
 <div id="modal"></div>`,"Coach");
 loadCoachData();
}
async function loadCoachData(){
 const [{data:clients},{data:subs}]=await Promise.all([
  sb.from("coach_profiles").select("*").eq("role","client").order("created_at",{ascending:false}),
  sb.from("coach_submissions").select("*").order("created_at",{ascending:false}).limit(50)
 ]);
 const clientMap=Object.fromEntries((clients||[]).map(c=>[c.id,c]));
 stats.innerHTML=`<div class="stat"><strong>${clients?.length||0}</strong><small>Total clients</small></div><div class="stat"><strong>${new Set((subs||[]).map(s=>s.client_id)).size}</strong><small>Active submitters</small></div><div class="stat"><strong>${subs?.length||0}</strong><small>Worksheet submissions</small></div>`;
 clientsEl=clients;
 document.getElementById("clients").innerHTML=(clients||[]).length?clients.map(c=>{
  const count=(subs||[]).filter(s=>s.client_id===c.id).length;
  return `<div class="client"><div><div class="client-name">${esc(c.display_name||c.username)}</div><div class="client-meta">@${esc(c.username)} · ${count?count+" submission(s)":"No submissions yet"}</div></div><button class="btn soft" onclick="viewClient('${c.id}')">Review</button></div>`
 }).join(""):`<div class="muted">No clients yet. Create your first account.</div>`;
 document.getElementById("results").innerHTML=(subs||[]).slice(0,7).map(s=>{
  const c=clientMap[s.client_id]; return `<div class="result"><h3>${esc(c?.display_name||"Client")} · ${new Date(s.created_at).toLocaleDateString()}</h3><p><b>Wheel:</b> ${Object.values(s.wheel||{}).reduce((a,b)=>a+Number(b),0)} / 80</p><p><b>Gratitude:</b> ${(s.gratitude||[]).filter(Boolean).length} entries</p></div>`
 }).join("")||`<div class="muted">No submissions yet.</div>`;
}
function openAddClient(){
 document.getElementById("modal").innerHTML=`<div class="modal"><div class="card"><div class="section-title"><h2>Create client</h2><button class="btn ghost" onclick="closeModal()">×</button></div><p class="muted">The password is assigned once here. The client can then use the same username to log in.</p>
 <form onsubmit="createClient(event)"><div class="field"><label>USERNAME</label><input id="newUser" required></div><div class="field"><label>DISPLAY NAME</label><input id="newName" placeholder="Optional"></div><div class="field"><label>TEMPORARY PASSWORD (8+ CHARACTERS)</label><input id="newPass" type="password" minlength="8" required></div><div id="createMsg"></div><button class="btn primary full">Create client</button></form></div></div>`;
}
function closeModal(){document.getElementById("modal").innerHTML=""}
async function createClient(e){
 e.preventDefault();createMsg.innerHTML="Creating…";
 const u=newUser.value.trim(), pass=newPass.value, name=newName.value.trim()||u;
 const secondary=createClientClient();
 const {data,error}=await secondary.auth.signUp({email:emailForUsername(u),password:pass,options:{data:{username:u}}});
 if(error){createMsg.innerHTML=`<div class="error">${esc(error.message)}</div>`;return}
 if(!data.user){createMsg.innerHTML=`<div class="error">Could not create the account.</div>`;return}
 const {error:pe}=await sb.from("coach_profiles").insert({id:data.user.id,username:u,display_name:name,role:"client"});
 if(pe){createMsg.innerHTML=`<div class="error">${esc(pe.message)}</div>`;return}
 closeModal();loadCoachData();
}
function createClientClient(){return createClient(BLOOM_CONFIG.supabaseUrl,BLOOM_CONFIG.supabaseKey,{auth:{persistSession:false,autoRefreshToken:false}})}
async function viewClient(id){
 const {data:c}=await sb.from("coach_profiles").select("*").eq("id",id).single();
 const {data:subs}=await sb.from("coach_submissions").select("*").eq("client_id",id).order("created_at",{ascending:false});
 document.getElementById("modal").innerHTML=`<div class="modal"><div class="card" style="max-height:88vh;overflow:auto"><div class="section-title"><h2>${esc(c?.display_name||c?.username)}</h2><button class="btn ghost" onclick="closeModal()">×</button></div>
 ${(subs||[]).map(s=>`<div class="result"><h3>${new Date(s.created_at).toLocaleString()}</h3><p><b>Wheel of Life</b></p><p>${domains.map(d=>`${esc(d)}: ${Number(s.wheel?.[d]||0)}`).join(" · ")}</p><p><b>Gratitude:</b> ${(s.gratitude||[]).filter(Boolean).map(esc).join(" • ")||"—"}</p><p><b>Self-love:</b> ${Object.entries(s.self_love||{}).map(([k,v])=>`${esc(k)}: ${esc(v)}`).join(" · ")||"—"}</p></div>`).join("")||`<p class="muted">No submissions yet.</p>`}</div></div>`;
}

function clientWorkspace(){
 const name=currentProfile?.display_name||currentProfile?.username||"there";
 app.innerHTML=shell(`<div class="hero"><div><div class="badge">YOUR PRIVATE WORKSPACE</div><h1>Hello, ${esc(name)}.</h1><p>Small honest answers. Real progress.</p></div></div>
 <div class="exercise-nav"><button class="pill active" id="pWheel" onclick="switchExercise('wheel')">Wheel of Life</button><button class="pill" id="pGrat" onclick="switchExercise('gratitude')">Gratitude Jar</button><button class="pill" id="pLove" onclick="switchExercise('love')">Self-Love</button></div>
 <div id="exercise"></div>`,"Client");
 renderWheel();
}
function switchExercise(x){activeExercise=x;document.querySelectorAll(".pill").forEach(b=>b.classList.remove("active"));document.getElementById(x==="wheel"?"pWheel":x==="gratitude"?"pGrat":"pLove").classList.add("active");x==="wheel"?renderWheel():x==="gratitude"?renderGratitude():renderLove()}
function renderWheel(){
 const values=Object.fromEntries(domains.map(d=>[d,5]));
 document.getElementById("exercise").innerHTML=`<div class="grid"><div class="card"><div class="section-title"><h2>How balanced is life right now?</h2><span>1 = needs attention · 10 = thriving</span></div>${domains.map((d,i)=>`<div class="slider-row"><label>${icons[i]} ${d}</label><input type="range" min="1" max="10" value="5" oninput="wheelChange('${d}',this.value)"><div class="score" id="s-${i}">5</div></div>`).join("")}<button class="btn gold full" style="margin-top:14px" onclick="submitWheel()">Save Wheel of Life</button><div id="wheelMsg"></div></div><div class="card"><div class="section-title"><h2>Your wheel</h2><span>Live preview</span></div><div class="chart-box"><canvas id="wheelChart"></canvas></div></div></div>`;
 window.wheelValues=values; drawChart();
}
function wheelChange(d,v){wheelValues[d]=Number(v);document.getElementById("s-"+domains.indexOf(d)).textContent=v;drawChart()}
function drawChart(){
 if(chart)chart.destroy(); const ctx=document.getElementById("wheelChart"); if(!ctx)return;
 chart=new Chart(ctx,{type:"radar",data:{labels:domains,datasets:[{data:domains.map(d=>wheelValues[d]),borderWidth:2,pointRadius:3,backgroundColor:"rgba(169,184,161,.25)",borderColor:"#64745d",pointBackgroundColor:"#c9a96a"}]},options:{responsive:true,maintainAspectRatio:false,scales:{r:{min:0,max:10,ticks:{stepSize:2,backdropColor:"transparent"},grid:{color:"#e8e2d7"},angleLines:{color:"#e8e2d7"},pointLabels:{font:{family:"DM Sans",size:11}}}},plugins:{legend:{display:false}}}});
}
function renderGratitude(){
 document.getElementById("exercise").innerHTML=`<div class="card" style="max-width:760px;margin:auto"><div class="jar">🫙</div><div class="section-title"><h2>Gratitude Jar</h2><span>Write 3–5 real things</span></div><div class="quote">You don't need a perfect day to find something worth keeping.</div>${[1,2,3,4,5].map(i=>`<div class="field"><label>NOTE ${i}</label><input class="grat" placeholder="Today, I’m grateful for…"></div>`).join("")}<button class="btn gold full" onclick="submitGratitude()">Add to my jar</button><div id="gratMsg"></div></div>`;
}
function renderLove(){
 document.getElementById("exercise").innerHTML=`<div class="card" style="max-width:760px;margin:auto"><div class="section-title"><h2>Self-Love Worksheet</h2><span>Be honest, not impressive</span></div>
 <div class="field"><label>ONE THING I LIKE ABOUT MYSELF</label><textarea id="love1" placeholder="A quality, action, effort, or part of who you are…"></textarea></div>
 <div class="field"><label>SOMETHING I FORGIVE MYSELF FOR</label><textarea id="love2" placeholder="What are you ready to stop punishing yourself for?"></textarea></div>
 <div class="field"><label>ONE PROMISE I WANT TO KEEP TO MYSELF</label><textarea id="love3" placeholder="Make it small enough to actually keep."></textarea></div>
 <button class="btn gold full" onclick="submitLove()">Save my reflection</button><div id="loveMsg"></div></div>`;
}
async function saveSubmission(payload,msgId){
 const {error}=await sb.from("coach_submissions").insert({client_id:currentProfile.id,...payload});
 document.getElementById(msgId).innerHTML=error?`<div class="error">${esc(error.message)}</div>`:`<div class="success">Saved privately to your coaching workspace ✓</div>`;
}
function submitWheel(){saveSubmission({wheel:wheelValues,gratitude:[],self_love:{}}, "wheelMsg")}
function submitGratitude(){saveSubmission({wheel:{},gratitude:[...document.querySelectorAll(".grat")].map(x=>x.value.trim()).filter(Boolean),self_love:{}}, "gratMsg")}
function submitLove(){saveSubmission({wheel:{},gratitude:[],self_love:{strength:love1.value.trim(),forgiveness:love2.value.trim(),promise:love3.value.trim()}}, "loveMsg")}

sb.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT")login()});
login();
