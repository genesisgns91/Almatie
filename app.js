/* ==== 1. CONFIGURAÇÃO (a config web do Firebase é pública; a proteção está nas Security Rules) ==== */
import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,sendPasswordResetEmail,signOut,updateProfile}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{getFirestore,doc,getDoc,setDoc,updateDoc,addDoc,collection,query,where,getDocs,limit,serverTimestamp,runTransaction,deleteDoc}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const FIREBASE={apiKey:"AIzaSyCDRbUsrfrfKJ3erCUXWTRTyLG2GE6Xdpg",authDomain:"vellum-gns.firebaseapp.com",projectId:"vellum-gns",storageBucket:"vellum-gns.firebasestorage.app",messagingSenderId:"523498921953",appId:"1:523498921953:web:14ba0ba049cf89da68fca0"};
const CONFIG_OK=FIREBASE.apiKey!=="COLE_AQUI";
const app=initializeApp(FIREBASE),auth=getAuth(app),db=getFirestore(app);

/* ==== 2. UTILITÁRIOS ==== */
const $=(s,r=document)=>r.querySelector(s);
const vt=f=>document.startViewTransition&&!matchMedia("(prefers-reduced-motion:reduce)").matches?document.startViewTransition(f).updateCallbackDone:Promise.resolve(f());
const marcar=b=>b.parentElement.querySelectorAll("button").forEach(x=>{const on=x===b;x.classList.toggle("sel",on);x.classList.toggle("dim",!on&&x.matches(".opt,.pcard"));x.setAttribute("aria-pressed",on)});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg,tipo="ok"){const t=document.createElement("div");t.className="toast "+tipo;t.setAttribute("role",tipo==="err"?"alert":"status");t.textContent=msg;$("#toasts").append(t);setTimeout(()=>t.remove(),4500)}
const ERROS={"auth/invalid-credential":"E-mail ou senha incorretos.","auth/email-already-in-use":"Este e-mail já tem conta. Entre ou recupere a senha.","auth/weak-password":"A senha precisa ter ao menos 6 caracteres.","auth/invalid-email":"E-mail inválido.","auth/popup-closed-by-user":"Login com Google cancelado.","auth/too-many-requests":"Muitas tentativas. Aguarde alguns minutos.","permission-denied":"Você não tem permissão para esta ação.","auth/unauthorized-domain":"Este endereço não está autorizado no Firebase. No Console, em Authentication > Configurações > Domínios autorizados, adicione "+location.hostname+".","auth/operation-not-allowed":"O login com Google não está ativado no Firebase (Authentication > Método de login).","auth/popup-blocked":"O navegador bloqueou a janela do Google. Libere pop-ups para este site.","auth/network-request-failed":"Sem conexão com o servidor de login. Verifique a internet.","auth/account-exists-with-different-credential":"Já existe uma conta com este e-mail usando outro método de entrada.","failed-precondition":"O banco de dados pediu um índice para esta consulta. Abra o Console (F12) e use o link indicado."};
const msgErro=e=>ERROS[e.code]||e.message_pt||"Não foi possível concluir ("+(e.code||e.name||"erro")+"). Tente novamente.";
async function acao(btn,fn){if(new URLSearchParams(location.search).get("vis")){toast("Modo visualização: as ações ficam desativadas.","err");return}btn.setAttribute("aria-busy","true");try{await fn()}catch(e){console.error(e);toast(msgErro(e),"err")}finally{btn.removeAttribute("aria-busy")}}
function cpfValido(v){const d=v.replace(/\D/g,"");if(d.length!==11||/^(\d)\1+$/.test(d))return false;const dv=n=>{let s=0;for(let i=0;i<n;i++)s+=d[i]*(n+1-i);return(s*10%11)%10};return dv(9)==d[9]&&dv(10)==d[10]}

function inclinar(raiz){if(!matchMedia("(hover:hover)").matches)return;const al=e=>e.target.closest(".t3d>*,[data-e=tilt]>*,[data-fx=tilt] figure");
raiz.addEventListener("pointermove",e=>{const c=al(e);if(!c)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
c.style.setProperty("--ry",(x*18).toFixed(1)+"deg");c.style.setProperty("--rx",(-y*18).toFixed(1)+"deg");c.style.setProperty("--px",(x*2).toFixed(2));c.style.setProperty("--py",(y*2).toFixed(2))});
raiz.addEventListener("pointerout",e=>{const c=al(e);if(!c)return;["--rx","--ry","--px","--py"].forEach(k=>c.style.removeProperty(k))})}
function coverflow(el){const f=()=>{if(!el.isConnected){removeEventListener("resize",f);return}const r=el.getBoundingClientRect(),m=r.left+r.width/2;[...el.children].forEach(k=>{const b=k.getBoundingClientRect(),o=(b.left+b.width/2-m)/b.width;k.style.setProperty("--o",o.toFixed(3));k.style.setProperty("--a",Math.min(Math.abs(o),2.5).toFixed(3))})};
let w=0;el.addEventListener("scroll",()=>{if(!w)w=requestAnimationFrame(()=>{w=0;f()})},{passive:true});addEventListener("resize",f);f();setTimeout(f,350)}
/* ==== 3. TEMA E ESTABELECIMENTO (multiloja via ?s=<id>) ==== */
const slug=()=>{const s=new URLSearchParams(location.search).get("s");if(s)localStorage.setItem("slug",s);return s||localStorage.getItem("slug")};
const href=p=>"#/"+p.replace(".html","");
function lum(h){const[r,g,b]=[1,3,5].map(i=>parseInt(h.substr(i,2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b}
const FONTES={classica:["'Playfair Display',Georgia,serif","'Inter',system-ui,sans-serif","Playfair+Display:wght@400;600&family=Inter:wght@400;600"],
moderna:["'Inter',system-ui,sans-serif","'Inter',system-ui,sans-serif","Inter:wght@400;600;700"],
editorial:["'DM Serif Display',Georgia,serif","'DM Sans',system-ui,sans-serif","DM+Serif+Display&family=DM+Sans:wght@400;600"],
industrial:["'Oswald',Impact,sans-serif","'Inter',system-ui,sans-serif","Oswald:wght@400;600&family=Inter:wght@400;600"],
geometrica:["'Syne',system-ui,sans-serif","'DM Sans',system-ui,sans-serif","Syne:wght@500;700&family=DM+Sans:wght@400;600"],
artesanal:["'Fraunces',Georgia,serif","'Inter',system-ui,sans-serif","Fraunces:wght@400;600&family=Inter:wght@400;600"]};
function aplicarTema(t={}){const R=document.documentElement,S=(k,v)=>R.style.setProperty(k,v),c=/^#[0-9a-f]{6}$/i.test(t.cor)?t.cor:"#23395b",F=FONTES[t.fonte]||FONTES.classica;
S("--brand",c);S("--on-brand",lum(c)>.4?"#111":"#fff");S("--r",{reto:"2px",discreto:"8px",suave:"14px",redondo:"26px",capsula:"40px"}[t.estilo]||"14px");
R.dataset.theme={escuro:"dark",argila:"argila",nevoa:"nevoa"}[t.tema]||"light";R.dataset.fundo=t.fundo||"";R.dataset.foto=t.fotoForma||"arco";R.dataset.efeito=t.fotoEfeito||"contorno";S("--serif",F[0]);S("--sans",F[1]);
let l=document.getElementById("gf");if(!l){l=document.createElement("link");l.id="gf";l.rel="stylesheet";document.head.append(l)}const u="https://fonts.googleapis.com/css2?family="+F[2]+"&display=swap";if(l.href!==u)l.href=u;
S("--bw",(t.borda??1)+"px");S("--op",(t.opac??100)+"%");S("--sh",["none","0 1px 0 var(--line)","0 12px 28px -18px rgb(0 0 0/.4)","0 26px 50px -22px rgb(0 0 0/.5)"][t.prof||0]);S("--bright",(t.brilho??100)+"%");S("--lg",(t.logoTam||36)+"px");S("--ov",(t.heroOverlay??40)/100);R.dataset.faixa=t.faixaEstilo||"barbeiro";R.dataset.faixaefeito=t.faixaEfeito||"desenhar";S("--fh",(t.faixaEstilo==="nenhuma"?0:(t.faixaAltura||4))+"px");S("--fx1",t.faixaCorModo==="custom"&&t.faixaCor1?t.faixaCor1:c);S("--fx2",t.faixaCor2||"#b3382c")}
const logoTag=(t,pos,cls="")=>{const x=t?.tema;return x?.logo&&pos.includes(x.logoPos||"lado")?`<img class="logo lf-${x.logoForma||"livre"} ${cls}" src="${x.logo}" alt="${esc(t.nome)}">`:""};
const TC=new Map();let OVR=null,TT=null,PING=0;
async function carregarTenant(id){if(id===false)return null;id=id||slug();if(!id)return null;let c=TC.get(id);
if(!c||Date.now()-c.em>6e4){const d=await getDoc(doc(db,"tenants",id));if(!d.exists())return null;c={em:Date.now(),t:{id:d.id,...d.data()}};TC.set(id,c)}
const t=c.t;if(OVR&&OVR.id===id)Object.assign(t,{nome:OVR.nome,tema:OVR.tema});if(t.status==="suspenso")return{...t,suspenso:true};aplicarTema(t.tema);document.title=t.nome;pwa(t);return t}

/* ==== 4. AUTENTICAÇÃO E PAPÉIS (papel vem de masters/ e acessos/, só o Master grava) ==== */
let SES;const sessaoBase=async()=>SES&&auth.currentUser?.uid===SES.u.uid?SES:(SES=await sessaoRaw());
const sessao=async()=>{const s=await sessaoBase(),p=new URLSearchParams(location.search),v=p.get("vis");
if(s?.papel==="master"&&v&&slug())return{...s,papel:v==="loja"?"proprietario":"cliente",tenantId:v==="loja"?slug():undefined,previa:true};
if(s?.papel==="proprietario"&&v)return{...s,papel:v==="loja"?"proprietario":"cliente",tenantId:v==="loja"?s.tenantId:undefined,previa:true};
if(s?.papel==="master"&&p.get("gerir")&&slug())return{...s,papel:"proprietario",tenantId:slug(),gerindo:true};return s};
const sessaoRaw=()=>new Promise(r=>{const un=onAuthStateChanged(auth,async u=>{un();r(u?{u,...await papelDe(u)}:null)})});
async function papelDe(u){if((await getDoc(doc(db,"masters",u.uid))).exists())return{papel:"master"};
let a=await getDoc(doc(db,"acessos",u.uid));
if(!a.exists()&&u.email){const cv=await getDoc(doc(db,"convites",u.email.toLowerCase()));if(cv.exists()){const c=cv.data();
await setDoc(doc(db,"acessos",u.uid),{tenantId:c.tenantId,papel:c.papel,unidades:c.unidades||[],permissoes:c.permissoes||[],email:u.email.toLowerCase(),nome:u.displayName||""});await deleteDoc(cv.ref);a=await getDoc(doc(db,"acessos",u.uid))}}
return a.exists()?{papel:a.data().papel,tenantId:a.data().tenantId,unidades:a.data().unidades||[],permissoes:a.data().permissoes||[]}:{papel:"cliente"}}
const destino=s=>s.papel==="master"?"master.html":s.papel==="cliente"?"agendar.html":"agendamentos.html";
async function irParaPainel(){const u=auth.currentUser,p=await papelDe(u),sl=slug();
if(["proprietario","equipe"].includes(p.papel)){if(sl&&sl!==p.tenantId){await signOut(auth);toast("Este acesso pertence a outra loja. Entre pelo link da sua loja.","err");return}
if(sl===p.tenantId)location.replace(href(destino(p)));else location.replace(location.pathname+"?s="+encodeURIComponent(p.tenantId)+href(destino(p)));return}
location.replace(href(destino(p)))}
function exigir(s,papeis,perm){if(!s){location.replace(href("login.html"));return false}if(!papeis.includes(s.papel)||(s.papel==="equipe"&&perm&&perm!=="agendamentos"&&!(s.permissoes||[]).includes(perm))){location.replace(href(destino(s)));return false}return true}
async function garantirPerfil(u,extra={}){const r=doc(db,"users",u.uid);if(!(await getDoc(r)).exists())await setDoc(r,{nome:extra.nome||u.displayName||"",email:u.email,criadoEm:serverTimestamp(),...(extra.lgpdEm?{lgpdEm:serverTimestamp()}:{})})}
const entrarGoogle=async()=>{const pv=new GoogleAuthProvider();try{const c=await signInWithPopup(auth,pv);await garantirPerfil(c.user,{lgpdEm:1});return true}
catch(e){if(["auth/popup-blocked","auth/cancelled-popup-request","auth/web-storage-unsupported"].includes(e.code)){await signInWithRedirect(auth,pv);return false}throw e}};
async function auditar(ev,dados){try{await addDoc(collection(db,"auditoria"),{ev,dados,uid:auth.currentUser.uid,em:serverTimestamp()})}catch(e){console.warn("auditoria não registrada",e.code)}}

/* ==== 5. CABEÇALHO COMPARTILHADO ==== */
const IC={agendamentos:"M8 3v3M16 3v3M4 9h16M6 5h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2z",clientes:"M16 19v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M10 11a3 3 0 100-6 3 3 0 000 6M20 19v-1a3 3 0 00-2-2.8M16 5.2a3 3 0 010 5.6",bloqueios:"M12 3a9 9 0 100 18 9 9 0 000-18zM5.6 5.6l12.8 12.8",assinaturas:"M4 8h16M4 8l2-4h12l2 4M4 8v11h16V8M9 13h6",unidades:"M4 21V8l8-5 8 5v13M9 21v-6h6v6",profissionais:"M12 12a4 4 0 100-8 4 4 0 000 8M4 21a8 8 0 0116 0",servicos:"M6 3l12 12M18 3L6 15M6 18a2 2 0 100 4 2 2 0 000-4M18 18a2 2 0 100 4 2 2 0 000-4",produtos:"M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10",promocoes:"M3 12l9-9h8v8l-9 9zM15 7h.01",planos:"M5 4h14v17l-7-4-7 4z",avaliacoes:"M12 3l2.7 5.6 6.1.8-4.4 4.2 1.1 6.1L12 17l-5.5 2.7 1.1-6.1L3.2 9.4l6.1-.8z",indicadores:"M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3",metas:"M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8z",financeiro:"M3 7h18v12H3zM3 11h18M7 15h3",personalizacao:"M12 3a9 9 0 100 18c1.1 0 2-.9 2-2 0-.6-.2-1-.6-1.4-.3-.4-.5-.8-.5-1.4 0-1.1.9-2 2-2H17a4 4 0 004-4c0-4.4-4-7.2-9-7.2z",equipe:"M9 11a3 3 0 100-6 3 3 0 000 6M3 19v-1a4 4 0 014-4h4a4 4 0 014 4v1M17 11a3 3 0 100-6M21 19v-1a4 4 0 00-3-3.9",ajustes:"M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M14 4v4M8 10v4M16 16v4",master:"M3 12l9-9 9 9M5 10v10h14V10",agendar:"M12 5v14M5 12h14",cliente:"M12 12a4 4 0 100-8 4 4 0 000 8M4 21a8 8 0 0116 0",menu:"M4 7h16M4 12h16M4 17h16"};
const ico=k=>`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${IC[k]||IC.master}"/></svg>`;
const NAV=[["Operação",[["agendamentos","Agenda",1],["clientes","Clientes",0],["bloqueios","Bloqueios",1],["assinaturas","Pacotes",0]]],["Cadastros",[["unidades","Unidades",0],["profissionais","Profissionais",1],["servicos","Serviços",1],["produtos","Produtos",1]]],["Marketing",[["promocoes","Promoções",0],["planos","Planos",0],["avaliacoes","Avaliações",1]]],["Gestão",[["indicadores","Indicadores",0],["metas","Metas",0],["financeiro","Financeiro",0]]],["Configuração",[["personalizacao","Aparência",0],["equipe","Equipe",0],["ajustes","Ajustes",0]]]];
function topo(t,s){const atual=location.hash.replace(/^#\/?/,"")||"index",shell=["proprietario","equipe","master"].includes(s?.papel);document.body.dataset.papel=s?.papel||"";document.body.dataset.shell=shell?"app":"site";let g=[];
if(s?.papel==="proprietario")g=NAV;else if(s?.papel==="equipe")g=NAV.map(([n,i])=>[n,i.filter(([k,,a])=>a&&(k==="agendamentos"||(s.permissoes||[]).includes(k)))]);
else if(s?.papel==="master")g=[["Plataforma",[["master","Lojas",0],["personalizacao","Aparência",0],["equipe","Equipe",0]]]];else if(s?.papel==="cliente")g=[["",[["agendar","Agendar",0],["cliente","Meu perfil",0]]]];
const lk=([k,l])=>`<a data-l="${k}.html"${k===atual?' aria-current="page"':""}>${ico(k)}<span>${l}</span></a>`,menu=g.filter(([,i])=>i.length).map(([n,i])=>`<div class="grupo">${n&&shell?`<span class="gt">${n}</span>`:""}${i.map(lk).join("")}</div>`).join("");
const rod=`<div class="rodape">${s?.gerindo?`<span class="tag">Modo Master</span><a class="btn ghost sm" href="${location.pathname}#/master">Sair da loja</a>`:""}${s?.previa?`<span class="tag">Prévia</span>`:s?`<button class="btn ghost sm" id="sair" type="button">Sair</button>`:`<a data-l="login.html" class="btn ghost sm">Entrar</a>`}</div>`;
$("#topo").innerHTML=`<a class="marca ${cfgT(t).logoCab==="centro"?"col":""}" data-l="index.html">${cabLogo(t)}${cabNome(t)?`<span class="mn">${esc(t?.nome||"Agenda")}</span>`:""}</a><button class="ibtn mbtn" id="mbtn" type="button" aria-label="Abrir menu" aria-expanded="false">${ico("menu")}</button><div class="menu" role="navigation" aria-label="Principal">${menu}${rod}</div>`;
$("#sair")?.addEventListener("click",async()=>{await signOut(auth);location.replace(href("index.html"))});
$("#mbtn").onclick=()=>{const o=document.body.classList.toggle("menu-aberto");$("#mbtn").setAttribute("aria-expanded",o)};
$("#topo").querySelectorAll(".menu a").forEach(a=>a.addEventListener("click",()=>document.body.classList.remove("menu-aberto")));
if(!$("#veu")){const v=document.createElement("div");v.id="veu";v.onclick=()=>document.body.classList.remove("menu-aberto");document.body.append(v)}}

/* ==== 6. PÁGINAS (cada uma só roda quando <body data-page="..."> coincide) ==== */
const P={};
const OKSVG=`<svg class="okc" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg>`+[0,45,90,135,180,225,270,315].map(a=>`<i style="--a:${a}deg"></i>`).join("");
const ALLSEC=["promo","planos","servicos","avaliacoes","galeria","cta"],POSV={t:"flex-start",m:"center",b:"flex-end",l:"flex-start",c:"center",r:"flex-end"},TA={l:"left",c:"center",r:"right"};
const legado=x=>{if(!x||x.logoCab||x.logoHome)return{};const p=x.logoPos;return p==="hero"?{logoCab:"nenhuma",logoHome:"acima"}:p==="marca"?{logoCab:"nenhuma",logoHome:"dagua"}:p?{logoCab:p}:{}};
const cfgT=t=>({...legado(t?.tema),...(t?.tema||{})});
const cabLogo=t=>{const x=cfgT(t);return x.logo&&(x.logoCab||"lado")!=="nenhuma"?`<img class="logo lf-${x.logoForma||"livre"}" src="${x.logo}" alt="${esc(t.nome)}">`:""};
const cabNome=t=>{const x=cfgT(t);return x.nomeCab!=="nao"&&!(x.logo&&x.logoCab==="so")};
function revelar(){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("vis");io.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll(".rv").forEach((x,i)=>{x.style.transitionDelay=(i%4)*70+"ms";io.observe(x)})}
P.index=async t=>{const h=$("#hero");
if(t?.suspenso)return h.innerHTML=`<h1>Estabelecimento indisponível</h1><p class="lead">Este estabelecimento está temporariamente fora do ar.</p>`;
if(!t)return h.innerHTML=slug()?`<h1>Loja não encontrada</h1><p class="lead">Confira o link de acesso com o estabelecimento.</p>`:`<h1>Agendamentos online</h1><p class="lead">Acesse pelo link da sua loja. Se você administra a plataforma, use o acesso abaixo.</p><a class="btn" data-l="login.html">Acesso da plataforma</a>`;
const ler=async n=>(await getDocs(collection(db,"tenants",t.id,n))).docs.map(d=>({id:d.id,...d.data()})),tm=cfgT(t),sx=tm.secoes||ALLSEC,on=k=>sx.includes(k);
const[V,PR,SV,rv]=await Promise.all([ler("vitrine"),ler("profissionais"),ler("servicos"),on("avaliacoes")&&voc(t).pub?rev(t):""]);
const fig=v=>`<figure class="rv"><img src="${v.img}" alt="${esc(v.legenda||v.tipo)}" loading="lazy"><figcaption>${esc(v.legenda||"")}</figcaption></figure>`;
const capa=V.find(v=>v.tipo==="capa"),fotos=V.filter(v=>v!==capa).sort((a,b)=>a.ordem-b.ordem),todas=[capa,...fotos].filter(Boolean);let L=tm.layout||"cinema";if(L==="editorial")L="divisao";
const cta=`<span class="ctas"><a class="btn cta${tm.ctaEstilo==="contorno"?" cta2":""}" data-l="agendar.html">${esc(tm.ctaTexto||voc(t).ag)}</a>${t.planosAtivo?'<a class="btn ghost cta cta2" data-l="agendar.html">Ver planos</a>':""}</span>`;
const titulo=tm.homeTitulo||t.nome,pal=tm.tituloAnim==="palavras"?titulo.split(/\s+/).map((w,i)=>`<span class="w" style="--i:${i}">${esc(w)}</span>`).join(" "):esc(titulo),lh=tm.logoHome||"nenhuma",tl=!!tm.logo;
const img=c=>`<img class="logo hlogo lf-${tm.logoForma||"livre"} ${c}" src="${tm.logo}" alt="${esc(t.nome)}">`;
const txt=`${tl&&["acima","selo"].includes(lh)?img(lh):""}${tl&&lh==="substitui"?img("subst"):tm.nomeHome==="nao"?"":`<h1 class="hn">${pal}</h1>`}${tm.subHome==="nao"?"":`<p class="lead">${esc(tm.homeSub||t.descricao||"")}</p>`}${cta}`;
const strip=on("galeria")&&fotos.length?`<section class="strip">${fotos.map(fig).join("")}</section>`:"";let topoH="";
if(L==="cinema")topoH=`<section class="cine"><div class="cine-img" ${capa?`style="background-image:url('${capa.img}')"`:""}></div><div class="cine-txt">${txt}</div></section>${strip}`;
if(L==="divisao")topoH=`<section class="dv"><div class="dv-t">${txt}</div><figure class="dv-f">${capa?`<img src="${capa.img}" alt="">`:""}</figure></section>${strip}`;
if(L==="moldura"){const lado=fotos.slice(0,2);topoH=`<section class="mol"><div class="mol-c">${lado[0]?fig(lado[0]):""}</div><div class="mol-m">${capa?`<figure class="arch-f"><img src="${capa.img}" alt=""></figure>`:""}<div class="mol-t">${txt}</div></div><div class="mol-c">${lado[1]?fig(lado[1]):""}</div></section>${on("galeria")&&fotos.length>2?`<section class="strip">${fotos.slice(2).map(fig).join("")}</section>`:""}`}
if(L==="mosaico"){const p=todas.slice(0,5),k=Math.max(0,p.length-1),sp=k===1?[6,2]:k===2?[3,2]:k===3?[2,2]:[3,1],tile=(v,c,r)=>fig(v).replace('class="rv"',`class="rv" style="grid-column:span ${c};grid-row:span ${r}"`);
topoH=`<section class="sec"><div class="mos"><div class="mos-t rv" style="grid-column:span ${p.length?3:6};grid-row:span 3">${txt}</div>${p[0]?tile(p[0],3,3):""}${p.slice(1).map(v=>tile(v,...sp)).join("")}</div></section>`}
if(L==="coverflow")topoH=`<section class="sec cf-t"><div class="cf-head">${txt}</div></section><div class="cflow gal3d">${todas.map(v=>fig(v).replace('class="rv"','')).join("")}</div>`;
if(L==="revista")topoH=`<section class="rev">${todas.map((v,i)=>`<figure><img src="${v.img}" alt="${esc(v.legenda||v.tipo)}"><div class="rv-t">${i===0?txt:esc(v.legenda||"")}</div></figure>`).join("")||`<figure><div class="rv-t">${txt}</div></figure>`}</section>`;
const pm=on("promo")?(await getDocs(query(collection(db,"tenants",t.id,"promocoes"),where("emailCliente","==",""),where("destaqueHome","==",true)))).docs.map(d=>d.data()).filter(p=>p.ativo!==false&&(!p.validade||p.validade>=hoje())):[];
const promoH=pm.length?`<section class="sec"><h2 class="rv">Promoções</h2><div class="promo-grid">${pm.map(p=>`<div class="promo rv"><b>${p.tipo==="percent"?p.valor+"%":brl(p.valor)} OFF</b><strong>${esc(p.titulo)}</strong><span>${esc(p.descricao||"")}</span>${p.alvoNome?`<small>Vale para: ${esc(p.alvoNome)}</small>`:""}${p.codigo?`<code>Cupom ${esc(p.codigo)}</code>`:""}${p.validade?`<small>Até ${esc(p.validade.split("-").reverse().join("/"))}</small>`:""}</div>`).join("")}</div></section>`:"";
const PL=on("planos")&&t.planosAtivo?(await ler("planos")).filter(p=>p.ativo!==false):[];
const planH=PL.length?`<section class="sec"><h2 class="rv">Planos e pacotes</h2><div class="promo-grid">${PL.map(p=>`<div class="card rv"><strong>${esc(p.nome)}</strong><p class="mute" style="margin:.3rem 0">${esc(p.descricao||"")}</p><b class="pp">${brl(p.preco)}</b><p class="mute">${p.sessoes} sessões · ${p.validade} dias</p><a class="btn" data-l="agendar.html">Contratar</a></div>`).join("")}</div></section>`:"";
const eq=PR.filter(p=>p.ativo!==false),sv=SV.filter(v=>v.ativo!==false);$("#main").classList.add("solto");
const pos=tm.textoPos||"bl";h.className="home";h.dataset.fx=tm.fxFoto||"zoom";h.dataset.filtro=tm.heroFiltro||"nenhum";h.dataset.anim=tm.heroAnim||"zoom";
const hv=(k,v)=>h.style.setProperty(k,v);hv("--av",POSV[pos[0]]);hv("--ah",POSV[pos[1]]);hv("--ta",TA[pos[1]]);hv("--nt",(tm.nomeTam||100)/100);hv("--lhs",(tm.logoHomeTam||140)+"px");
hv("--ha",{tela:"92dvh",alta:"76dvh",media:"54dvh"}[tm.heroAltura]||"92dvh");hv("--hc",{leve:"40px",forte:"120px"}[tm.heroCurva]||"0px");
h.innerHTML=(tl&&lh==="dagua"?`<img class="dagua" src="${tm.logo}" alt="">`:"")+(tl&&lh==="canto"?img("canto"):"")+topoH+promoH+planH+
(tm.homeEquipe==="sim"&&eq.length?`<section class="sec"><h2 class="rv">${voc(t).eq}</h2><div class="equipe ${tm.equipeModelo==="coverflow"?"cflow":""}" data-m="${tm.equipeModelo||"grade"}" data-t="${tm.equipeTam||"m"}" data-e="${tm.equipeEfeito||"tilt"}" data-foto="${tm.equipeForma||"arco"}">${eq.map(p=>`<div class="eq"><span class="arch">${p.foto?`<img src="${p.foto}" alt="">`:`<i>${esc((p.nome||"?")[0])}</i>`}</span><strong>${esc(p.nome)}</strong></div>`).join("")}</div></section>`:"")+
(on("servicos")&&sv.length?`<section class="sec"><h2 class="rv">${voc(t).sv}</h2><ul class="lista rv">${sv.map(v=>`<li><span>${esc(v.nome)}</span><strong>${brl(v.preco)}</strong></li>`).join("")}</ul></section>`:"")+
(rv?`<section class="sec"><h2 class="rv">Quem já passou por aqui</h2>${rv}</section>`:"")+(on("cta")?`<section class="sec fim rv"><h2>Pronto para o seu horário?</h2>${cta}</section>`:"");
document.querySelectorAll("[data-l]").forEach(a=>a.href=href(a.dataset.l));revelar();document.querySelectorAll(".cflow").forEach(coverflow);inclinar(h);
const im=$(".cine-img");if(im&&tm.heroAnim==="paralaxe"&&!matchMedia("(prefers-reduced-motion:reduce)").matches){let w=0;const f=()=>{if(!im.isConnected)return removeEventListener("scroll",f);if(w)return;w=requestAnimationFrame(()=>{w=0;im.style.setProperty("--py",Math.min(scrollY,900)*.18+"px")})};addEventListener("scroll",f,{passive:true})}};

P.login=async(t,s)=>{if(s)return irParaPainel();
if(t?.suspenso){$("#lt").closest("section").innerHTML="<h1>Loja indisponível</h1><p class=\"lead\">Este estabelecimento está temporariamente fora do ar.</p>";return}
$("#lt").textContent=t?`Entrar em ${t.nome}`:"Acesso da plataforma";document.querySelectorAll('[data-l="cadastro.html"]').forEach(a=>a.hidden=!t);const f=$("#f");
f.onsubmit=e=>{e.preventDefault();acao($("button",f),async()=>{await signInWithEmailAndPassword(auth,f.email.value.trim(),f.senha.value);await irParaPainel()})};
$("#g").onclick=e=>acao(e.currentTarget,async()=>{if(await entrarGoogle())await irParaPainel()});
$("#rec").onclick=async e=>{e.preventDefault();const m=f.email.value.trim();if(!m)return toast("Digite seu e-mail e toque em Esqueci a senha.","err");
try{await sendPasswordResetEmail(auth,m)}catch(x){if(x.code==="auth/invalid-email")return toast("E-mail inválido.","err")}toast("Se este e-mail tiver conta, enviamos o link para criar uma nova senha.")}};

P.cadastro=async(t,s)=>{if(s)return irParaPainel();if(!t||t.suspenso){$("#f").closest("section").innerHTML=`<h1>Cadastro</h1><p class="lead">O cadastro é feito pelo link da sua loja. Peça o link ao estabelecimento.</p>`;return}const f=$("#f");
f.onsubmit=e=>{e.preventDefault();if(!f.lgpd.checked)return toast("Aceite o uso dos dados para continuar.","err");
acao($("button",f),async()=>{const c=await createUserWithEmailAndPassword(auth,f.email.value.trim(),f.senha.value);const nome=f.nome.value.trim();
await updateProfile(c.user,{displayName:nome});await garantirPerfil(c.user,{nome,lgpdEm:1});await irParaPainel()})};
$("#g").onclick=e=>acao(e.currentTarget,async()=>{if(await entrarGoogle())await irParaPainel()})};

P.cliente=async(t,s)=>{if(!exigir(s,["cliente"]))return;const f=$("#f"),ref=doc(db,"users",s.u.uid),CAMPOS=["nome","telefone","nascimento","cpf","cep","endereco","estilo","pet"];
$("#petw").hidden=t?.tema?.segmento!=="pet";const d=(await getDoc(ref)).data()||{};CAMPOS.forEach(k=>f[k].value=d[k]||"");f.hidden=false;$("#carga").remove();
f.onsubmit=e=>{e.preventDefault();if(f.cpf.value&&!cpfValido(f.cpf.value))return toast("CPF inválido. Confira os números ou deixe em branco.","err");
acao($("button",f),async()=>{const v={};CAMPOS.forEach(k=>v[k]=f[k].value.trim());await setDoc(ref,v,{merge:true});toast("Perfil salvo.")})}};

P.personalizacao=async(t,s)=>{if(!exigir(s,["master","proprietario"]))return;$("#main").classList.add("largo");const adm=s.papel==="proprietario",f=$("#f"),sel=$("#lojas"),q=adm?{empty:false,docs:[await getDoc(doc(db,"tenants",s.tenantId))]}:await getDocs(collection(db,"tenants"));if(adm)sel.closest("label").hidden=true;
if(q.empty){$("#carga").remove();toast("Crie um estabelecimento primeiro, na tela Plataforma.","err");return}
const L=new Map(q.docs.map(d=>[d.id,{id:d.id,...d.data()}]));sel.innerHTML=[...L.values()].map(x=>`<option value="${esc(x.id)}">${esc(x.nome)}</option>`).join("");let cur,logo="",rota="index";
const D={cor:"#23395b",tema:"claro",estilo:"suave",fundo:"",fonte:"classica",borda:1,opac:100,prof:0,brilho:100,segmento:"barbearia",logoForma:"livre",logoCab:"lado",logoTam:36,nomeCab:"sim",logoHome:"nenhuma",logoHomeTam:140,layout:"cinema",heroAltura:"tela",heroCurva:"nenhuma",heroFiltro:"nenhum",heroOverlay:40,heroAnim:"zoom",fxFoto:"zoom",homeTitulo:"",homeSub:"",ctaTexto:"",ctaEstilo:"solido",nomeHome:"sim",subHome:"sim",nomeTam:100,tituloAnim:"nenhum",textoPos:"bl",homeEquipe:"nao",equipeModelo:"grade",equipeForma:"arco",equipeTam:"m",equipeEfeito:"tilt",fotoLayout:"grade",fotoForma:"arco",fotoEfeito:"contorno",dataModelo:"faixa",horaModelo:"pilulas",faixaEstilo:"barbeiro",faixaCorModo:"auto",faixaCor1:"#23395b",faixaCor2:"#b3382c",faixaAltura:4,faixaEfeito:"desenhar"};
const ler=()=>({...Object.fromEntries(Object.keys(D).map(k=>[k,f[k].type==="range"?+f[k].value:f[k].value])),logo,secoes:[...f.querySelectorAll("[name=sec]:checked")].map(x=>x.value)});
const TELAS={cliente:[["index","Início"],["agendar","Agendar"]],loja:[["agendamentos","Agenda"],["unidades","Unidades"],["profissionais","Profissionais"],["servicos","Serviços"],["avaliacoes","Avaliações"],["indicadores","Indicadores"]]};
const telas=()=>{$("#vtela").innerHTML=TELAS[$("#vmodo").value].map(([r,n])=>`<option value="${r}">${n}</option>`).join("");$("#vtela").value=rota};
const ajustar=()=>{const fr=$(".frame"),i=$("#vif");if(!fr||!i)return;const d=$("#vdisp").value,bw=d==="100%"?1280:+d,W=fr.clientWidth||bw,H=fr.clientHeight||700,k=Math.min(1,W/bw);
i.style.width=bw+"px";i.style.height=H/k+"px";i.style.transform=`scale(${k})`;i.style.transformOrigin="top left";i.style.left=Math.max(0,(W-bw*k)/2)+"px"};
const carregar=()=>{const i=$("#vif");i.src=`${location.pathname}?s=${encodeURIComponent(cur.id)}&vis=${$("#vmodo").value}&_=${Date.now()}#/${rota}`;$("#vabrir").href=i.src.replace(/&_=\d+/,"");ajustar()};
const msg=m=>$("#vif")?.contentWindow?.postMessage(m,location.origin);
const enviar=()=>msg({tema:ler(),nome:f.nome.value}),pv=()=>{const tm=ler();aplicarTema(tm);enviar()};
const ABA={agendamento:"agendar"};
const aba=n=>{f.querySelectorAll("[data-aba]").forEach(x=>x.hidden=x.dataset.aba!==n);$("#abas").querySelectorAll("button").forEach(b=>b.setAttribute("aria-selected",b.dataset.aba===n));
const r=ABA[n]||"index";if($("#vmodo").value==="cliente"&&r!==rota){rota=r;$("#vtela").value=r;msg({rota:r})}};
addEventListener("message",function m(e){if(!$("#vif")){removeEventListener("message",m);return}if(e.origin!==location.origin)return;if(e.data?.rota){rota=e.data.rota;if([...$("#vtela").options].some(o=>o.value===rota))$("#vtela").value=rota}if(e.data?.pronto)enviar()});
async function galeria(){const g=await getDocs(collection(db,"tenants",cur.id,"vitrine"));$("#gal").innerHTML=g.empty?`<p class="mute">Nenhuma foto na vitrine ainda.</p>`:g.docs.map(d=>`<figure class="mini"><img src="${d.data().img}" alt=""><figcaption>${esc(d.data().tipo)}</figcaption><button type="button" data-x="${d.id}" aria-label="Remover foto">×</button></figure>`).join("")}
const legadoLogo=x=>{if(x.logoCab||x.logoHome)return x;return{...x,...legado(x)}};
const escolher=async()=>{cur=L.get(sel.value);let x={...D,...legadoLogo(cur.tema||{})};if(x.layout==="editorial")x.layout="divisao";logo=x.logo||"";f.nome.value=cur.nome||"";f.descricao.value=cur.descricao||"";
Object.keys(D).forEach(k=>f[k].value=x[k]);f.logo.value="";const sec=x.secoes||ALLSEC;f.querySelectorAll("[name=sec]").forEach(c=>c.checked=sec.includes(c.value));pv();await galeria();carregar()};
$("#abas").onclick=e=>{const b=e.target.closest("button");if(b)aba(b.dataset.aba)};
$("#vmodo").onchange=()=>{rota=TELAS[$("#vmodo").value][0][0];telas();carregar()};$("#vtela").onchange=()=>{rota=$("#vtela").value;msg({rota})};$("#vdisp").onchange=ajustar;
const cheia=on=>{$("#prev").classList.toggle("cheia",on);document.body.classList.toggle("cheia",on);$("#vsair").hidden=!on;$("#vcheia").hidden=on;setTimeout(ajustar,60)};
$("#vfoco").onclick=()=>{$(".studio").classList.toggle("foco");setTimeout(ajustar,60)};$("#vcheia").onclick=()=>cheia(true);$("#vsair").onclick=()=>cheia(false);addEventListener("resize",ajustar);if(typeof ResizeObserver!=="undefined")new ResizeObserver(ajustar).observe($(".frame"));
document.addEventListener("keydown",function k(e){if(!$("#prev")){document.removeEventListener("keydown",k);document.body.classList.remove("cheia");return}if(e.key==="Escape")cheia(false)});
$("#carga").remove();$("#painel").hidden=false;$("#prev").hidden=false;telas();aba("marca");
f.logo.onchange=async()=>{if(f.logo.files[0]){logo=await imgData(f.logo.files[0],320,true);pv();toast("Logo carregada. Salve para publicar.")}};
f.oninput=e=>{if(!["logo","fotos","tipo","legenda"].includes(e.target.name))pv()};f.onchange=e=>{if(e.target.name==="sec")pv()};$("#descartar").onclick=escolher;sel.onchange=escolher;
$("#gal").onclick=e=>{const b=e.target.closest("[data-x]");if(b)acao(b,async()=>{await deleteDoc(doc(db,"tenants",cur.id,"vitrine",b.dataset.x));await galeria();enviar()})};
$("#addfoto").onclick=e=>acao(e.currentTarget,async()=>{const fs=[...f.fotos.files];if(!fs.length)return toast("Escolha ao menos uma foto.","err");
for(const x of fs)await addDoc(collection(db,"tenants",cur.id,"vitrine"),{img:await imgData(x,1000),legenda:f.legenda.value.trim(),tipo:f.tipo.value,ordem:Date.now()});f.fotos.value="";toast(`${fs.length} foto(s) adicionada(s).`);await galeria();enviar()});
f.onsubmit=e=>{e.preventDefault();if(!f.nome.value.trim())return toast("Informe o nome do estabelecimento.","err");
acao($("button[type=submit]",f),async()=>{const novo={nome:f.nome.value.trim(),descricao:f.descricao.value.trim(),tema:ler()};await updateDoc(doc(db,"tenants",cur.id),novo);await auditar("tenant.aparencia",{id:cur.id});Object.assign(cur,novo);pwa(cur);TC.clear();toast("Aparência salva.")})};
await escolher()};

P.master=async(t,s)=>{if(!exigir(s,["master"]))return;const L=$("#lista"),sel=$("#sel");
async function listar(){const q=await getDocs(collection(db,"tenants"));$("#carga")?.remove();
L.innerHTML=q.empty?`<li class="mute">Nenhum estabelecimento ainda. Crie o primeiro ao lado.</li>`:q.docs.map(d=>{const x=d.data(),on=x.status!=="suspenso";
return`<li><span><strong>${esc(x.nome)}</strong><br><span class="mute">${esc(d.id)}</span> <span class="tag ${on?"":"off"}">${on?"ativo":"suspenso"}</span></span><a class="btn sm" href="?s=${esc(d.id)}&gerir=1#/agendamentos">Gerenciar</a> <button class="btn ghost sm" data-lk="${esc(d.id)}">Copiar link</button> <button class="btn ghost" data-id="${esc(d.id)}" data-st="${on?"suspenso":"ativo"}">${on?"Suspender":"Reativar"}</button></li>`}).join("");
sel.innerHTML=q.docs.map(d=>`<option value="${esc(d.id)}">${esc(d.data().nome)}</option>`).join("")}
L.onclick=e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.lk){navigator.clipboard?.writeText(linkLoja(b.dataset.lk)).then(()=>toast("Link de acesso copiado."),()=>toast("Não foi possível copiar.","err"));return}acao(b,async()=>{await updateDoc(doc(db,"tenants",b.dataset.id),{status:b.dataset.st});await auditar("tenant.status",{id:b.dataset.id,status:b.dataset.st});toast("Status atualizado.");await listar()})};
$("#nova").onsubmit=e=>{e.preventDefault();const f=e.target,id=f.id_.value.trim().toLowerCase();
if(!/^[a-z0-9-]{3,40}$/.test(id))return toast("Endereço: use 3 a 40 letras minúsculas, números ou hífen.","err");
acao($("button",f),async()=>{if((await getDoc(doc(db,"tenants",id))).exists())return toast("Este endereço já está em uso.","err");
await setDoc(doc(db,"tenants",id),{slug:id,nome:f.nome.value.trim(),descricao:"",status:"ativo",tema:{cor:f.cor.value,tema:"claro",estilo:"suave"},criadoEm:serverTimestamp()});
await auditar("tenant.criado",{id});f.reset();toast("Estabelecimento criado.");await listar()})};
$("#dono").onsubmit=e=>{e.preventDefault();const f=e.target;acao($("button",f),async()=>{
const q=await getDocs(query(collection(db,"users"),where("email","==",f.email.value.trim().toLowerCase()),limit(1)));
if(q.empty)return toast("Nenhuma conta com esse e-mail. A pessoa precisa se cadastrar primeiro.","err");
await setDoc(doc(db,"acessos",q.docs[0].id),{tenantId:sel.value,papel:"proprietario",unidades:[],permissoes:[],email:f.email.value.trim().toLowerCase(),nome:q.docs[0].data().nome||""});await auditar("acesso.concedido",{uid:q.docs[0].id,tenantId:sel.value});f.reset();toast("Proprietário vinculado.")})};
await listar()};

/* ==== 6f. AVALIAÇÕES ==== */
async function rev(t){const q=await getDocs(query(collection(db,"tenants",t.id,"avaliacoes"),where("publica","==",true),limit(6)));
return q.empty?"":`<div class="grid" style="width:100%;margin-top:2rem">${q.docs.map(d=>{const a=d.data();return`<figure class="card" style="margin:0"><strong>${"★".repeat(a.nota)}</strong><p>${esc(a.txt)}</p><figcaption class="mute">${esc(a.nome)} · ${esc(a.profNome)}</figcaption></figure>`}).join("")}</div>`}
P.avaliacoes=async(t,s)=>{if(!exigir(s,["proprietario","equipe"],"avaliacoes"))return;const L=$("#lista");
async function lista(){const q=await getDocs(collection(db,"tenants",t.id,"avaliacoes")),l=q.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.em?.seconds||0)-(a.em?.seconds||0));
L.innerHTML=l.length?l.map(a=>`<li><span><strong>${"★".repeat(a.nota)}${"☆".repeat(5-a.nota)}</strong> ${esc(a.nome)} · ${esc(a.profNome)}<br><span class="mute">${esc(a.txt||"Sem comentário")}</span></span><button class="btn ghost" data-id="${a.id}" data-p="${!a.publica}">${a.publica?"Ocultar":"Publicar"}</button></li>`).join(""):`<li class="mute">Nenhuma avaliação recebida ainda.</li>`;
$("#media").textContent=l.length?`Média geral ${(l.reduce((n,a)=>n+a.nota,0)/l.length).toFixed(1)} em ${l.length} avaliações. Só as publicadas aparecem na página inicial.`:""}
L.onclick=e=>{const b=e.target.closest("button");if(b)acao(b,async()=>{await updateDoc(doc(db,"tenants",t.id,"avaliacoes",b.dataset.id),{publica:b.dataset.p==="true"});await lista()})};await lista()};

/* ==== 6g. INDICADORES (ECharts), FINANCEIRO E CSV ==== */
const carregarEcharts=()=>window.echarts?Promise.resolve():new Promise((ok,no)=>{const x=document.createElement("script");x.src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js";x.onload=ok;x.onerror=()=>no({message_pt:"Não foi possível carregar os gráficos. Verifique a conexão."});document.head.append(x)});
P.indicadores=async(t,s)=>{if(!exigir(s,["proprietario"]))return;const de=$("#de"),ate=$("#ate");de.value=hoje().slice(0,8)+"01";ate.value=hoje();let L=[];$("#un").innerHTML+=(await getDocs(collection(db,"tenants",t.id,"unidades"))).docs.map(d=>`<option value="${esc(d.id)}">${esc(d.data().nome)}</option>`).join("");
async function carregar(){$("#kpis").innerHTML=`<div class="skel"></div>`;const q=await getDocs(query(collection(db,"tenants",t.id,"agendamentos"),where("inicio",">=",de.value),where("inicio","<=",ate.value+"T23:59")));L=q.docs.map(d=>d.data()).filter(a=>!$("#un").value||a.unidadeId===$("#un").value);
const c=L.filter(a=>a.status==="concluido"),soma=x=>x.reduce((n,a)=>n+(Number(a.preco)-Number(a.desconto||0)),0);
if(!L.length){$("#kpis").innerHTML=`<p class="mute">Sem agendamentos neste período.</p>`;["c1","c2","prof"].forEach(i=>$("#"+i).innerHTML="");return}
const k=(l,v)=>`<div class="card"><span class="mute">${l}</span><div class="kpi">${v}</div></div>`;
$("#kpis").innerHTML=k("Agendamentos",L.length)+k("Concluídos",c.length)+k("Cancelados e faltas",L.filter(a=>["cancelado","ausente"].includes(a.status)).length)+k("A realizar",brl(soma(L.filter(a=>a.status==="agendado"))))+k("Realizado",brl(soma(c)))+k("Recebido",brl(soma(c.filter(a=>a.pagamento!=="A receber"))));
await carregarEcharts();const cor=getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
const g=(id,o)=>{const e=echarts.getInstanceByDom($("#"+id))||echarts.init($("#"+id));e.setOption({color:[cor],grid:{left:48,right:12,top:40,bottom:30},tooltip:{trigger:"axis"},...o},true)};
const por=(f)=>c.reduce((m,a)=>(m[f(a)]=(m[f(a)]||0)+(Number(a.preco)-Number(a.desconto||0)),m),{}),dia=por(a=>a.inicio.slice(0,10)),sv=por(a=>a.servicoNome),ks=Object.keys(dia).sort();
g("c1",{title:{text:"Realizado por dia",textStyle:{fontSize:14}},xAxis:{type:"category",data:ks},yAxis:{type:"value"},series:[{type:"line",smooth:true,data:ks.map(x=>dia[x])}]});
g("c2",{title:{text:"Receita por serviço",textStyle:{fontSize:14}},xAxis:{type:"category",data:Object.keys(sv)},yAxis:{type:"value"},series:[{type:"bar",data:Object.values(sv)}]});
const pf={};c.forEach(a=>{const p=pf[a.profNome]??={n:0,v:0,com:0};p.n++;p.v+=(Number(a.preco)-Number(a.desconto||0));p.com+=(Number(a.preco)-Number(a.desconto||0))*(a.comissaoPct||0)/100});
$("#prof").innerHTML=Object.entries(pf).map(([n,p])=>`<li><span><strong>${esc(n)}</strong><br><span class="mute">${p.n} atendimentos · ${brl(p.v)}</span></span><strong>Comissão ${brl(p.com)}</strong></li>`).join("")||`<li class="mute">Nenhum atendimento concluído no período.</li>`}
de.onchange=ate.onchange=$("#un").onchange=()=>acao(de,carregar);
$("#csv").onclick=()=>{if(!L.length)return toast("Não há dados no período.","err");const r=[["data","hora","cliente","servico","profissional","unidade","preco","comissao_pct","status"],...L.map(a=>[a.inicio.slice(0,10),a.inicio.slice(11),a.clienteNome,a.servicoNome,a.profNome,a.unidadeNome,a.preco,a.comissaoPct??"",a.status])];
const l=document.createElement("a");l.href=URL.createObjectURL(new Blob(["\ufeff"+r.map(x=>x.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n")],{type:"text/csv"}));l.download=`agendamentos_${de.value}_${ate.value}.csv`;l.click()};
await carregar()};

/* ==== 6h. PWA E IDENTIDADE (favicon, ícone e manifesto gerados da logo da loja) ==== */
function pwa(t){const l=t.tema?.logo;if(!l||pwa.k===t.id+l.length)return;pwa.k=t.id+l.length;const i=new Image();
i.onload=()=>{const ic=z=>{const c=document.createElement("canvas");c.width=c.height=z;c.getContext("2d").drawImage(i,0,0,z,z);return c.toDataURL("image/png")},cor=t.tema.cor||"#23395b";
$("#fav").href=ic(64);$("#ati").href=ic(180);$("meta[name=theme-color]").content=cor;
$("#mf").href=URL.createObjectURL(new Blob([JSON.stringify({name:t.nome,short_name:t.nome.slice(0,12),start_url:location.origin+location.pathname+"?s="+t.id,scope:location.origin+location.pathname,display:"standalone",background_color:cor,theme_color:cor,icons:[192,512].map(z=>({src:ic(z),sizes:z+"x"+z,type:"image/png"}))})],{type:"application/manifest+json"}))};i.src=l}

/* ==== 6b. IMAGENS (plano A: reduzidas no navegador e guardadas no próprio Firestore) ==== */
const imgData=(f,max=480,png)=>new Promise((ok,no)=>{const i=new Image(),u=URL.createObjectURL(f);i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement("canvas");c.width=i.width*k;c.height=i.height*k;c.getContext("2d").drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL(png?"image/png":"image/jpeg",.78))};i.onerror=no;i.src=u});

/* ==== 6c. CADASTROS DO PROPRIETÁRIO (unidades, profissionais, serviços) ==== */
const CFG={produtos:{t:"Produtos e estoque",f:[["nome","Nome"],["preco","Preço de venda (R$)","number"],["estoque","Quantidade em estoque","number"],["minimo","Alerta de estoque mínimo","number"]]},
planos:{t:"Planos e pacotes",f:[["nome","Nome"],["preco","Preço (R$)","number"],["sessoes","Quantidade de sessões","number"],["validade","Validade (dias)","number"],["descricao","Descrição"]]},
unidades:{t:"Unidades",f:[["nome","Nome"],["endereco","Endereço"],["telefone","Telefone"],["capacidade","Atendimentos simultâneos","number"],["horarios","Dias e horários de atendimento","semana"]]},
profissionais:{t:"Profissionais",f:[["nome","Nome"],["unidadeId","Unidade","ref"],["dias","Dias de atendimento","dias"],["abre","Início do expediente (opcional)","time"],["fecha","Fim do expediente (opcional)","time"],["comissao","Comissão (%)","number"],["link","Link do atendimento online (opcional)"],["fixo","Remuneração fixa mensal (R$)","number"],["foto","Foto","img"]]},
servicos:{t:"Serviços",f:[["nome","Nome"],["preco","Preço (R$)","number"],["duracao","Duração (minutos)","number"]]}};
const DIAS=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const blocoDias=(n,l,ty,x)=>{if(ty==="dias"){const a=Array.isArray(x.dias)?x.dias:[0,1,2,3,4,5,6];return`<fieldset class="semana"><legend>${l}</legend><div class="dchk">${[1,2,3,4,5,6,0].map(i=>`<label class="ck"><input type="checkbox" data-pd="${i}"${a.includes(i)?" checked":""}>${DIAS[i].slice(0,3)}</label>`).join("")}</div></fieldset>`}
const H=x.horarios||{};return`<fieldset class="semana"><legend>${l}</legend>${[1,2,3,4,5,6,0].map(i=>{const h=H[i]||{on:x.abre?!x.horarios:i!==0,abre:x.abre||"09:00",fecha:x.fecha||"18:00"};return`<div class="sd"><label class="ck"><input type="checkbox" data-dc="${i}"${h.on?" checked":""}>${DIAS[i]}</label><input type="time" data-da="${i}" value="${h.abre||"09:00"}" aria-label="Abre ${DIAS[i]}"><span>às</span><input type="time" data-df="${i}" value="${h.fecha||"18:00"}" aria-label="Fecha ${DIAS[i]}"></div>`}).join("")}</fieldset>`};
const lerSemana=F=>Object.fromEntries([0,1,2,3,4,5,6].map(i=>[i,{on:F.querySelector(`[data-dc="${i}"]`).checked,abre:F.querySelector(`[data-da="${i}"]`).value,fecha:F.querySelector(`[data-df="${i}"]`).value}]));
const resumoDias=x=>{const H=x.horarios;if(!H)return`${x.abre} às ${x.fecha}`;return`${[1,2,3,4,5,6,0].filter(i=>H[i]?.on).map(i=>DIAS[i].slice(0,3)).join(", ")||"Sem dias"} · ${x.abre} às ${x.fecha}`};
const INFO={unidades:x=>`${resumoDias(x)} · ${x.capacidade} atendimento(s) simultâneo(s)`,profissionais:x=>`${Array.isArray(x.dias)?x.dias.map(i=>DIAS[i].slice(0,3)).join(", "):"Todos os dias"} · comissão de ${x.comissao||0}%`,servicos:x=>`${brl(x.preco)} · ${x.duracao} min`,produtos:x=>`${brl(x.preco)} · ${x.estoque||0} em estoque${(x.estoque||0)<=(x.minimo||0)?" · estoque baixo":""}`,planos:x=>`${brl(x.preco)} · ${x.sessoes} sessões · ${x.validade} dias`};
async function migrarDia(t){const k="dia_"+t.id;if(localStorage.getItem(k))return;
try{const q=await getDocs(query(collection(db,"tenants",t.id,"agendamentos"),where("inicio",">=","2000")));await Promise.all(q.docs.filter(d=>!d.data().dia).map(d=>updateDoc(d.ref,{dia:d.data().inicio.slice(0,10)})));localStorage.setItem(k,"1")}catch(e){console.warn("migração de datas",e.code)}}
async function crud(t,s,k){if(!exigir(s,k==="unidades"||k==="planos"?["proprietario"]:["proprietario","equipe"],k))return;const C=CFG[k],col=collection(db,"tenants",t.id,k),F=$("#f"),L=$("#lista");let ed=null,docs=new Map();
const un=k==="profissionais"?(await getDocs(collection(db,"tenants",t.id,"unidades"))).docs:[];$("#carga").remove();$("#tit").textContent=C.t;
const form=()=>{F.innerHTML=C.f.map(([n,l,ty])=>ty==="semana"||ty==="dias"?blocoDias(n,l,ty,ed?docs.get(ed):{}):`<label>${l}`+(ty==="ref"?`<select name="${n}" required>${un.map(d=>`<option value="${d.id}">${esc(d.data().nome)}</option>`).join("")}</select>`:ty==="img"?`<input name="${n}" type="file" accept="image/*">`:`<input name="${n}" type="${ty||"text"}" ${ty==="number"?'step="any" min="0"':""} ${n==="nome"?"required":""}>`)+`</label>`).join("")+`<button class="btn">${ed?"Salvar alterações":"Adicionar"}</button> <button class="btn ghost" type="button" id="novo">Limpar</button>`;
if(ed)C.f.forEach(([n,,ty])=>{if(ty!=="img"&&ty!=="semana"&&ty!=="dias")F[n].value=docs.get(ed)[n]??""});$("#novo").onclick=()=>{ed=null;form()}};
async function lista(){const q=await getDocs(col);docs=new Map(q.docs.map(d=>[d.id,d.data()]));
L.innerHTML=q.empty?`<li class="mute">Nada cadastrado ainda. Use o formulário para adicionar.</li>`:q.docs.map(d=>{const x=d.data();return`<li><span class="it">${x.foto?`<img class="av-sm" src="${x.foto}" alt="">`:`<i class="av-sm av-ph">${esc((x.nome||"?")[0])}</i>`}<span class="tx"><strong>${esc(x.nome)}</strong>${x.ativo===false?' <span class="tag off">pausado</span>':""}<br><span class="mute">${INFO[k](x)}</span></span></span><span class="acoes">${k==="produtos"?`<button class="btn sm" data-v="${d.id}">Vender</button>`:""}<button class="btn ghost" data-p="${d.id}">${x.ativo===false?"Ativar":"Pausar"}</button><button class="btn ghost" data-e="${d.id}">Editar</button> <button class="btn ghost" data-x="${d.id}">Excluir</button></span></li>`}).join("")}
L.onclick=e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.v)return acao(b,async()=>{const q=Math.round(+prompt("Quantidade vendida:","1")),f=(prompt("Forma de pagamento (Pix, Cartão ou Dinheiro):","Pix")||"").trim();if(!(q>=1))return;if(!["Pix","Cartão","Dinheiro"].includes(f))return toast("Forma de pagamento inválida.","err");
const cp=(prompt("Cupom de desconto (opcional):","")||"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"");let desc=0;
if(cp){const pd=await getDoc(doc(db,"tenants",t.id,"promocoes",cp)),px=pd.data();if(!pd.exists()||px.ativo===false||(px.validade&&px.validade<hoje())||px.alvoTipo!=="produto"||px.alvoId!==b.dataset.v)return toast("Cupom inválido para este produto.","err");const base=q*Number(docs.get(b.dataset.v).preco);desc=Math.min(base,px.tipo==="percent"?base*px.valor/100:px.valor)}
const pr=doc(col,b.dataset.v);await runTransaction(db,async tx=>{const p=(await tx.get(pr)).data();if((p.estoque||0)<q)throw{message_pt:"Estoque insuficiente."};tx.update(pr,{estoque:p.estoque-q});tx.set(doc(collection(db,"tenants",t.id,"vendas")),{produtoId:b.dataset.v,nome:p.nome,qtd:q,valor:q*Number(p.preco)-desc,desconto:desc,cupom:cp,forma:f,data:hoje(),mes:hoje().slice(0,7),por:s.u.uid})});toast("Venda registrada.");await lista()});
if(b.dataset.p)return acao(b,async()=>{await updateDoc(doc(col,b.dataset.p),{ativo:docs.get(b.dataset.p).ativo===false});await lista()});if(b.dataset.e){ed=b.dataset.e;form();F.scrollIntoView({behavior:"smooth"})}
else acao(b,async()=>{if(!confirm("Excluir este item? Agendamentos já feitos são mantidos."))return;await deleteDoc(doc(col,b.dataset.x));toast("Excluído.");await lista()})};
F.onsubmit=e=>{e.preventDefault();acao($("button",F),async()=>{const v={};for(const[n,,ty]of C.f){if(ty==="semana"){v.horarios=lerSemana(F);const on=Object.values(v.horarios).filter(x=>x.on);v.abre=on.map(x=>x.abre).sort()[0]||"";v.fecha=on.map(x=>x.fecha).sort().slice(-1)[0]||"";continue}if(ty==="dias"){v.dias=[...F.querySelectorAll("[data-pd]:checked")].map(x=>+x.dataset.pd);continue}if(ty==="img"){v[n]=F[n].files[0]?await imgData(F[n].files[0]):(ed?docs.get(ed)[n]||"":"")}else v[n]=ty==="number"?Number(F[n].value||0):F[n].value.trim()}
if(k==="unidades"&&(!(v.capacidade>=1)||!v.abre||!v.fecha||v.abre>=v.fecha))return toast("Informe capacidade (mínimo 1) e um horário de abertura anterior ao de fechamento.","err");
if(k==="unidades"&&v.horarios&&(!Object.values(v.horarios).some(x=>x.on)||Object.values(v.horarios).some(x=>x.on&&(!x.abre||!x.fecha||x.abre>=x.fecha))))return toast("Marque ao menos um dia de atendimento e use abertura anterior ao fechamento.","err");
if(k==="profissionais"&&v.dias&&!v.dias.length)return toast("Marque ao menos um dia de atendimento do profissional.","err");
if(k==="servicos"&&(!(v.duracao>=15)||!(v.preco>=0)))return toast("Informe preço e duração de pelo menos 15 minutos.","err");
if(k==="planos"&&(!(v.sessoes>=1)||!(v.validade>=1)||!(v.preco>=0)))return toast("Informe preço, sessões (mínimo 1) e validade em dias.","err");
if(k==="profissionais"&&!v.unidadeId)return toast("Cadastre uma unidade antes.","err");
ed?await updateDoc(doc(col,ed),v):await addDoc(col,{...v,ativo:true,criadoEm:serverTimestamp()});toast("Salvo.");ed=null;form();await lista()})};
form();await lista()}
P.unidades=(t,s)=>crud(t,s,"unidades");P.planos=(t,s)=>crud(t,s,"planos");P.produtos=(t,s)=>crud(t,s,"produtos");P.profissionais=(t,s)=>crud(t,s,"profissionais");P.servicos=(t,s)=>crud(t,s,"servicos");

/* ==== 6d. AGENDAMENTO (reserva atômica via transação + travas no Firestore) ==== */
const pad=n=>String(n).padStart(2,"0"),hm=m=>pad(m/60|0)+":"+pad(m%60),mins=h=>+h.slice(0,2)*60+ +h.slice(3);
const DEFWA="Olá, {nome}! Passando para confirmar o seu horário: {servico} com {profissional}, {data} às {hora}, na {loja}. Pode confirmar sua presença?";
const WAI=`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 01-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1121 12z"/></svg>`;
const linkLoja=id=>`${location.origin}${location.pathname}?s=${encodeURIComponent(id)}`;
const somaDia=(d,n)=>{const x=new Date(d+"T12:00");x.setDate(x.getDate()+n);return new Date(x-x.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const hoje=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const brl=v=>Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmt=i=>new Date(i).toLocaleString("pt-BR",{weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
async function cancelar(tid,id,novo="cancelado"){const ar=doc(db,"tenants",tid,"agendamentos",id);await runTransaction(db,async tx=>{const a=await tx.get(ar),x=a.data();if(x.status!=="agendado")return;
const cr=x.caps.map(i=>doc(db,"tenants",tid,"cap",i)),K=await Promise.all(cr.map(r=>tx.get(r)));x.locks.forEach(i=>tx.delete(doc(db,"tenants",tid,"locks",i)));
cr.forEach((r,i)=>tx.set(r,{n:Math.max(0,(K[i].data()?.n||1)-1),u:x.unidadeId,d:x.inicio.slice(0,10)}));tx.update(ar,{status:novo})})}
P.agendar=async(t,s)=>{if(!exigir(s,["cliente","proprietario","master"]))return;const A=$("#app");
if(!t||t.suspenso){A.innerHTML=`<p class="lead">Acesse pelo link da sua loja para agendar.</p>`;return}
const C=n=>collection(db,"tenants",t.id,n),ler=async n=>(await getDocs(C(n))).docs.map(d=>({id:d.id,...d.data()}));
const[U0,PR,SV,BL]=await Promise.all([ler("unidades"),ler("profissionais"),ler("servicos"),ler("bloqueios")]);const U=U0.filter(u=>u.ativo!==false);let ML=[];
const meus=async()=>{const q=await getDocs(query(C("agendamentos"),where("clienteUid","==",s.u.uid)));
if(t.fidelidade?.ativo){const m=t.fidelidade.meta||10,f=(await getDoc(doc(C("fidelidade"),s.u.uid))).data()||{},n=Math.min(f.n||0,m);
$("#fid").innerHTML=`<div class="card fid"><strong>Cartão fidelidade${t.fidelidade.brinde?" · "+esc(t.fidelidade.brinde):""}</strong><div class="selos" role="img" aria-label="${n} de ${m} carimbos">${Array.from({length:m},(_,i)=>`<i class="${i<n?"on":""}"></i>`).join("")}</div><span class="mute">${n} de ${m} atendimentos${f.brindes?` · <strong>${f.brindes} brinde(s) disponível(is)</strong>`:""}</span></div>`}else $("#fid").innerHTML="";
const l=q.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>b.inicio.localeCompare(a.inicio));ML=l;const av=new Set((await getDocs(query(C("avaliacoes"),where("cli","==",s.u.uid)))).docs.map(d=>d.id));
$("#meus").innerHTML=l.length?l.map(a=>`<li><span><strong>${esc(a.servicoNome)}</strong> com ${esc(a.profNome)}<br><span class="mute">${esc(fmt(a.inicio))} · ${esc(a.unidadeNome)}</span></span><span><span class="tag ${a.status==="cancelado"?"off":""}">${a.status}</span>${a.status==="agendado"&&new Date(a.inicio)>new Date()?` ${a.link?`<a class="btn ghost" target="_blank" rel="noopener noreferrer" href="${esc(a.link)}">Entrar online</a> `:""}${a.confirmado?'<span class="tag">confirmado</span> ':`<button class="btn ghost" data-ok="${a.id}">Confirmar presença</button> `}<button class="btn ghost" data-c="${a.id}">Cancelar</button>`:""}${a.status==="concluido"&&!av.has(a.id)?` <button class="btn ghost" data-v="${a.id}">Avaliar</button>`:""}</span></li>`).join(""):`<li class="mute">Você ainda não tem agendamentos.</li>`};
$("#meus").onclick=e=>{const v=e.target.closest("[data-v]");if(v)return acao(v,async()=>{const a=ML.find(x=>x.id===v.dataset.v),nota=Math.round(+prompt("Nota de 1 a 5 para o atendimento:"));if(!(nota>=1&&nota<=5))return toast("Informe uma nota de 1 a 5.","err");const txt=(prompt("Comentário (opcional):")||"").trim().slice(0,500);await setDoc(doc(C("avaliacoes"),a.id),{cli:s.u.uid,nome:(s.u.displayName||"Cliente").split(" ")[0],profId:a.profId,profNome:a.profNome,nota,txt,publica:false,em:serverTimestamp()});toast("Obrigado pela avaliação!");await meus()});
const k=e.target.closest("[data-ok]");if(k)return acao(k,async()=>{await updateDoc(doc(C("agendamentos"),k.dataset.ok),{confirmado:true});toast("Presença confirmada. Obrigado!");await meus()});
const b=e.target.closest("[data-c]");if(b)acao(b,async()=>{const ag=ML.find(x=>x.id===b.dataset.c),h=t.politica?.horas||0;if(h&&(new Date(ag.inicio)-Date.now())/36e5<h)return toast(`Cancelamentos só são aceitos com ${h}h de antecedência. Fale com a loja.`,"err");if(!confirm("Cancelar este agendamento?"))return;await cancelar(t.id,b.dataset.c);toast("Agendamento cancelado.");await meus()})};
if(!U.length||!SV.length){A.innerHTML=`<p class="lead">Este estabelecimento ainda não liberou horários.</p>`;return meus()}
/* assistente em etapas: unidade, profissional, serviço, data, horário */
const unica=U.length===1,st={step:unica?1:0,u:unica?U[0].id:"",p:null,s:"",d:"",sl:null,lista:[]},NOMES=["Unidade","Profissional","Serviço","Data","Horário"];
const profs=()=>PR.filter(p=>p.unidadeId===st.u&&p.ativo!==false),sv=()=>SV.find(x=>x.id===st.s);
const X=t.textos||{},TM=t.tema||{};const dias=[...Array(28)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)});
const cl=(sel,any)=>sel?"sel":any?"dim":"";
const opt=(k,id,h,sel,any)=>`<button type="button" class="opt ${cl(sel,any)}" data-k="${k}" data-id="${esc(id)}" aria-pressed="${sel}">${h}</button>`;
const pc=(id,nome,foto,sel)=>`<button type="button" class="pcard ${cl(sel,st.p!==null)}" data-k="p" data-id="${esc(id)}" aria-pressed="${sel}"><span class="arch${id===""?" mix":""}">${id===""?(profs().filter(x=>x.foto).slice(0,3).map(x=>`<img src="${x.foto}" alt="">`).join("")||`<i>✦</i>`):foto?`<img src="${foto}" alt="">`:`<i>${esc((nome[0]||"?").toUpperCase())}</i>`}<em class="tick">✓</em></span><strong>${esc(nome)}</strong></button>`;
const sumario=()=>{const c=[];if(st.step>0&&st.u&&!unica)c.push(`<span class="tg">${esc(U.find(x=>x.id===st.u)?.nome)}</span>`);
if(st.step>1&&st.p!==null){const x=PR.find(y=>y.id===st.p);c.push(`<span class="tg"><span class="av">${x?.foto?`<img src="${x.foto}" alt="">`:"✦"}</span>${esc(x?.nome||"Sem preferência")}</span>`)}
if(st.step>2&&st.s)c.push(`<span class="tg">${esc(sv().nome)}</span>`);if(st.step>3&&st.d)c.push(`<span class="tg">${esc(new Date(st.d+"T12:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}))}</span>`);
return c.length?`<div class="sumario">${c.join("")}</div>`:""};
const ir=n=>{document.documentElement.dataset.dir=n<st.step?"back":"fwd";vt(()=>{st.step=n;draw()})};
const dx=d=>new Date(d+"T12:00"),wd=d=>dx(d).toLocaleDateString("pt-BR",{weekday:"short"}),mo=d=>dx(d).toLocaleDateString("pt-BR",{month:"short"}),rel=d=>d===dias[0]?"Hoje":d===dias[1]?"Amanhã":wd(d);
const fechado=d=>{const w=dx(d).getDay(),un=U.find(x=>x.id===st.u),h=un?.horarios?.[w];if(un?.horarios&&!(h&&h.on))return true;const ps=profs().filter(p=>!st.p||p.id===st.p);return ps.length>0&&!ps.some(p=>!Array.isArray(p.dias)||p.dias.includes(w))};
const dataHTML=()=>{const m=TM.dataModelo||"faixa",b=(d,c,h)=>`<button type="button" class="${c} ${st.d===d?"sel":""}" data-k="d" data-id="${d}" aria-pressed="${st.d===d}"${fechado(d)?" disabled":""}>${h}</button>`;
if(m==="calendario")return`<div class="cal">${["D","S","T","Q","Q","S","S"].map(x=>`<span class="cal-h">${x}</span>`).join("")}${"<span></span>".repeat(dx(dias[0]).getDay())}${dias.map(d=>b(d,"cal-d",`${d.slice(8)}${d.slice(8)==="01"||d===dias[0]?`<small>${mo(d)}</small>`:""}`)).join("")}</div>`;
if(m==="lista")return`<div class="dlist">${dias.map(d=>b(d,"dl",`<span>${rel(d)}</span><small>${d.slice(8)} de ${mo(d)}</small>`)).join("")}</div>`;
if(m==="destaque")return`<div class="days dest">${dias.map(d=>b(d,"dd",`<small>${wd(d)}</small><b>${d.slice(8)}</b><small>${mo(d)}</small>`)).join("")}</div>`;
if(m==="etiquetas")return`<div class="tags">${dias.map(d=>b(d,"chip",`${rel(d)} ${d.slice(8)}`)).join("")}</div>`;
return`<div class="days">${dias.map(d=>b(d,"day",`<small>${wd(d)}</small><b>${d.slice(8)}</b><small>${mo(d)}</small>`)).join("")}</div>`};
const horasHTML=out=>{const m=TM.horaModelo||"pilulas",L=out.map((o,i)=>[o,i]),b=(o,i,c)=>`<button type="button" class="${c}" data-k="h" data-id="${i}">${o.h}</button>`;
if(m==="grade")return`<div class="hgrade">${L.map(([o,i])=>b(o,i,"hq")).join("")}</div>`;
if(m==="periodos")return[["Manhã",0,12],["Tarde",12,18],["Noite",18,24]].map(([n,a,z])=>{const g=L.filter(([o])=>+o.h.slice(0,2)>=a&&+o.h.slice(0,2)<z);return g.length?`<h3 class="per">${n}</h3><div class="slots">${g.map(([o,i])=>b(o,i,"chip")).join("")}</div>`:""}).join("");
if(m==="lista")return`<div class="hlist">${L.map(([o,i])=>`<button type="button" class="hl" data-k="h" data-id="${i}"><b>${o.h}</b><span>Disponível</span></button>`).join("")}</div>`;
if(m==="trilho")return`<div class="trilho">${L.map(([o,i])=>b(o,i,"ht")).join("")}</div>`;
return`<div class="slots">${L.map(([o,i])=>b(o,i,"chip")).join("")}</div>`};
function draw(){const e=st.step,bar=`<ol class="steps">${NOMES.map((n,i)=>`<li class="${i<e?"feito":i===e?"atual":""}"><b>${i<e?"✓":i+1}</b><span>${n}</span></li>`).join("")}</ol>`;let p="";
if(e===0)p=`<h2>${esc(X.tu||"Onde você quer ser atendido?")}</h2><div class="opts">${U.map(u=>opt("u",u.id,`<strong>${esc(u.nome)}</strong><small>${esc(u.endereco||"")}</small>`,st.u===u.id,st.u)).join("")}</div>`;
if(e===1)p=`<h2>${esc(X.tp||voc(t).p)}</h2><div class="profs ${{tilt:"t3d",coverflow:"cflow",pilha:"deck"}[TM.fotoLayout]||""}">${pc("","Sem preferência","",st.p==="")}${profs().map(x=>pc(x.id,x.nome,x.foto,st.p===x.id)).join("")}</div>`;
if(e===2)p=`<h2>${esc(X.ts||voc(t).s)}</h2><div class="opts">${SV.filter(v=>v.ativo!==false).map(v=>opt("s",v.id,`<strong>${esc(v.nome)}</strong><small>${brl(v.preco)}</small>`,st.s===v.id,st.s)).join("")}</div>`;
if(e===3)p=`<h2>${esc(X.td||"Qual dia fica melhor?")}</h2>`+dataHTML();
if(e===4)p=`<h2>${esc(X.th||"Escolha o horário")}</h2><div id="hs"></div><div id="res"></div>`;
A.innerHTML=bar+sumario()+`<div class="panel">${p}</div>`+(e>(unica?1:0)?`<button class="btn ghost voltar" data-back>Voltar</button>`:"");const cf=$(".profs.cflow");if(cf){coverflow(cf);(cf.querySelector(".sel")||cf.children[Math.min(1,cf.children.length-1)])?.scrollIntoView({inline:"center",block:"nearest"})}if(e===4)slots()}
async function slots(){const H=$("#hs"),un=U.find(x=>x.id===st.u),v=sv(),n=Math.ceil(v.duracao/30);H.innerHTML=`<div class="skel"></div>`;
const q=[where("u","==",un.id),where("d","==",st.d)],[lk,cp]=await Promise.all([getDocs(query(C("locks"),...q)),getDocs(query(C("cap"),...q))]),Lk=new Set(lk.docs.map(d=>d.id)),K={};cp.docs.forEach(d=>K[d.id]=d.data().n);
const dow=new Date(st.d+"T12:00").getDay(),hh=un.horarios?(un.horarios[dow]||{on:false}):{on:true,abre:un.abre,fecha:un.fecha},ps=profs().filter(p=>(st.p===""||p.id===st.p)&&(!Array.isArray(p.dias)||p.dias.includes(dow))),out=[];
for(let m=hh.on?mins(hh.abre):1;m+v.duracao<=(hh.on?mins(hh.fecha):0);m+=30){if(new Date(`${st.d}T${hm(m)}`)<=new Date())continue;const us=[...Array(n)].map((_,i)=>hm(m+30*i));
if(us.some(h=>(K[`${un.id}_${st.d}_${h}`]||0)>=un.capacidade))continue;const livres=ps.filter(p=>us.every(h=>!Lk.has(`${p.id}_${st.d}_${h}`))&&!BL.some(b=>b.data===st.d&&(!b.unidadeId||b.unidadeId===un.id)&&(!b.profId||b.profId===p.id)&&(b.todoDia||(mins(b.de)<m+v.duracao&&mins(b.ate)>m)))&&(!p.abre||hm(m)>=p.abre)&&(!p.fecha||m+v.duracao<=mins(p.fecha)));if(livres.length)out.push({h:hm(m),us,livres})}
st.lista=out;H.innerHTML=out.length?horasHTML(out):`<p class="mute">Sem horários livres neste dia. Volte e escolha outra data ou outro profissional.</p><button class="btn ghost sm" id="espera" type="button">Avisar-me se surgir uma vaga</button>`}
async function reservar(dd=st.d,livres=st.sl.livres,rec=false){const ud=(await getDoc(doc(db,"users",s.u.uid))).data()||{},tel=ud.telefone||"";const un=U.find(x=>x.id===st.u),v=sv(),sl=st.sl;
for(const p of livres){try{await runTransaction(db,async tx=>{const lr=sl.us.map(h=>doc(C("locks"),`${p.id}_${dd}_${h}`)),cr=sl.us.map(h=>doc(C("cap"),`${un.id}_${dd}_${h}`));
const L=await Promise.all(lr.map(r=>tx.get(r))),K=await Promise.all(cr.map(r=>tx.get(r)));
if(L.some(x=>x.exists())||K.some(x=>(x.data()?.n||0)>=un.capacidade))throw Object.assign(new Error("conflito"),{conflito:1});
lr.forEach(r=>tx.set(r,{cli:s.u.uid,u:un.id,d:dd}));cr.forEach((r,i)=>tx.set(r,{n:(K[i].data()?.n||0)+1,u:un.id,d:dd}));
tx.set(doc(C("agendamentos")),{clienteUid:s.u.uid,clienteNome:s.u.displayName||s.u.email,unidadeId:un.id,unidadeNome:un.nome,profId:p.id,profNome:p.nome,servicoId:v.id,servicoNome:v.nome,preco:v.preco,dur:v.duracao,inicio:`${dd}T${sl.h}`,status:"agendado",dia:dd,telefone:tel,aniv:(ud.nascimento||"").slice(5,10),pet:ud.pet||"",confirmado:false,link:/^https:\/\//.test(p.link||"")?p.link:"",cupom:rec?"":st.cupom||"",desconto:rec?0:st.desc||0,indicadoPor:(localStorage.getItem("ref")||"")===s.u.uid?"":localStorage.getItem("ref")||"",locks:lr.map(r=>r.id),caps:cr.map(r=>r.id),criadoEm:serverTimestamp()})});return p}
catch(e){if(!e.conflito)throw e}}throw{message_pt:"Esse horário acabou de ser ocupado. Escolha outro."}}
A.onclick=e=>{const b=e.target.closest("button");if(!b)return;
if(b.hasAttribute("data-back"))return ir(st.step-1);
if(b.hasAttribute("data-novo")){Object.assign(st,{step:unica?1:0,p:null,s:"",d:"",sl:null,cupom:"",desc:0});return draw()}
const{k,id}=b.dataset;
if(k==="u"){st.u=id;st.p=null;marcar(b);setTimeout(()=>ir(1),520)}
if(k==="p"){st.p=id;marcar(b);b.scrollIntoView({inline:"center",block:"nearest",behavior:"smooth"});setTimeout(()=>ir(2),520)}
if(k==="s"){st.s=id;st.cupom="";st.desc=0;marcar(b);setTimeout(()=>ir(3),520)}
if(k==="d"){st.d=id;marcar(b);setTimeout(()=>ir(4),520)}
if(k==="h"){st.sl=st.lista[id];document.querySelectorAll("#hs [data-k=h]").forEach(x=>x.classList.toggle("sel",x===b));const v=sv();
$("#res").innerHTML=`<div class="card resumo"><p style="margin:0 0 .8rem"><strong>${esc(v.nome)}</strong> · ${esc(fmt(st.d+"T"+st.sl.h))}<br><span class="mute">${st.p===""?"Profissional disponível no horário":"Com "+esc(PR.find(x=>x.id===st.p)?.nome||"")} · <span id="pf">${brl(v.preco-(st.desc||0))}</span></span></p><div class="cup"><input id="cup" placeholder="Cupom de desconto" value="${esc(st.cupom||"")}" aria-label="Cupom"><button class="btn ghost sm" id="aplicar" type="button">Aplicar</button></div><p class="mute" id="cupmsg"></p><button class="btn" id="ok">Confirmar agendamento</button></div>`;$("#res").scrollIntoView({behavior:"smooth",block:"nearest"})}
if(b.id==="espera")return acao(b,async()=>{const ud=(await getDoc(doc(db,"users",s.u.uid))).data()||{};await addDoc(C("espera"),{clienteUid:s.u.uid,clienteNome:s.u.displayName||s.u.email,telefone:ud.telefone||"",unidadeId:st.u,profId:st.p||"",servicoNome:sv().nome,data:st.d,em:serverTimestamp()});toast("Combinado! A loja avisa se surgir uma vaga.");b.disabled=true});
if(b.id==="aplicar")return acao(b,async()=>{const c=$("#cup").value.trim().toUpperCase().replace(/[^A-Z0-9]/g,"");if(!c)return;const d=await getDoc(doc(C("promocoes"),c)),p=d.data(),v=sv();
if(d.exists()&&p.ativo!==false&&(p.alvoTipo!=="servico"||p.alvoId!==st.s)){st.cupom="";st.desc=0;$("#pf").textContent=brl(v.preco);$("#cupmsg").textContent="Este cupom vale só para: "+(p.alvoNome||"outro item")+".";return}
if(!d.exists()||p.ativo===false||(p.validade&&p.validade<hoje())||(p.emailCliente&&p.emailCliente!==(s.u.email||"").toLowerCase())){st.cupom="";st.desc=0;$("#pf").textContent=brl(v.preco);$("#cupmsg").textContent="Cupom inválido, expirado ou de outro cliente.";return}
st.cupom=c;st.desc=Math.min(v.preco,p.tipo==="percent"?v.preco*p.valor/100:p.valor);$("#pf").textContent=brl(v.preco-st.desc);$("#cupmsg").textContent="Cupom aplicado: -"+brl(st.desc)});
if(b.id==="ok")acao(b,async()=>{const p=await reservar();A.innerHTML=`<div class="sucesso"><div class="ok">${OKSVG}</div><h2>Agendado!</h2><p class="lead" style="margin:0 auto 1rem">${esc(p.nome)} · ${esc(fmt(st.d+"T"+st.sl.h))}</p><button class="btn ghost" data-novo>Fazer outro agendamento</button></div>`;await meus()})};
if(matchMedia("(hover:hover)").matches){const alvo=e=>e.target.closest(".pcard")?.querySelector(".arch");
A.onpointermove=e=>{const a=alvo(e);if(!a)return;const r=a.getBoundingClientRect();a.style.setProperty("--px",((e.clientX-r.left)/r.width-.5)*2);a.style.setProperty("--py",((e.clientY-r.top)/r.height-.5)*2)};
A.onpointerout=e=>{const a=alvo(e);a?.style.removeProperty("--px");a?.style.removeProperty("--py")}}
const planosCli=async()=>{const P0=$("#planos");if(!t.planosAtivo){P0.innerHTML="";return}
const[pl,as]=await Promise.all([getDocs(C("planos")),getDocs(query(C("assinaturas"),where("clienteUid","==",s.u.uid)))]),pp=pl.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.ativo!==false),mm=as.docs.map(d=>({id:d.id,...d.data()})),at=mm.filter(a=>a.status==="ativo"),pend=new Set(mm.filter(a=>a.status==="solicitado").map(a=>a.planoId));
P0.innerHTML=at.map(a=>`<div class="card fid"><strong>Seu pacote: ${esc(a.planoNome)}</strong><p class="mute" style="margin:.3rem 0 0">${a.restantes} de ${a.sessoes} sessões disponíveis${a.validade?" · até "+esc(a.validade.split("-").reverse().join("/")):""}</p></div>`).join("")+(pp.length?`<h2>Planos e pacotes</h2><div class="promo-grid">${pp.map(p=>`<div class="card"><strong>${esc(p.nome)}</strong><p class="mute" style="margin:.3rem 0">${esc(p.descricao||"")}</p><b class="pp">${brl(p.preco)}</b><p class="mute">${p.sessoes} sessões · válido por ${p.validade} dias</p><button class="btn ${pend.has(p.id)?"ghost":""}" data-pl="${p.id}"${pend.has(p.id)?" disabled":""}>${pend.has(p.id)?"Solicitado":"Quero este pacote"}</button></div>`).join("")}</div>`:"");
P0.onclick=e=>{const b=e.target.closest("[data-pl]");if(!b)return;const p=pp.find(x=>x.id===b.dataset.pl);acao(b,async()=>{const tel=(await getDoc(doc(db,"users",s.u.uid))).data()?.telefone||"";
await addDoc(C("assinaturas"),{clienteUid:s.u.uid,clienteNome:s.u.displayName||s.u.email,telefone:tel,planoId:p.id,planoNome:p.nome,preco:p.preco,sessoes:p.sessoes,validadeDias:p.validade,restantes:p.sessoes,status:"solicitado",em:serverTimestamp()});toast("Solicitação enviada. A loja confirma após o pagamento.");await planosCli()})}};

const extras=async()=>{const a=await getDocs(C("avisos")),vistos=JSON.parse(localStorage.getItem("av_"+t.id)||"[]");
$("#avisos").innerHTML=a.docs.filter(d=>!vistos.includes(d.id)).sort((x,y)=>(y.data().em?.seconds||0)-(x.data().em?.seconds||0)).slice(0,3).map(d=>`<div class="aviso"><div><strong>${esc(d.data().titulo)}</strong><p>${esc(d.data().texto)}</p></div><button class="ibtn" data-fx="${d.id}" aria-label="Dispensar aviso">×</button></div>`).join("");
$("#indic").innerHTML=t.indicacao?.ativo?`<div class="card fid"><strong>Indique um amigo</strong><p class="mute" style="margin:.3rem 0 .6rem">Quando seu amigo concluir o primeiro atendimento, você ganha ${t.indicacao.bonus||1} carimbo(s) no cartão.</p><button class="btn ghost sm" id="ind" type="button">Copiar meu link</button></div>`:"";await planosCli()};
$("#avisos").onclick=e=>{const b=e.target.closest("[data-fx]");if(!b)return;const v=JSON.parse(localStorage.getItem("av_"+t.id)||"[]");v.push(b.dataset.fx);localStorage.setItem("av_"+t.id,JSON.stringify(v));b.closest(".aviso").remove()};
$("#indic").onclick=e=>{if(e.target.closest("#ind"))navigator.clipboard?.writeText(`${location.origin}${location.pathname}?s=${t.id}&ref=${s.u.uid}`).then(()=>toast("Link copiado. Envie para seu amigo."),()=>toast("Não foi possível copiar o link.","err"))};
inclinar(A);draw();await Promise.all([meus(),extras()])};

/* ==== 6e. AGENDA DO PROPRIETÁRIO + FIDELIDADE ==== */
P.ajustes=async(t,s)=>{if(!exigir(s,["proprietario"]))return;
const tx=$("#txt"),DEF={tu:"Onde você quer ser atendido?",tp:"Com quem você prefere?",ts:"Qual serviço você quer?",td:"Qual dia fica melhor?",th:"Escolha o horário",wa:DEFWA};
Object.keys(DEF).forEach(k=>{tx[k].placeholder=DEF[k];tx[k].value=t.textos?.[k]||""});
tx.onsubmit=e=>{e.preventDefault();acao($("button",tx),async()=>{const textos={};Object.keys(DEF).forEach(k=>{if(tx[k].value.trim())textos[k]=tx[k].value.trim().slice(0,k==="wa"?400:60)});await updateDoc(doc(db,"tenants",t.id),{textos});t.textos=textos;toast("Textos salvos.")})};
const ff=$("#fid");ff.ativo.checked=!!t.fidelidade?.ativo;ff.meta.value=t.fidelidade?.meta||10;ff.brinde.value=t.fidelidade?.brinde||"";
ff.onsubmit=e=>{e.preventDefault();acao($("button",ff),async()=>{const fidelidade={ativo:ff.ativo.checked,meta:Math.max(2,Math.round(+ff.meta.value||10)),brinde:ff.brinde.value.trim()};await updateDoc(doc(db,"tenants",t.id),{fidelidade});t.fidelidade=fidelidade;toast("Fidelidade atualizada.")})};
const pl=$("#plf");pl.ativo.checked=!!t.planosAtivo;pl.onsubmit=e=>{e.preventDefault();acao($("button",pl),async()=>{const planosAtivo=pl.ativo.checked;await updateDoc(doc(db,"tenants",t.id),{planosAtivo});t.planosAtivo=planosAtivo;toast("Planos "+(planosAtivo?"ativados":"desativados")+".")})};
const pf=$("#pol");pf.horas.value=t.politica?.horas||0;pf.onsubmit=e=>{e.preventDefault();acao($("button",pf),async()=>{const politica={horas:Math.max(0,Math.round(+pf.horas.value||0))};await updateDoc(doc(db,"tenants",t.id),{politica});t.politica=politica;toast("Política de cancelamento salva.")})};
const ii=$("#ind");ii.ativo.checked=!!t.indicacao?.ativo;ii.bonus.value=t.indicacao?.bonus||1;
ii.onsubmit=e=>{e.preventDefault();acao($("button",ii),async()=>{const indicacao={ativo:ii.ativo.checked,bonus:Math.max(1,Math.round(+ii.bonus.value||1))};await updateDoc(doc(db,"tenants",t.id),{indicacao});t.indicacao=indicacao;toast("Indicações atualizadas.")})};
};
P.bloqueios=async(t,s)=>{if(!exigir(s,["proprietario","equipe"],"bloqueios"))return;const C=n=>collection(db,"tenants",t.id,n),ler=async n=>(await getDocs(C(n))).docs.map(d=>({id:d.id,...d.data()})),F=$("#f"),L=$("#lista");
const[U1,PR]=await Promise.all([ler("unidades"),ler("profissionais")]),eq=s.papel==="equipe",U=eq?U1.filter(u=>(s.unidades||[]).includes(u.id)):U1;$("#carga").remove();
F.unidadeId.innerHTML=(eq?"":`<option value="">Todas as unidades</option>`)+U.map(u=>`<option value="${esc(u.id)}">${esc(u.nome)}</option>`).join("");
F.profId.innerHTML=`<option value="">Todos os profissionais</option>`+PR.map(p=>`<option value="${esc(p.id)}">${esc(p.nome)}</option>`).join("");
F.data.min=F.fim.min=hoje();F.todo.onchange=()=>{F.de.disabled=F.ate.disabled=F.todo.checked};F.todo.onchange();
async function lista(){const b=(await ler("bloqueios")).filter(x=>x.data>=hoje()&&(!eq||U.some(u=>u.id===x.unidadeId))).sort((a,b)=>(a.data+(a.de||"")).localeCompare(b.data+(b.de||"")));
L.innerHTML=b.length?b.map(x=>`<li><span><strong>${esc(new Date(x.data+"T12:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}))}</strong> · ${x.todoDia?"Dia inteiro":esc(x.de)+" às "+esc(x.ate)}<br><span class="mute">${esc(U.find(u=>u.id===x.unidadeId)?.nome||"Todas as unidades")} · ${esc(PR.find(p=>p.id===x.profId)?.nome||"Todos os profissionais")}</span></span><button class="btn ghost" data-x="${x.id}">Remover</button></li>`).join(""):`<li class="mute">Nenhum bloqueio futuro.</li>`}
L.onclick=e=>{const b=e.target.closest("[data-x]");if(b)acao(b,async()=>{await deleteDoc(doc(C("bloqueios"),b.dataset.x));await lista()})};
F.onsubmit=e=>{e.preventDefault();acao($("button",F),async()=>{const i=F.data.value,z=F.fim.value||i;if(!i||z<i)return toast("Informe uma data válida.","err");
if(!F.todo.checked&&(!F.de.value||!F.ate.value||F.de.value>=F.ate.value))return toast("O horário inicial precisa ser anterior ao final.","err");
const dias=[];for(let d=new Date(i+"T12:00");d<=new Date(z+"T12:00")&&dias.length<62;d.setDate(d.getDate()+1))dias.push(new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,10));
for(const data of dias)await addDoc(C("bloqueios"),{unidadeId:F.unidadeId.value,profId:F.profId.value,data,todoDia:F.todo.checked,de:F.todo.checked?"":F.de.value,ate:F.todo.checked?"":F.ate.value});
toast(`${dias.length} bloqueio(s) criado(s).`);F.reset();F.todo.onchange();await lista()})};await lista()};

P.promocoes=async(t,s)=>{if(!exigir(s,["proprietario"]))return;const C=n=>collection(db,"tenants",t.id,n),F=$("#f"),FA=$("#fa"),L=$("#lista"),LA=$("#lavisos"),M=new Map();
const[SVs,PRs]=await Promise.all([getDocs(C("servicos")),getDocs(C("produtos"))]),opc=(l,q,t)=>`<optgroup label="${l}">${q.docs.map(d=>`<option value="${t}:${esc(d.id)}">${esc(d.data().nome)}</option>`).join("")}</optgroup>`;
F.alvo.innerHTML=`<option value="">Escolha o serviço ou produto…</option>`+opc("Serviços",SVs,"servico")+opc("Produtos",PRs,"produto");
async function lista(){const[p,a]=await Promise.all([getDocs(C("promocoes")),getDocs(C("avisos"))]);p.docs.forEach(d=>M.set(d.id,d.data()));
L.innerHTML=p.empty?`<li class="mute">Nenhuma promoção criada.</li>`:p.docs.map(d=>{const x=d.data();return`<li><span><strong>${esc(x.titulo)}</strong> ${x.ativo===false?'<span class="tag off">pausada</span>':""}<br><span class="mute">${x.tipo==="percent"?x.valor+"%":brl(x.valor)} de desconto${x.alvoNome?" · só para "+esc(x.alvoNome):" · sem serviço/produto definido"}${x.codigo?" · cupom "+esc(x.codigo):""}${x.validade?" · até "+esc(x.validade):""}${x.emailCliente?" · só para "+esc(x.emailCliente):""}${x.destaqueHome?" · na tela inicial":""}</span></span><span><button class="btn ghost" data-p="${d.id}">${x.ativo===false?"Ativar":"Pausar"}</button><button class="btn ghost" data-x="${d.id}">Excluir</button></span></li>`}).join("");
LA.innerHTML=a.empty?`<li class="mute">Nenhum aviso enviado.</li>`:a.docs.map(d=>`<li><span><strong>${esc(d.data().titulo)}</strong><br><span class="mute">${esc(d.data().texto)}</span></span><button class="btn ghost" data-xa="${d.id}">Remover</button></li>`).join("")}
L.onclick=e=>{const b=e.target.closest("button");if(b)acao(b,async()=>{if(b.dataset.p)await updateDoc(doc(C("promocoes"),b.dataset.p),{ativo:M.get(b.dataset.p).ativo===false});else if(confirm("Excluir esta promoção?"))await deleteDoc(doc(C("promocoes"),b.dataset.x));await lista()})};
LA.onclick=e=>{const b=e.target.closest("[data-xa]");if(b)acao(b,async()=>{await deleteDoc(doc(C("avisos"),b.dataset.xa));await lista()})};
F.onsubmit=e=>{e.preventDefault();acao($("button",F),async()=>{const v=Number(F.valor.value),cod=F.codigo.value.toUpperCase().replace(/[^A-Z0-9]/g,"");
if(!F.titulo.value.trim()||!(v>0)||(F.tipo.value==="percent"&&v>100))return toast("Informe título e um valor válido (percentual até 100).","err");
const[at,ai]=F.alvo.value.split(":");if(!ai)return toast("Escolha o serviço ou produto em que a promoção vale.","err");const al=(at==="servico"?SVs:PRs).docs.find(d=>d.id===ai);const x={alvoTipo:at,alvoId:ai,alvoNome:al?.data().nome||"",titulo:F.titulo.value.trim(),descricao:F.descricao.value.trim(),tipo:F.tipo.value,valor:v,codigo:cod,validade:F.validade.value,emailCliente:F.email.value.trim().toLowerCase(),destaqueHome:F.home.checked,ativo:true,criadoEm:serverTimestamp()};
if(cod){if((await getDoc(doc(C("promocoes"),cod))).exists())return toast("Já existe um cupom com esse código.","err");await setDoc(doc(C("promocoes"),cod),x)}else await addDoc(C("promocoes"),x);
toast("Promoção criada.");F.reset();await lista()})};
FA.onsubmit=e=>{e.preventDefault();acao($("button",FA),async()=>{if(!FA.titulo.value.trim()||!FA.texto.value.trim())return toast("Preencha título e texto.","err");await addDoc(C("avisos"),{titulo:FA.titulo.value.trim().slice(0,80),texto:FA.texto.value.trim().slice(0,300),em:serverTimestamp()});toast("Aviso publicado para os clientes.");FA.reset();await lista()})};await lista()};

P.metas=async(t,s)=>{if(!exigir(s,["proprietario"]))return;const C=n=>collection(db,"tenants",t.id,n),F=$("#f"),L=$("#lista"),M=$("#mes");
const PR=(await getDocs(C("profissionais"))).docs.map(d=>({id:d.id,...d.data()}));$("#un").innerHTML+=(await getDocs(collection(db,"tenants",t.id,"unidades"))).docs.map(d=>`<option value="${esc(d.id)}">${esc(d.data().nome)}</option>`).join("");$("#un").onchange=()=>lista();F.profId.innerHTML=`<option value="">Equipe toda</option>`+PR.map(p=>`<option value="${esc(p.id)}">${esc(p.nome)}</option>`).join("");M.value=F.mes.value=hoje().slice(0,7);
const bar=(l,p)=>`<div class="mbar"><span>${l}</span><div class="barra"><i style="width:${Math.min(100,p*100)}%"></i></div><b>${Math.round(p*100)}%</b></div>`;
async function lista(){L.innerHTML=`<li><div class="skel"></div></li>`;const m=M.value,[ag,mt]=await Promise.all([getDocs(query(C("agendamentos"),where("inicio",">=",m+"-01"),where("inicio","<=",m+"-31T23:59"))),getDocs(query(C("metas"),where("mes","==",m)))]);
const c=ag.docs.map(d=>d.data()).filter(a=>a.status==="concluido"&&(!$("#un").value||a.unidadeId===$("#un").value)),liq=a=>Number(a.preco)-Number(a.desconto||0),metas=mt.docs.map(d=>({id:d.id,...d.data()}));
const dados=x=>{const k=x.profId?c.filter(a=>a.profId===x.profId):c,v=k.reduce((n,a)=>n+liq(a),0),at=k.length,pv=x.valor?v/x.valor:1,pa=x.atend?at/x.atend:1;return{v,at,pv,pa,ok:pv>=1&&pa>=1}};
L.innerHTML=metas.length?metas.map(x=>{const r=dados(x);return`<li class="meta"><div><strong>${x.profId?esc(PR.find(p=>p.id===x.profId)?.nome||"Profissional"):"Meta da equipe"}</strong> ${r.ok?'<span class="tag">meta batida</span>':""}${x.valor?bar("Faturamento "+brl(r.v)+" de "+brl(x.valor),r.pv):""}${x.atend?bar("Atendimentos "+r.at+" de "+x.atend,r.pa):""}<span class="mute">${x.bonus?"Bônus de "+brl(x.bonus)+(x.profId?"":" por profissional")+" ao bater a meta":"Sem bônus"}</span></div><button class="btn ghost" data-x="${x.id}">Remover</button></li>`}).join(""):`<li class="mute">Nenhuma meta definida para este mês.</li>`;
$("#rem").innerHTML=PR.map(p=>{const k=c.filter(a=>a.profId===p.id),com=k.reduce((n,a)=>n+liq(a)*(a.comissaoPct||0)/100,0),bon=metas.filter(x=>(!x.profId||x.profId===p.id)&&x.bonus&&dados(x).ok).reduce((n,x)=>n+Number(x.bonus),0),fix=Number(p.fixo||0);
return`<li><span><strong>${esc(p.nome)}</strong><br><span class="mute">Fixo ${brl(fix)} · Comissão ${brl(com)} · Bônus ${brl(bon)}</span></span><strong>${brl(fix+com+bon)}</strong></li>`}).join("")||`<li class="mute">Cadastre profissionais para ver a remuneração.</li>`}
M.onchange=lista;L.onclick=e=>{const b=e.target.closest("[data-x]");if(b)acao(b,async()=>{await deleteDoc(doc(C("metas"),b.dataset.x));await lista()})};
F.onsubmit=e=>{e.preventDefault();acao($("button",F),async()=>{const v=Number(F.valor.value||0),a=Number(F.atend.value||0);if(!v&&!a)return toast("Defina a meta de faturamento ou de atendimentos.","err");
await addDoc(C("metas"),{profId:F.profId.value,mes:F.mes.value,valor:v,atend:a,bonus:Number(F.bonus.value||0)});M.value=F.mes.value;toast("Meta criada.");await lista()})};await lista()};

const PERMS=[["agendamentos","Agenda"],["bloqueios","Bloqueios"],["avaliacoes","Avaliações"],["profissionais","Profissionais"],["servicos","Serviços"],["produtos","Produtos"]];
const permHTML=(U,x={})=>`<div class="pw"${x.papel==="proprietario"?" hidden":""}><fieldset class="perm"><legend>Unidades</legend>${U.map(u=>`<label class="ck"><input type="checkbox" name="u" value="${esc(u.id)}"${(x.unidades||[]).includes(u.id)?" checked":""}>${esc(u.nome)}</label>`).join("")||'<span class="mute">Cadastre unidades primeiro.</span>'}</fieldset><fieldset class="perm"><legend>Pode acessar</legend>${PERMS.map(([k,l])=>`<label class="ck"><input type="checkbox" name="p" value="${k}"${k==="agendamentos"?" checked disabled":(x.permissoes||[]).includes(k)?" checked":""}>${l}</label>`).join("")}</fieldset></div>`;
const lerPerm=f=>({unidades:[...f.querySelectorAll("[name=u]:checked")].map(x=>x.value),permissoes:["agendamentos",...[...f.querySelectorAll("[name=p]:checked")].map(x=>x.value)]});
P.equipe=async(t,s)=>{if(!exigir(s,["proprietario","master"]))return;const adm=s.papel==="master",L=$("#lista"),LC=$("#lconv"),FC=$("#fc");let U=[],ac=[];
if(adm){const q=await getDocs(collection(db,"tenants"));$("#lj").innerHTML=q.docs.map(d=>`<option value="${esc(d.id)}">${esc(d.data().nome)}</option>`).join("");$("#ljw").hidden=false}
const tid=()=>adm?$("#lj").value:s.tenantId,admins=()=>ac.filter(x=>x.papel==="proprietario");
async function carregar(){const T=tid();$("#lnk").textContent=T?linkLoja(T):"";if(!T){L.innerHTML=`<li class="mute">Crie um estabelecimento primeiro.</li>`;return}
const[a,c,u]=await Promise.all([getDocs(query(collection(db,"acessos"),where("tenantId","==",T))),getDocs(query(collection(db,"convites"),where("tenantId","==",T))),getDocs(collection(db,"tenants",T,"unidades"))]);
U=u.docs.map(d=>({id:d.id,...d.data()}));ac=a.docs.map(d=>({id:d.id,...d.data()}));
L.innerHTML=ac.length?ac.map(x=>`<li class="us"><form data-u="${x.id}"><div class="us-h"><span><strong>${esc(x.nome||x.email||"Usuário")}</strong>${x.id===s.u.uid?" (você)":""}<br><span class="mute">${esc(x.email||"")}</span></span><select name="papel" aria-label="Tipo de usuário"><option value="equipe"${x.papel==="equipe"?" selected":""}>Usuário da loja</option><option value="proprietario"${x.papel==="proprietario"?" selected":""}>Administrador</option></select></div>${permHTML(U,x)}<div class="us-a"><button class="btn sm">Salvar</button><button class="btn ghost sm" type="button" data-rm="${x.id}">Remover acesso</button></div></form></li>`).join(""):`<li class="mute">Nenhum usuário ainda.</li>`;
LC.innerHTML=c.empty?`<li class="mute">Nenhum convite pendente.</li>`:c.docs.map(d=>`<li><span><strong>${esc(d.data().email)}</strong><br><span class="mute">${d.data().papel==="proprietario"?"Administrador":"Usuário da loja"}</span></span><button class="btn ghost sm" data-cv="${esc(d.id)}">Cancelar</button></li>`).join("");
$("#fcu").innerHTML=permHTML(U,{papel:FC.papel.value})}
if(adm)$("#lj").onchange=carregar;$("#cplink").onclick=()=>{const T=tid();if(T)navigator.clipboard?.writeText(linkLoja(T)).then(()=>toast("Link de acesso copiado."),()=>toast("Não foi possível copiar.","err"))};
FC.papel.onchange=()=>{$("#fcu .pw").hidden=FC.papel.value==="proprietario"};
L.onchange=e=>{if(e.target.name==="papel")e.target.closest("form").querySelector(".pw").hidden=e.target.value==="proprietario"};
L.onsubmit=e=>{e.preventDefault();const f=e.target,id=f.dataset.u,papel=f.papel.value,{unidades,permissoes}=lerPerm(f);
if(papel==="equipe"&&!unidades.length)return toast("Escolha ao menos uma unidade.","err");
if(papel==="equipe"&&ac.find(x=>x.id===id)?.papel==="proprietario"&&admins().length<2)return toast("A loja precisa ter ao menos um administrador.","err");
acao($("button",f),async()=>{await updateDoc(doc(db,"acessos",id),{papel,unidades:papel==="equipe"?unidades:[],permissoes:papel==="equipe"?permissoes:[]});toast("Permissões atualizadas.");await carregar()})};
L.onclick=e=>{const b=e.target.closest("[data-rm]");if(!b)return;const id=b.dataset.rm;if(ac.find(x=>x.id===id)?.papel==="proprietario"&&admins().length<2)return toast("A loja precisa ter ao menos um administrador.","err");
acao(b,async()=>{if(!confirm("Remover o acesso desta pessoa?"))return;await deleteDoc(doc(db,"acessos",id));await carregar()})};
LC.onclick=e=>{const b=e.target.closest("[data-cv]");if(b)acao(b,async()=>{await deleteDoc(doc(db,"convites",b.dataset.cv));await carregar()})};
FC.onsubmit=e=>{e.preventDefault();const em=FC.email.value.trim().toLowerCase(),papel=FC.papel.value,{unidades,permissoes}=lerPerm(FC);if(papel==="equipe"&&!unidades.length)return toast("Escolha ao menos uma unidade.","err");
acao($("button",FC),async()=>{await setDoc(doc(db,"convites",em),{email:em,tenantId:tid(),papel,unidades:papel==="equipe"?unidades:[],permissoes:papel==="equipe"?permissoes:[],em:serverTimestamp()});toast("Convite criado. O acesso é liberado quando a pessoa entrar no app com este e-mail.");FC.reset();await carregar()})};
await carregar()};

P.clientes=async(t,s)=>{if(!exigir(s,["proprietario"]))return;const L=$("#lista"),M=new Map(),desde=new Date(Date.now()-365*864e5).toISOString().slice(0,10);
const[ag,ob]=await Promise.all([getDocs(query(collection(db,"tenants",t.id,"agendamentos"),where("inicio",">=",desde))),getDocs(collection(db,"tenants",t.id,"clientes"))]),O=new Map(ob.docs.map(d=>[d.id,d.data()]));
ag.docs.forEach(d=>{const a=d.data(),c=M.get(a.clienteUid)||{id:a.clienteUid,nome:a.clienteNome,tel:"",v:0,g:0,f:0,u:""};if(a.telefone)c.tel=a.telefone;if(a.aniv)c.aniv=a.aniv;
if(a.status==="concluido"){c.v++;c.g+=Number(a.preco)-Number(a.desconto||0);if(a.inicio>c.u)c.u=a.inicio}if(a.status==="ausente")c.f++;M.set(a.clienteUid,c)});
const dias=u=>u?Math.floor((Date.now()-new Date(u))/864e5):9999;
function desenhar(){const q=$("#busca").value.toLowerCase(),rv=$("#risco").value,r=+rv||0,mes=hoje().slice(5,7);
const l=[...M.values()].filter(c=>!q||c.nome.toLowerCase().includes(q)||c.tel.includes(q)).filter(c=>rv==="aniv"?(c.aniv&&c.aniv.slice(0,2)===mes):(!r||(c.v>0&&dias(c.u)>=r))).sort((a,b)=>b.g-a.g);
L.innerHTML=l.length?l.map(c=>{const o=O.get(c.id)||{},tel=c.tel.length>11?c.tel:"55"+c.tel;return`<li class="cli"><details><summary><strong>${esc(c.nome)}</strong><br><span class="mute">${c.v} visita(s) · ${brl(c.g)}${c.f?` · ${c.f} falta(s)`:""}${c.u?` · última há ${dias(c.u)} dia(s)`:""}${c.aniv?` · aniversário ${c.aniv.split("-").reverse().join("/")}`:""}</span></summary><form data-k="${esc(c.id)}"><label>Observações privadas (só a loja vê)<textarea name="obs" rows="3" maxlength="500">${esc(o.obs||"")}</textarea></label><div class="us-a"><button class="btn sm">Salvar observação</button>${c.tel?`<a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/${tel}?text=${encodeURIComponent(rv==="aniv"?"Parabéns, "+c.nome.split(" ")[0]+"! A equipe da "+t.nome+" deseja um ótimo aniversário. Vem comemorar com a gente?":"Olá, "+c.nome.split(" ")[0]+"! Sentimos sua falta na "+t.nome+". Vamos marcar um horário?")}">Chamar no WhatsApp</a>`:""}</div></form></details></li>`}).join(""):`<li class="mute">Nenhum cliente encontrado nos últimos 12 meses.</li>`}
$("#busca").oninput=$("#risco").onchange=desenhar;
L.onsubmit=e=>{e.preventDefault();const f=e.target;acao($("button",f),async()=>{await setDoc(doc(db,"tenants",t.id,"clientes",f.dataset.k),{obs:f.obs.value.trim()});O.set(f.dataset.k,{obs:f.obs.value.trim()});toast("Observação salva.")})};desenhar()};

P.financeiro=async(t,s)=>{if(!exigir(s,["proprietario"]))return;const M=$("#mes"),F=$("#f"),L=$("#lista");M.value=hoje().slice(0,7);F.data.value=hoje();let AG=[],DS=[],VD=[];
const liq=a=>Number(a.preco)-Number(a.desconto||0),tot=x=>x.reduce((n,a)=>n+liq(a),0);
async function carregar(){const m=M.value,[ag,ds,vd]=await Promise.all([getDocs(query(collection(db,"tenants",t.id,"agendamentos"),where("inicio",">=",m+"-01"),where("inicio","<=",m+"-31T23:59"))),getDocs(query(collection(db,"tenants",t.id,"despesas"),where("mes","==",m))),getDocs(query(collection(db,"tenants",t.id,"vendas"),where("mes","==",m)))]);
AG=ag.docs.map(d=>d.data());VD=vd.docs.map(d=>d.data());DS=ds.docs.map(d=>({id:d.id,...d.data()}));
const vt=VD.reduce((n,x)=>n+Number(x.valor),0),c=AG.filter(a=>a.status==="concluido"),rec=c.filter(a=>a.pagamento!=="A receber"),pend=c.filter(a=>a.pagamento==="A receber"),desp=DS.reduce((n,x)=>n+Number(x.valor),0),com=c.reduce((n,a)=>n+liq(a)*(a.comissaoPct||0)/100,0),k=(r,v)=>`<div class="kpi-c"><span>${r}</span><b>${v}</b></div>`;
$("#kpis").innerHTML=k("Recebido",brl(tot(rec)+vt))+k("A receber",brl(tot(pend)))+k("Despesas",brl(desp))+k("Comissões",brl(com))+k("Resultado",brl(tot(rec)+vt-desp-com));
$("#formas").innerHTML=["Pix","Cartão","Dinheiro","Pacote"].map(f=>`<li><span>${f}</span><strong>${brl(tot(rec.filter(a=>(a.pagamento||"Dinheiro")===f))+VD.filter(x=>x.forma===f).reduce((n,x)=>n+Number(x.valor),0))}</strong></li>`).join("");
L.innerHTML=DS.length?DS.map(x=>`<li><span><strong>${esc(x.descricao)}</strong><br><span class="mute">${esc(x.categoria)} · ${esc(x.data.split("-").reverse().join("/"))}</span></span><span><strong>${brl(x.valor)}</strong><button class="btn ghost" data-x="${x.id}">Excluir</button></span></li>`).join(""):`<li class="mute">Nenhuma despesa neste mês.</li>`}
M.onchange=carregar;L.onclick=e=>{const b=e.target.closest("[data-x]");if(b)acao(b,async()=>{await deleteDoc(doc(db,"tenants",t.id,"despesas",b.dataset.x));await carregar()})};
F.onsubmit=e=>{e.preventDefault();acao($("button",F),async()=>{const v=Number(F.valor.value);if(!F.descricao.value.trim()||!(v>0)||!F.data.value)return toast("Informe descrição, valor e data.","err");
await addDoc(collection(db,"tenants",t.id,"despesas"),{descricao:F.descricao.value.trim(),categoria:F.categoria.value,valor:v,data:F.data.value,mes:F.data.value.slice(0,7)});F.descricao.value=F.valor.value="";toast("Despesa registrada.");M.value=F.data.value.slice(0,7);await carregar()})};
$("#csv").onclick=()=>{const r=[["tipo","data","descricao","categoria_ou_profissional","valor","forma_pagamento","status"],...AG.map(a=>["receita",a.inicio.slice(0,10),a.servicoNome,a.profNome,liq(a),a.pagamento||"",a.status]),...DS.map(x=>["despesa",x.data,x.descricao,x.categoria,x.valor,"",""]),...VD.map(x=>["venda",x.data,x.nome+" x"+x.qtd,"Produto",x.valor,x.forma,"pago"])];
const l=document.createElement("a");l.href=URL.createObjectURL(new Blob(["\ufeff"+r.map(x=>x.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\n")],{type:"text/csv"}));l.download=`financeiro_${M.value}.csv`;l.click()};await carregar()};

const VOC={barbearia:{ag:"Agendar horário",eq:"Nossa equipe",sv:"Serviços",p:"Com quem você prefere?",s:"Qual serviço você quer?",pub:1},
salao:{ag:"Agendar horário",eq:"Nossa equipe",sv:"Serviços",p:"Com quem você prefere?",s:"Qual serviço você quer?",pub:1},
clinica:{ag:"Agendar consulta",eq:"Nosso corpo clínico",sv:"Consultas e procedimentos",p:"Com qual profissional?",s:"Qual consulta ou procedimento?",pub:0},
psicologia:{ag:"Agendar sessão",eq:"Nossos profissionais",sv:"Atendimentos",p:"Com qual profissional?",s:"Qual tipo de atendimento?",pub:0},
pet:{ag:"Agendar banho e tosa",eq:"Nossa equipe",sv:"Serviços para o seu pet",p:"Quem vai cuidar do seu pet?",s:"Qual serviço seu pet precisa?",pub:1}};
const voc=t=>VOC[t?.tema?.segmento]||VOC.barbearia;
P.assinaturas=async(t,s)=>{if(!exigir(s,["proprietario"]))return;const C=collection(db,"tenants",t.id,"assinaturas"),L=$("#lista");
async function lista(){const q=await getDocs(C),l=q.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.em?.seconds||0)-(a.em?.seconds||0));
L.innerHTML=l.length?l.map(a=>`<li><span><strong>${esc(a.clienteNome)}</strong> · ${esc(a.planoNome)} <span class="tag ${["recusado","encerrado"].includes(a.status)?"off":""}">${a.status}</span><br><span class="mute">${brl(a.preco)} · ${a.restantes} de ${a.sessoes} sessões${a.validade?" · até "+esc(a.validade.split("-").reverse().join("/")):""}${a.telefone?" · "+esc(a.telefone):""}</span></span><span>${a.status==="solicitado"?`<button class="btn sm" data-a="ativo" data-id="${a.id}">Confirmar pagamento e ativar</button><button class="btn ghost sm" data-a="recusado" data-id="${a.id}">Recusar</button>`:a.status==="ativo"?`<button class="btn ghost sm" data-a="encerrado" data-id="${a.id}">Encerrar</button>`:""}</span></li>`).join(""):`<li class="mute">Nenhum pacote solicitado ou vendido ainda.</li>`}
L.onclick=e=>{const b=e.target.closest("[data-a]");if(!b)return;acao(b,async()=>{const ref=doc(C,b.dataset.id),a=b.dataset.a,x={status:a};if(a==="ativo"){const d=(await getDoc(ref)).data();x.validade=somaDia(hoje(),Number(d.validadeDias||30))}await updateDoc(ref,x);await lista()})};await lista()};

P.agendamentos=async(t,s)=>{if(!exigir(s,["proprietario","equipe"],"agendamentos"))return;if(s.papel==="proprietario"&&!s.previa)await migrarDia(t);
const D=$("#d"),L=$("#lista"),meta=t.fidelidade?.meta||10;const UN0=(await getDocs(collection(db,"tenants",t.id,"unidades"))).docs.map(d=>({id:d.id,...d.data()})),UU=s.papel==="equipe"?UN0.filter(u=>(s.unidades||[]).includes(u.id)):UN0;
let un=localStorage.getItem("und_"+t.id);if(!UU.some(u=>u.id===un))un=UU.length===1?UU[0].id:"";
const pintar=()=>{$("#und").innerHTML=UU.length?UU.map(u=>`<button type="button" class="und-b${u.id===un?" sel":""}" data-u="${esc(u.id)}" aria-pressed="${u.id===un}">${esc(u.nome)}</button>`).join(""):`<span class="mute">Nenhuma unidade disponível para você.</span>`};pintar();
$("#und").onclick=e=>{const b=e.target.closest("[data-u]");if(!b)return;un=b.dataset.u;localStorage.setItem("und_"+t.id,un);pintar();lista()};
const ler2=async n=>(await getDocs(collection(db,"tenants",t.id,n))).docs.map(d=>({id:d.id,...d.data()})),FN=$("#fn");let SVs=[],PRs=[];
const wa=a=>{const d=String(a.telefone).replace(/\D/g,""),dt=dx(a.dia||a.inicio.slice(0,10)),V={nome:(a.clienteNome||"").split(" ")[0],servico:a.servicoNome,profissional:a.profNome,data:dt.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"}),hora:a.inicio.slice(11),loja:t.nome};
return"https://wa.me/"+(d.length>11?d:"55"+d)+"?text="+encodeURIComponent((t.textos?.wa||DEFWA).replace(/\{(\w+)\}/g,(m,k)=>V[k]??m))};
$("#novoag").onclick=async()=>{if(!un)return toast("Selecione uma unidade primeiro.","err");if(!SVs.length)[SVs,PRs]=await Promise.all([ler2("servicos"),ler2("profissionais")]);
FN.sv.innerHTML=SVs.filter(x=>x.ativo!==false).map(x=>`<option value="${esc(x.id)}">${esc(x.nome)}</option>`).join("");FN.pr.innerHTML=PRs.filter(x=>x.unidadeId===un&&x.ativo!==false).map(x=>`<option value="${esc(x.id)}">${esc(x.nome)}</option>`).join("");FN.hidden=!FN.hidden};
FN.onsubmit=e=>{e.preventDefault();acao($("button",FN),async()=>{const sv=SVs.find(x=>x.id===FN.sv.value),pr=PRs.find(x=>x.id===FN.pr.value),u=UU.find(x=>x.id===un),hh=FN.hora.value;
if(!FN.nome.value.trim()||!sv||!pr||!hh||hh.slice(3)%30)return toast("Preencha nome, serviço, profissional e um horário em múltiplos de 30 minutos.","err");
const n=Math.ceil(sv.duracao/30),mi=+hh.slice(0,2)*60+ +hh.slice(3),hs=[...Array(n)].map((_,i)=>hm(mi+30*i)),d=D.value,dig=FN.tel.value.replace(/\D/g,""),chave="m_"+(dig||FN.nome.value.trim().toLowerCase().replace(/\W+/g,"")).slice(0,20);
await runTransaction(db,async tx=>{const lr=hs.map(h=>doc(db,"tenants",t.id,"locks",`${pr.id}_${d}_${h}`)),cr=hs.map(h=>doc(db,"tenants",t.id,"cap",`${un}_${d}_${h}`)),L1=await Promise.all(lr.map(r=>tx.get(r))),K=await Promise.all(cr.map(r=>tx.get(r)));
if(L1.some(x=>x.exists())||K.some(x=>(x.data()?.n||0)>=u.capacidade))throw{message_pt:"Esse horário já está ocupado para este profissional."};
lr.forEach(r=>tx.set(r,{cli:s.u.uid,u:un,d}));cr.forEach((r,i)=>tx.set(r,{n:(K[i].data()?.n||0)+1,u:un,d}));
tx.set(doc(collection(db,"tenants",t.id,"agendamentos")),{clienteUid:chave,clienteNome:FN.nome.value.trim(),telefone:dig,confirmado:false,unidadeId:un,unidadeNome:u.nome,profId:pr.id,profNome:pr.nome,servicoId:sv.id,servicoNome:sv.nome,preco:sv.preco,dur:sv.duracao,inicio:`${d}T${hh}`,dia:d,status:"agendado",origem:"loja",link:/^https:\/\//.test(pr.link||"")?pr.link:"",cupom:"",desconto:0,indicadoPor:"",locks:lr.map(r=>r.id),caps:cr.map(r=>r.id),criadoEm:serverTimestamp()})});
toast("Agendamento criado.");FN.reset();FN.hidden=true;await lista()})};
const esp=async()=>{const q=await getDocs(query(collection(db,"tenants",t.id,"espera"),where("unidadeId","==",un),where("data","==",D.value)));$("#eh").hidden=$("#lespera").hidden=q.empty;
$("#lespera").innerHTML=q.docs.map(d=>{const x=d.data(),dg=String(x.telefone||"").replace(/\D/g,"");return`<li><span><strong>${esc(x.clienteNome)}</strong><br><span class="mute">${esc(x.servicoNome)}</span></span><span>${dg?`<a class="btn ghost sm" target="_blank" rel="noopener" href="https://wa.me/${dg.length>11?dg:"55"+dg}?text=${encodeURIComponent("Olá, "+x.clienteNome.split(" ")[0]+"! Surgiu uma vaga na "+t.nome+" no dia que você queria. Quer agendar?")}">Avisar vaga</a>`:""}<button class="btn ghost sm" data-we="${d.id}">Remover</button></span></li>`}).join("")};
$("#lespera").onclick=e=>{const b=e.target.closest("[data-we]");if(b)acao(b,async()=>{await deleteDoc(doc(db,"tenants",t.id,"espera",b.dataset.we));await esp()})};
D.value=hoje();let LST=[];const dx=d=>new Date(d+"T12:00"),soma=x=>x.reduce((n,a)=>n+(Number(a.preco)-Number(a.desconto||0)),0);
const kp=l=>{const c=l.filter(a=>a.status==="concluido"),p=l.filter(a=>a.status==="agendado"),k=(r,v)=>`<div class="kpi-c"><span>${r}</span><b>${v}</b></div>`;
$("#resumo").innerHTML=k("Agendados",p.length)+k("Concluídos",c.length)+k("A receber",brl(soma(p)))+k("Realizado",brl(soma(c)));
$("#dtit").textContent=dx(D.value).toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})};
const mover=n=>{const d=dx(D.value);if(modo==="mes")d.setMonth(d.getMonth()+n);else d.setDate(d.getDate()+n*(modo==="semana"?7:1));D.value=iso(d);lista()};
$("#dprev").onclick=()=>mover(-1);$("#dnext").onclick=()=>mover(1);$("#dhoje").onclick=()=>{D.value=hoje();lista()};

let modo=localStorage.getItem("ag_modo")||"dia";const iso=x=>new Date(x-x.getTimezoneOffset()*6e4).toISOString().slice(0,10),SEM=["seg","ter","qua","qui","sex","sáb","dom"];
const pintarModo=()=>document.querySelectorAll("[data-modo]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.modo===modo));
document.querySelectorAll("[data-modo]").forEach(b=>b.onclick=()=>{modo=b.dataset.modo;localStorage.setItem("ag_modo",modo);lista()});
const porDia=async ds=>(await Promise.all(ds.map(d=>getDocs(query(collection(db,"tenants",t.id,"agendamentos"),where("unidadeId","==",un),where("dia","==",d)))))).map((q,i)=>[ds[i],q.docs.map(x=>({id:x.id,...x.data()})).sort((a,b)=>a.inicio.localeCompare(b.inicio))]);
async function grade(){const G=$("#grade");G.innerHTML=`<div class="skel"></div>`;const base=dx(D.value);let ds=[],off=0,tit;
if(modo==="semana"){const i0=new Date(base);i0.setDate(base.getDate()-(base.getDay()+6)%7);ds=[...Array(7)].map((_,i)=>{const x=new Date(i0);x.setDate(i0.getDate()+i);return iso(x)});tit=`${dx(ds[0]).toLocaleDateString("pt-BR",{day:"numeric",month:"short"})} a ${dx(ds[6]).toLocaleDateString("pt-BR",{day:"numeric",month:"short",year:"numeric"})}`}
else{const n=new Date(base.getFullYear(),base.getMonth()+1,0).getDate();off=(new Date(base.getFullYear(),base.getMonth(),1).getDay()+6)%7;ds=[...Array(n)].map((_,i)=>iso(new Date(base.getFullYear(),base.getMonth(),i+1)));tit=base.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})}
const dados=await porDia(ds),flat=dados.flatMap(([,l])=>l),hj=hoje();kp(flat);$("#dtit").textContent=tit;
const ev=(a,full)=>`<button type="button" class="ev ${a.status}" data-dia="${a.dia}" title="${esc(a.clienteNome)} · ${esc(a.servicoNome)} · ${esc(a.profNome)}"><b>${a.inicio.slice(11)}</b> ${esc(a.clienteNome.split(" ")[0])}${full?`<small>${esc(a.servicoNome)}</small>`:""}</button>`;
G.innerHTML=modo==="semana"?`<div class="sem">${dados.map(([d,l],i)=>`<section class="dc${d===hj?" hj":""}"><header><span>${SEM[i]}</span><button type="button" data-dia="${d}" class="n">${d.slice(8)}</button></header>${l.length?l.slice(0,8).map(a=>ev(a,1)).join("")+(l.length>8?`<button type="button" class="mais" data-dia="${d}">+${l.length-8} mais</button>`:""):'<p class="mute vz">Livre</p>'}</section>`).join("")}</div>`
:`<div class="mes"><div class="mh">${SEM.map(x=>`<span>${x}</span>`).join("")}</div><div class="mg">${"<i></i>".repeat(off)}${dados.map(([d,l])=>`<section class="mc${d===hj?" hj":""}"><button type="button" class="n" data-dia="${d}">${d.slice(8)}${l.length?`<em>${l.length}</em>`:""}</button><div class="chs">${l.slice(0,3).map(a=>ev(a,0)).join("")}${l.length>3?`<button type="button" class="mais" data-dia="${d}">+${l.length-3}</button>`:""}</div></section>`).join("")}</div></div>`;
$("#grade").onclick=e=>{const b=e.target.closest("[data-dia]");if(!b)return;D.value=b.dataset.dia;modo="dia";localStorage.setItem("ag_modo","dia");lista()}}
async function lista(){if(!un){L.innerHTML=`<li class="mute">Selecione uma unidade para ver os agendamentos.</li>`;$("#resumo").innerHTML="";return}pintarModo();$("#lista").hidden=modo!=="dia";$("#grade").hidden=modo==="dia";if(modo!=="dia"){$("#eh").hidden=$("#lespera").hidden=true;return grade()}L.innerHTML=`<li><div class="skel"></div></li>`;const q=await getDocs(query(collection(db,"tenants",t.id,"agendamentos"),where("unidadeId","==",un),where("dia","==",D.value)));
const l=q.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.inicio.localeCompare(b.inicio));kp(l);LST=l;esp();
L.innerHTML=l.length?l.map(a=>`<li class="ag ${a.status}"><span><strong class="hora">${a.inicio.slice(11)}</strong> ${esc(a.clienteNome)}<br><span class="mute">${esc(a.servicoNome)} · ${esc(a.profNome)} · ${esc(a.unidadeNome)}${a.pet?" · Pet: "+esc(a.pet):""} · ${brl(a.preco)}</span></span><span><span class="tag ${["cancelado","ausente"].includes(a.status)?"off":""}">${a.status}</span>${a.confirmado?' <span class="tag">confirmado</span>':""}${a.pagamento?` <span class="tag">${esc(a.pagamento)}</span>`:""}${a.msgEnviada?' <span class="tag">msg enviada</span>':""}${a.status==="agendado"?(a.telefone?` <a class="btn ghost wa" data-wa="${a.id}" target="_blank" rel="noopener" href="${wa(a)}">${WAI}Confirmar</a>`:` <button class="btn ghost wa" data-sem="${a.id}" type="button">${WAI}Add telefone</button>`):""}${a.status==="agendado"?` <select class="pg" data-pg="${a.id}" aria-label="Forma de pagamento"><option>Pix</option><option>Cartão</option><option>Dinheiro</option><option>A receber</option><option>Pacote</option></select> <button class="btn" data-a="concluido" data-id="${a.id}">Concluir</button> <button class="btn ghost" data-a="ausente" data-id="${a.id}">Faltou</button> <button class="btn ghost" data-a="cancelado" data-id="${a.id}">Cancelar</button>`:""}</span></li>`).join(""):`<li class="mute">Nenhum agendamento neste dia.</li>`}
async function concluir(id,forma,ass){const ar=doc(db,"tenants",t.id,"agendamentos",id);return runTransaction(db,async tx=>{const a=await tx.get(ar);if(a.data().status!=="agendado")return false;const asr=ass?doc(db,"tenants",t.id,"assinaturas",ass):null,as=asr?(await tx.get(asr)).data():null;if(asr&&!(as?.restantes>0))throw{message_pt:"Pacote sem sessões disponíveis."};
const pr=(await tx.get(doc(db,"tenants",t.id,"profissionais",a.data().profId))).data()||{},fr=doc(db,"tenants",t.id,"fidelidade",a.data().clienteUid),f=(await tx.get(fr)).data()||{};const rf0=a.data().indicadoPor,cred=t.indicacao?.ativo&&rf0&&rf0!==a.data().clienteUid&&!f.visto,rr=cred?doc(db,"tenants",t.id,"fidelidade",rf0):null,rf=rr?((await tx.get(rr)).data()||{}):{};let n=(f.n||0)+1,b=f.brindes||0,ganhou=false;if(t.fidelidade?.ativo&&n>=(t.fidelidade.meta||10)){n-=meta;b++;ganhou=true}
if(asr)tx.update(asr,{restantes:as.restantes-1,status:as.restantes-1<=0?"encerrado":"ativo"});tx.update(ar,{status:"concluido",pagamento:forma,comissaoPct:Number(pr.comissao||0)});tx.set(fr,{n,brindes:b,visto:true});if(rr){let rn=(rf.n||0)+(t.indicacao.bonus||1),rb=rf.brindes||0;const mm=t.fidelidade?.meta||10;while(t.fidelidade?.ativo&&rn>=mm){rn-=mm;rb++}tx.set(rr,{...rf,n:rn,brindes:rb})}return ganhou})}
D.onchange=lista;L.onclick=e=>{const w=e.target.closest("[data-wa]");if(w){updateDoc(doc(db,"tenants",t.id,"agendamentos",w.dataset.wa),{msgEnviada:serverTimestamp()}).catch(()=>{});return}
const sm=e.target.closest("[data-sem]");if(sm)return acao(sm,async()=>{const n=(prompt("Telefone do cliente com DDD (WhatsApp):","")||"").replace(/\D/g,"");if(n.length<10)return toast("Informe um telefone válido com DDD.","err");await updateDoc(doc(db,"tenants",t.id,"agendamentos",sm.dataset.sem),{telefone:n});toast("Telefone salvo. Toque em Confirmar para enviar a mensagem.");await lista()});
const b=e.target.closest("[data-a]");if(!b)return;acao(b,async()=>{const{a,id}=b.dataset;
if(a==="concluido"){const forma=document.querySelector(`[data-pg="${id}"]`)?.selectedOptions[0].text||"Dinheiro";let ass="";
if(forma==="Pacote"){const ag=LST.find(x=>x.id===id),q=await getDocs(query(collection(db,"tenants",t.id,"assinaturas"),where("clienteUid","==",ag.clienteUid),where("status","==","ativo"))),ok=q.docs.find(d=>d.data().restantes>0&&(!d.data().validade||d.data().validade>=hoje()));
if(!ok)return toast("Este cliente não tem pacote ativo com sessões disponíveis.","err");ass=ok.id}
toast(await concluir(id,forma,ass)?"Concluído. O cliente ganhou um brinde!":"Atendimento concluído.")}else{await cancelar(t.id,id,a);toast("Atualizado.")}await lista()})};await lista()};

/* ==== 7. ROTEADOR (app de página única: #/rota) ==== */
let exec=0;
const lim=(p,ms=10000)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no({message_pt:"O servidor demorou a responder. Verifique a internet e a configuração do Firebase."}),ms))]);
const aviso=(h,m)=>{if($("#boot"))$("#main").innerHTML=`<section class="hero"><h1>${h}</h1><p class="lead">${m}</p></section>`};
async function rotear(manter){const sy=scrollY;if(!CONFIG_OK)return aviso("Falta configurar o Firebase","Abra app.js e cole a configuração do seu projeto Firebase na constante FIREBASE, no topo do arquivo.");const id=++exec,r=location.hash.replace(/^#\/?/,"")||"index",pg=P[r]?r:"index";
try{const s=await lim(sessao()),t=await lim(carregarTenant(s?.papel==="master"&&!s.previa&&!["index","agendar"].includes(pg)?false:s?.tenantId||null));if(id!==exec)return;TT=t;if(["proprietario","equipe"].includes(s?.papel)&&slug()&&slug()!==s.tenantId){location.replace(location.pathname+"?s="+encodeURIComponent(s.tenantId)+location.hash);return}if(!t)aplicarTema();
await (manter?(f=>f()):vt)(()=>{$("#main").classList.remove("solto","largo");document.body.classList.remove("menu-aberto");$("#main").replaceChildren(document.getElementById("t-"+pg).content.cloneNode(true));document.body.dataset.page=pg;topo(t,s)});
const ln=()=>document.querySelectorAll("[data-l]").forEach(a=>a.href=href(a.dataset.l));ln();await P[pg](t,s);ln();if(!manter){scrollTo(0,0);$("#main").focus({preventScroll:true})}else scrollTo(0,sy);if(parent!==window&&new URLSearchParams(location.search).get("vis")){parent.postMessage({rota:pg,pronto:!PING},location.origin);PING=1}}
catch(e){console.error(e);aviso("Não foi possível carregar",esc(msgErro(e)));toast(msgErro(e),"err")}}
addEventListener("hashchange",()=>rotear());
let deb;addEventListener("message",e=>{if(e.origin!==location.origin||!new URLSearchParams(location.search).get("vis"))return;if(e.data?.rota){location.hash="#/"+e.data.rota;return}if(!e.data?.tema||!TT)return;OVR={id:TT.id,nome:e.data.nome,tema:e.data.tema};clearTimeout(deb);deb=setTimeout(()=>rotear(true),250)});
{const rf=new URLSearchParams(location.search).get("ref");if(rf)localStorage.setItem("ref",rf)}
getRedirectResult(auth).then(async r=>{if(r?.user){await garantirPerfil(r.user,{lgpdEm:1});await irParaPainel()}}).catch(e=>{if(e)toast(msgErro(e),"err")});
document.addEventListener("pointerdown",e=>{const el=e.target.closest(".btn,.ibtn,.und-b,.abas button,.opt,.day,.cal-d,.dl,.dd");if(!el)return;const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;el.style.setProperty("--mx",x+"px");el.style.setProperty("--my",y+"px");
if(el.matches(".btn,.ibtn,.und-b,.abas button")){const p=document.createElement("span");p.className="rp";p.style.left=x+"px";p.style.top=y+"px";el.append(p);p.addEventListener("animationend",()=>p.remove())}},{passive:true});
{const sk=document.createElement("button");sk.className="skip";sk.textContent="Pular para o conteúdo";sk.onclick=()=>$("#main").focus();document.body.prepend(sk)}
rotear();
