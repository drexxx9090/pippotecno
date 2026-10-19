import { db, auth } from "./firebase-config.js";
import { collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const $ = id => document.getElementById(id);
const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt !== undefined) e.textContent = txt; return e; };
let prods = [], cats = [], editId = null, imgProd = "", imgLogo = "", unsub = [];
function aviso(t, err){ const m = el("div","msg"+(err?" err":""),t); $("msg").replaceChildren(m); setTimeout(()=>m.remove(),4000); }

// Achica la imagen en el navegador y la devuelve como texto base64
function achicar(file, max, tipo){
  return new Promise((ok, no) => {
    const r = new FileReader();
    r.onload = () => { const i = new Image(); i.onload = () => {
      const k = Math.min(1, max/Math.max(i.width,i.height)), c = document.createElement("canvas");
      c.width = i.width*k; c.height = i.height*k; c.getContext("2d").drawImage(i,0,0,c.width,c.height);
      let q = .8, d = c.toDataURL(tipo,q);
      while (d.length > 700000 && q > .2) { q -= .1; d = c.toDataURL("image/jpeg",q); } // límite Firestore
      ok(d); }; i.onerror = no; i.src = r.result; };
    r.onerror = no; r.readAsDataURL(file);
  });
}

$("entrar").onclick = () => signInWithEmailAndPassword(auth,$("em").value,$("pw").value).catch(()=>aviso("Email o contraseña incorrectos",1));
$("pw").onkeydown = e => { if (e.key === "Enter") $("entrar").click(); };
$("salir").onclick = () => signOut(auth);
onAuthStateChanged(auth, u => {
  const ok = !!u; $("login").classList.toggle("hide",ok); $("panel").classList.toggle("hide",!ok);
  unsub.forEach(f=>f()); unsub = [];
  if (!ok) return;
  unsub.push(onSnapshot(collection(db,"categories"), s => { cats = s.docs.map(d=>({id:d.id,...d.data()})); pintarCats(); pintarProds(); }));
  unsub.push(onSnapshot(collection(db,"products"), s => { prods = s.docs.map(d=>({id:d.id,...d.data()})); pintarProds(); }));
  unsub.push(onSnapshot(doc(db,"settings","negocio"), s => { const d = s.data()||{};
    $("sn").value=d.nombre||"Pippotecno"; $("sw").value=d.whatsapp||"5492302570810"; $("si").value=d.instagram||"pippotecno";
    $("sz").value=d.zona||""; $("sq").value=d.quienesSomos||""; imgLogo=d.logo||""; if(imgLogo){$("slv").src=imgLogo;$("slv").classList.remove("hide");} }));
});
document.querySelectorAll("[data-t]").forEach(b => b.onclick = () => {
  document.querySelectorAll(".tab").forEach(t=>t.classList.add("hide")); $(b.dataset.t).classList.remove("hide");
  document.querySelectorAll("[data-t]").forEach(x=>x.classList.toggle("on",x===b)); });

// ---- Productos ----
$("pf").onchange = async e => { if(!e.target.files[0]) return; imgProd = await achicar(e.target.files[0],800,"image/jpeg"); $("pv").src=imgProd; $("pv").classList.remove("hide"); };
function limpiar(){ editId=null; ["pn","pp","ps","pf"].forEach(i=>$(i).value=""); $("pe").value="ninguna"; $("pvis").checked=true; imgProd=""; $("pv").classList.add("hide"); $("ftit").textContent="Nuevo producto"; }
$("cp").onclick = limpiar;
$("gp").onclick = async () => {
  const precio = Number($("pp").value), stock = Number($("ps").value), nombre = $("pn").value.trim();
  if (!nombre || !(precio>=0) || !(stock>=0) || $("pp").value==="" || $("ps").value==="") return aviso("Completá nombre, precio y stock (números desde 0)",1);
  const d = { nombre, precio, stock, categoriaId:$("pc").value, etiqueta:$("pe").value, visible:$("pvis").checked, imagen:imgProd };
  try { if (editId) await updateDoc(doc(db,"products",editId),d); else await addDoc(collection(db,"products"),{...d,creado:serverTimestamp()});
    aviso("Producto guardado"); limpiar(); } catch(e){ aviso("No se pudo guardar, intentá de nuevo",1); }
};
function pintarProds(){
  $("pc").replaceChildren(...cats.map(c=>{const o=el("option","",c.nombre);o.value=c.id;return o;}));
  $("lista").replaceChildren();
  prods.forEach(p => {
    const r = el("div","item"), im = el("img","prev"); im.style.width=im.style.height="56px"; im.alt=p.nombre; if(p.imagen) im.src=p.imagen;
    const n = el("div","n"); n.append(el("b","",p.nombre), el("div","stock",((cats.find(c=>c.id===p.categoriaId)||{}).nombre||"Sin categoría")+" · "+(p.etiqueta||"ninguna")+(p.visible===false?" · OCULTO":"")));
    const pr = el("input"), st = el("input"); pr.type=st.type="number"; pr.min=st.min=0; pr.value=p.precio; st.value=p.stock; pr.title="Precio"; st.title="Stock";
    const ok = el("button","btn azul","Guardar"); ok.onclick = () => updateDoc(doc(db,"products",p.id),{precio:Number(pr.value),stock:Number(st.value)}).then(()=>aviso("Precio y stock guardados")).catch(()=>aviso("No se pudo guardar",1));
    const ed = el("button","btn sec","Editar"); ed.onclick = () => { editId=p.id; $("pn").value=p.nombre; $("pp").value=p.precio; $("ps").value=p.stock; $("pc").value=p.categoriaId; $("pe").value=p.etiqueta||"ninguna"; $("pvis").checked=p.visible!==false; imgProd=p.imagen||""; $("pv").src=imgProd; $("pv").classList.toggle("hide",!imgProd); $("ftit").textContent="Editando: "+p.nombre; scrollTo(0,0); };
    const bo = el("button","btn sec","Borrar"); bo.onclick = () => confirm("¿Borrar "+p.nombre+"?") && deleteDoc(doc(db,"products",p.id)).then(()=>aviso("Producto borrado"));
    r.append(im,n,pr,st,ok,ed,bo); $("lista").append(r);
  });
}

// ---- Categorías ----
$("gc").onclick = async () => { const n=$("cn").value.trim(); if(!n) return; await addDoc(collection(db,"categories"),{nombre:n,orden:cats.length}); $("cn").value=""; aviso("Categoría creada"); };
function pintarCats(){
  $("lcat").replaceChildren();
  cats.forEach(c => { const r = el("div","item"), n = el("div","n",c.nombre), b = el("button","btn sec","Borrar");
    b.onclick = () => { const k = prods.filter(p=>p.categoriaId===c.id).length;
      if (confirm(k ? `Hay ${k} producto(s) en esta categoría. ¿Borrar igual?` : "¿Borrar categoría?")) deleteDoc(doc(db,"categories",c.id)); };
    r.append(n,b); $("lcat").append(r); });
}

// ---- Negocio ----
$("sl").onchange = async e => { if(!e.target.files[0]) return; imgLogo = await achicar(e.target.files[0],300,"image/png"); $("slv").src=imgLogo; $("slv").classList.remove("hide"); };
$("gs").onclick = () => setDoc(doc(db,"settings","negocio"),{ nombre:$("sn").value, whatsapp:$("sw").value.replace(/\D/g,""), instagram:$("si").value.replace("@",""), zona:$("sz").value, quienesSomos:$("sq").value, logo:imgLogo })
  .then(()=>aviso("Negocio guardado")).catch(()=>aviso("No se pudo guardar, intentá de nuevo",1));
