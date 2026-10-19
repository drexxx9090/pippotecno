import { db } from "./firebase-config.js";
import { collection, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $ = id => document.getElementById(id);
const money = n => "$ " + Number(n).toLocaleString("es-AR");
// Valores por defecto: se reemplazan con lo que cargues en el admin
let cfg = { nombre:"Pippotecno", whatsapp:"5492302570810", instagram:"pippotecno", quienesSomos:"", zona:"" };
let prods = [], cats = [], cat = "todas", cart = JSON.parse(localStorage.getItem("cart") || "{}");
const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt !== undefined) e.textContent = txt; return e; };
const wa = txt => `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(txt)}`;

// onSnapshot = actualiza solo en tiempo real cuando cambiás algo en el admin
onSnapshot(collection(db,"products"), s => { prods = s.docs.map(d => ({id:d.id,...d.data()})); pintar(); });
onSnapshot(collection(db,"categories"), s => { cats = s.docs.map(d => ({id:d.id,...d.data()})).sort((a,b)=>(a.orden||0)-(b.orden||0)); chips(); pintar(); });
onSnapshot(doc(db,"settings","negocio"), s => { if (s.exists()) cfg = {...cfg, ...s.data()}; cabecera(); });

function cabecera(){
  $("nombre").textContent = cfg.nombre; document.title = cfg.nombre;
  if (cfg.logo) $("logo").src = cfg.logo;
  const ig = "https://instagram.com/" + String(cfg.instagram).replace("@","");
  $("ig").href = $("ig2").href = ig; $("wa2").href = wa("Hola " + cfg.nombre + "!");
  $("quienes").textContent = cfg.quienesSomos || ""; 
  $("zona").textContent = cfg.zona ? "Vendemos solo en " + cfg.zona : "";
}
function chips(){
  $("chips").replaceChildren();
  [{id:"todas",nombre:"Todas"},...cats].forEach(c => {
    const b = el("button","chip"+(c.id===cat?" on":""),c.nombre);
    b.onclick = () => { cat = c.id; chips(); pintar(); };
    $("chips").append(b);
  });
}
function pintar(){
  const q = $("q").value.toLowerCase();
  const lista = prods.filter(p => p.visible !== false && (cat==="todas"||p.categoriaId===cat) && p.nombre.toLowerCase().includes(q));
  $("estado").textContent = lista.length ? "" : "No hay productos en esta categoría";
  $("grid").replaceChildren();
  lista.forEach(p => {
    const sin = !(p.stock > 0), c = el("div","card"+(sin?" off":""));
    const ph = el("div","ph"); const im = el("img"); im.alt = p.nombre; if (p.imagen) im.src = p.imagen; ph.append(im);
    if (p.etiqueta && p.etiqueta !== "ninguna") ph.append(el("span","badge",p.etiqueta));
    const info = el("div","info"); info.append(el("h3","",p.nombre), el("div","precio",money(p.precio)));
    info.append(el("div","stock"+(p.stock<=5&&!sin?" low":""), sin?"Sin stock":(p.stock<=5?"¡Últimas unidades!":"Stock: "+p.stock)));
    const a = el("div","acts"), add = el("button","btn","Agregar al carrito"); add.disabled = sin;
    add.onclick = () => { cart[p.id] = Math.min((cart[p.id]||0)+1, p.stock); guardar(); };
    const con = el("a","btn sec","Consultar"); con.href = wa(`Hola ${cfg.nombre}! Quiero consultar por: ${p.nombre} (${money(p.precio)})`); con.target="_blank"; con.rel="noopener"; con.style.textAlign="center";
    a.append(add,con); info.append(a); c.append(ph,info); $("grid").append(c);
  });
  carrito();
}
function guardar(){ localStorage.setItem("cart", JSON.stringify(cart)); carrito(); }
function carrito(){
  let total = 0, n = 0; $("items").replaceChildren();
  for (const id in cart) {
    const p = prods.find(x => x.id === id); if (!p) continue;
    cart[id] = Math.min(cart[id], p.stock||0); if (cart[id] <= 0) { delete cart[id]; continue; }
    total += p.precio*cart[id]; n += cart[id];
    const r = el("div","it"), m = el("button","q","−"), M = el("button","q","+"), x = el("button","q","✕");
    m.onclick = () => { cart[id]--; if(!cart[id]) delete cart[id]; guardar(); };
    M.onclick = () => { cart[id] = Math.min(cart[id]+1, p.stock); guardar(); };
    x.onclick = () => { delete cart[id]; guardar(); };
    r.append(el("span","",`${p.nombre} — ${money(p.precio*cart[id])}`), m, el("b","",cart[id]), M, x); $("items").append(r);
  }
  $("total").textContent = money(total); $("cnt").textContent = n; $("enviar").disabled = !n;
}
$("enviar").onclick = () => {
  let t = `Hola ${cfg.nombre}! Quiero hacer este pedido:\n`, total = 0;
  for (const id in cart) { const p = prods.find(x=>x.id===id); if(!p) continue; const s = p.precio*cart[id]; total += s;
    t += `- ${cart[id]} x ${p.nombre} (${money(p.precio)} c/u) = ${money(s)}\n`; }
  window.open(wa(t + `Total: ${money(total)}`), "_blank");
};
$("q").oninput = pintar;
$("abrir").onclick = () => $("cart").classList.add("open");
$("cerrar").onclick = () => $("cart").classList.remove("open");
chips(); cabecera(); carrito();
