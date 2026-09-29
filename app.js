let ALL_RECIPES = [...RECIPES];
MENUS.forEach(([n,c],i)=>ALL_RECIPES.push({id:100000+i,name:n,cuisine:c,emoji:MENUS_EMOJI[c]||"🍽️",time:"-",diff:"-",ingredients:[],steps:[],cookpad:true}));
const PAGE = 60;
const cookpadUrl = q => "https://cookpad.com/th/search/" + encodeURIComponent(q);
const state = { query: "", cuisine: "ทั้งหมด", diff: "ทั้งหมด", limit: PAGE, tab: "home", favs: JSON.parse(localStorage.getItem("kw_favs")||"[]") };
const cuisines = ["ทั้งหมด", ...Array.from(new Set(ALL_RECIPES.map(r=>r.cuisine)))];
const diffs = ["ทั้งหมด", "ง่าย", "ปานกลาง", "ยาก"];
const AREA_MAP = {"ไทย":"Thai","อิตาเลียน":"Italian","ญี่ปุ่น":"Japanese","เม็กซิกัน":"Mexican","อินเดีย":"Indian","ฝรั่งเศส":"French","จีน":"Chinese","เวียดนาม":"Vietnamese","กรีก":"Greek","สเปน":"Spanish"};
let onlineFetched = {};

const $ = s => document.querySelector(s);
const grid = $("#grid"), chips = $("#chips"), diffChips = $("#diffChips"), searchEl = $("#search");

function renderChips(){
  chips.innerHTML = cuisines.map(c =>
    `<button class="chip ${c===state.cuisine?"active":""}" data-c="${c}">${c}</button>`
  ).join("");
  chips.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{state.cuisine=b.dataset.c; state.limit=PAGE; render();});

  diffChips.innerHTML = diffs.map(d =>
    `<button class="chip ${d===state.diff?"active":""}" data-d="${d}">${d==="ทั้งหมด"?"ทุกระดับ":d}</button>`
  ).join("");
  diffChips.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{state.diff=b.dataset.d; state.limit=PAGE; render();});
}

function filtered(){
  return ALL_RECIPES.filter(r=>{
    const matchC = state.cuisine==="ทั้งหมด" || r.cuisine===state.cuisine;
    const matchD = state.diff==="ทั้งหมด" || r.diff===state.diff;
    const matchQ = r.name.toLowerCase().includes(state.query.toLowerCase());
    const matchFav = state.tab!=="fav" || state.favs.includes(r.id);
    return matchC && matchD && matchQ && matchFav;
  });
}

function render(){
  renderChips();
  const list = filtered();
  $("#count").textContent = `${list.length} เมนู`;
  grid.innerHTML = list.length ? list.slice(0,state.limit).map(r=>`
    <div class="card-wrap">
      <button class="fav-btn" data-fav="${r.id}">${state.favs.includes(r.id)?"❤️":"🤍"}</button>
      <div class="card" data-open="${r.id}">
        <div class="img">${r.emoji}</div>
        <div class="info">
          <div class="cuisine">${r.cuisine}${r.online?'<span class="online-badge">ONLINE</span>':''}</div>
          <div class="name">${r.name}</div>
          <div class="meta"><span>⏱ ${r.time}</span><span>· ${r.diff}</span></div>
        </div>
      </div>
    </div>`).join("") : `<div class="empty">ไม่พบเมนูที่ค้นหา 🍽️</div>`;
  $("#moreWrap").innerHTML = list.length > state.limit ? `<button class="shuffle-btn" id="moreBtn">โหลดเพิ่ม (เหลืออีก ${list.length-state.limit})</button>` : "";
  if ($("#moreBtn")) $("#moreBtn").onclick = () => { state.limit += PAGE; render(); };
  const q = state.query.trim();
  $("#cookpadSearch").innerHTML = q ? `<a class="cookpad-link" href="${cookpadUrl(q)}" target="_blank" rel="noopener">🔎 ค้นหา “${q}” บน Cookpad</a>` : "";

  grid.querySelectorAll("[data-open]").forEach(c=>c.onclick=()=>openRecipe(+c.dataset.open));
  grid.querySelectorAll("[data-fav]").forEach(b=>b.onclick=(e)=>{
    e.stopPropagation();
    const id = +b.dataset.fav;
    state.favs = state.favs.includes(id) ? state.favs.filter(x=>x!==id) : [...state.favs, id];
    localStorage.setItem("kw_favs", JSON.stringify(state.favs));
    render();
  });
}

function cookpadBtn(r){
  return `<a class="cookpad-link" href="${cookpadUrl(r.name)}" target="_blank" rel="noopener">🍳 ดูสูตรและวิธีทำ “${r.name}” บน Cookpad</a>` + (r.cookpad ? `<p style="font-size:12px;color:var(--muted)">สูตรเป็นของผู้แชร์บน Cookpad กดเพื่อดูวิธีทำฉบับเต็มที่เว็บต้นทาง</p>` : "");
}
function openRecipe(id){
  const r = ALL_RECIPES.find(x=>x.id===id);
  $("#sheet-content").innerHTML = `
    <div class="sheet-hero">${r.emoji}<button class="close" id="closeSheet">✕</button></div>
    <div class="sheet-body">
      <h2>${r.name}<span class="badge">${r.cuisine}</span></h2>
      <div class="tag-row"><span class="tag">⏱ ${r.time}</span><span class="tag">ระดับ: ${r.diff}</span></div>
      ${r.online ? `<p style="font-size:12px;color:var(--muted);margin-bottom:10px">📡 สูตรนี้ดึงจากฐานข้อมูลออนไลน์ (TheMealDB) เนื้อหาต้นฉบับเป็นภาษาอังกฤษ</p>` : ""}
      ${cookpadBtn(r)}
      ${r.cookpad?"":`<h3>🧂 วัตถุดิบ</h3>
      <ul>${r.ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>`}
      ${r.cookpad?"":`<h3>👨‍🍳 วิธีทำ</h3>
      <ol>${r.steps.map(s=>`<li>${s}</li>`).join("")}</ol>`}
    </div>`;
  $("#overlay").classList.add("open");
  $("#closeSheet").onclick = ()=> $("#overlay").classList.remove("open");
}
$("#overlay").onclick = e => { if(e.target.id==="overlay") $("#overlay").classList.remove("open"); };

searchEl.oninput = e => { state.query = e.target.value; state.limit=PAGE; render(); };

$("#shuffleBtn").onclick = () => {
  const pool = filtered();
  if (!pool.length) return;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  openRecipe(pick.id);
};

function guessDifficulty(ingCount, stepText){
  const steps = stepText.split(/\r?\n/).filter(Boolean).length;
  if (ingCount <= 6 && steps <= 5) return "ง่าย";
  if (ingCount <= 12 && steps <= 10) return "ปานกลาง";
  return "ยาก";
}

async function fetchOnline(){
  const area = AREA_MAP[state.cuisine];
  const status = $("#onlineStatus");
  if (!area) { status.textContent = "เลือกชาติที่รองรับ (ไทย/อิตาเลียน/ญี่ปุ่น/เม็กซิกัน/อินเดีย/ฝรั่งเศส/จีน/เวียดนาม/กรีก/สเปน) เพื่อค้นหาเพิ่มจากออนไลน์"; return; }
  if (onlineFetched[area]) { status.textContent = "โหลดสูตรจากออนไลน์สำหรับชาตินี้ไปแล้ว"; return; }
  status.textContent = "⏳ กำลังโหลดสูตรเพิ่มเติม...";
  try{
    const listRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`);
    const listData = await listRes.json();
    const meals = (listData.meals || []).slice(0, 15);
    let added = 0;
    for (const m of meals){
      const detRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`);
      const det = (await detRes.json()).meals[0];
      const ingredients = [];
      for (let i=1;i<=20;i++){
        const ing = det[`strIngredient${i}`], meas = det[`strMeasure${i}`];
        if (ing && ing.trim()) ingredients.push(`${meas?meas.trim():""} ${ing.trim()}`.trim());
      }
      const newId = 9000 + Number(m.idMeal);
      if (ALL_RECIPES.some(r=>r.id===newId)) continue;
      ALL_RECIPES.push({
        id: newId, name: det.strMeal, cuisine: state.cuisine, emoji: "🌍",
        time: "-", diff: guessDifficulty(ingredients.length, det.strInstructions||""),
        ingredients, steps: (det.strInstructions||"").split(/\r?\n/).filter(Boolean),
        online: true
      });
      added++;
    }
    onlineFetched[area] = true;
    status.textContent = added ? `✅ เพิ่ม ${added} เมนูจากออนไลน์แล้ว` : "ไม่พบเมนูเพิ่มเติมสำหรับชาตินี้";
    render();
  }catch(err){
    status.textContent = "⚠️ โหลดข้อมูลออนไลน์ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต";
  }
}
$("#onlineBtn").onclick = fetchOnline;

document.querySelectorAll("nav.tabbar button").forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll("nav.tabbar button").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    state.tab = b.dataset.tab; state.limit=PAGE;
    render();
  };
});

render();

// PWA: register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(()=>{});
  });
}

// Install prompt
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $("#installBar").classList.add("show");
});
$("#installBtn").onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $("#installBar").classList.remove("show");
};
$("#dismissInstall").onclick = () => $("#installBar").classList.remove("show");

// Cookbook opening splash
$("#openBook").onclick = () => {
  $("#bookCover").classList.add("opened");
  setTimeout(() => {
    $("#splash").style.opacity = "0";
    $("#splash").style.transition = "opacity .4s";
    $("#appRoot").style.display = "block";
    setTimeout(() => $("#splash").remove(), 400);
  }, 700);
};
