
let D={};
let cart=[];
let currentTab="site";
const $=id=>document.getElementById(id);

const DEFAULT_DATA={
  site:{
    name:"Sweet Home",
    title:"حلويات تُصنع<br><em>بحب</em> كل يوم.",
    description:"اختار من تشكيلتنا من الحلويات الشرقية والغربية والنواعم والشيكولاتة ورمضانيات وحلاوة المولد، وحدد فرعك واستلم طلبك بسهولة.",
    logo:"",
    hero:""
  },
  products:[],
  branches:[
    {name:"مدينة السلام",address:"",phone:"01094004001",wa:"201094004001",hours:"10:00 ص - 1:00 ص"},
    {name:"قناة السويس",address:"",phone:"01090881475",wa:"201090881475",hours:"10:00 ص - 1:00 ص"},
    {name:"الترعة",address:"",phone:"01022266663",wa:"201022266663",hours:"10:00 ص - 2:00 ص"},
    {name:"النخلة",address:"",phone:"01002999907",wa:"201002999907",hours:"10:00 ص - 1:00 ص"}
  ],
  paypayments:["الدفع عند الاستلام","InstaPay","Vodafone Cash","Visa"],
  delivery:"التوصيل متاح على أي فرع داخل مدينة المنصورة فقط."
};

const e=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const mergeData=(x={})=>({
  site:{...DEFAULT_DATA.site,...(x.site||{})},
  products:Array.isArray(x.products)?x.products:[],
  branches:Array.isArray(x.branches)&&x.branches.length?x.branches:DEFAULT_DATA.branches.map(b=>({...b})),
  payments:Array.isArray(x.payments)&&x.payments.length?x.payments:[...DEFAULT_DATA.payments],
  delivery:x.delivery||DEFAULT_DATA.delivery
});

async function load(){
  try{
    const r=await fetch("/api/data?v="+Date.now(),{cache:"no-store"});
    D=mergeData(r.ok?await r.json():{});
  }catch{D=mergeData({})}
  render();
}

function render(){
  $("brandName").textContent=D.site.name||"Sweet Home";
  document.title=D.site.name||"Sweet Home";
  $("heroTitle").innerHTML=D.site.title||DEFAULT_DATA.site.title;
  $("heroDesc").textContent=D.site.description||DEFAULT_DATA.site.description;

  const cats=["الكل",...new Set(D.products.map(p=>p.cat).filter(Boolean))];
  $("filters").innerHTML=cats.map((c,i)=>`<button class="filter ${i?"":"active"}" onclick="showProducts('${e(c)}',this)">${e(c)}</button>`).join("");
  showProducts("الكل",document.querySelector(".filter"));

  $("branchesGrid").innerHTML=D.branches.map(b=>`
    <div class="branch">
      <h3>${e(b.name)}</h3>
      <div>📍 ${e(b.address||"العنوان يضاف من الإدارة")}</div>
      <div>🕐 ${e(b.hours||"10:00 ص - 1:00 ص")}</div>
      <a href="tel:${e(b.phone)}">📞 ${e(b.phone)}</a>
      <a target="_blank" rel="noopener" href="https://wa.me/${normalizeWA(b.wa||b.phone)}">💬 واتساب الفرع</a>
    </div>`).join("");

  $("branchSelect").innerHTML=`<option value="">اختار الفرع</option>`+
    D.branches.map((b,i)=>`<option value="${i}">${e(b.name)} — ${e(b.hours||"")}</option>`).join("");

  $("paymentSelect").innerHTML=`<option value="">اختار طريقة الدفع</option>`+
    D.payments.map(p=>`<option value="${e(p)}">${e(p)}</option>`).join("");

  cartRender();

  if(new URLSearchParams(location.search).get("admin")==="1"){
    $("adminOpen").classList.remove("hidden");
  }else{
    $("adminOpen").classList.add("hidden");
  }
}

function showProducts(cat,btn){
  document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
  btn?.classList.add("active");
  const arr=cat==="الكل"?D.products:D.products.filter(p=>p.cat===cat);
  $("productsGrid").innerHTML=arr.length?arr.map(p=>`
    <article class="product">
      <div class="pic">${p.image?`<img src="${e(p.image)}" alt="${e(p.name)}">`:e(p.emoji||"🍰")}</div>
      <div class="body">
        <small>${e(p.cat||"قسم")}</small>
        <h3>${e(p.name)}</h3>
        <div class="price">${Number(p.price||0)} جنيه</div>
        <button class="add" onclick="add(${p.id})">+ أضف للسلة</button>
      </div>
    </article>`).join(""):"<p>لا توجد منتجات في هذا القسم حاليًا.</p>";
}

function add(id){
  const x=cart.find(x=>x.id===id);
  if(x)x.q++;else cart.push({id,q:1});
  cartRender();
  location.hash="order";
}
function del(id){cart=cart.filter(x=>x.id!==id);cartRender()}

function cartRender(){
  if(!cart.length){
    $("cartItems").textContent="السلة فارغة";
    $("cartTotal").textContent="الإجمالي: 0 جنيه";
    return;
  }
  let t=0;
  $("cartItems").innerHTML=cart.map(x=>{
    const p=D.products.find(p=>p.id===x.id);
    if(!p)return"";
    const v=Number(p.price||0)*x.q;t+=v;
    return `<div class="cartrow"><span>${e(p.name)} × ${x.q}</span><span>${v} ج <button onclick="del(${x.id})">حذف</button></span></div>`;
  }).join("");
  $("cartTotal").textContent=`الإجمالي: ${t} جنيه`;
}

function normalizeWA(v){
  let s=String(v||"").replace(/\D/g,"");
  if(s.startsWith("00"))s=s.slice(2);
  if(s.startsWith("0"))s="20"+s.slice(1);
  return s;
}

$("orderForm").onsubmit=ev=>{
  ev.preventDefault();
  if(!cart.length)return alert("أضف منتجًا أولاً");
  const bi=Number($("branchSelect").value);
  if(!Number.isInteger(bi)||!D.branches[bi])return alert("اختار الفرع أولاً");
  if(!$("paymentSelect").value)return alert("اختار طريقة الدفع أولاً");

  const b=D.branches[bi];
  const wa=normalizeWA(b.wa||b.phone);
  if(!wa)return alert("رقم واتساب الفرع غير موجود");

  let total=0;
  const lines=cart.map(x=>{
    const p=D.products.find(p=>p.id===x.id);
    if(!p)return"";
    const v=Number(p.price||0)*x.q;
    total+=v;
    return `• ${p.name} × ${x.q} = ${v} جنيه`;
  }).filter(Boolean).join("\n");

  const msg=`طلب Sweet Home
الاسم: ${$("customerName").value}
الموبايل: ${$("customerPhone").value}
العنوان: ${$("customerAddress").value}
الفرع: ${b.name}
مواعيد الفرع: ${b.hours||""}
الدفع: ${$("paymentSelect").value}

${lines}

الإجمالي: ${total} جنيه
${D.delivery}`;

  location.href=`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`;
};

function openAdmin(){
  $("adminModal").classList.remove("hidden");
  if(sessionStorage.getItem("sweetHomeAdmin")==="1")showAdmin();
  else{
    $("loginView").classList.remove("hidden");
    $("adminView").classList.add("hidden");
    $("adminPassword").focus();
  }
}
function closeAdmin(){$("adminModal").classList.add("hidden")}
async function adminLogin(){
  const p=$("adminPassword").value.trim();
  const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:p})});
  if(r.ok){sessionStorage.setItem("sweetHomeAdmin","1");showAdmin()}
  else $("loginMsg").textContent="كلمة المرور غير صحيحة.";
}
function showAdmin(){
  $("loginView").classList.add("hidden");
  $("adminView").classList.remove("hidden");
  tab(currentTab);
}
function adminLogout(){sessionStorage.removeItem("sweetHomeAdmin");closeAdmin()}

function tab(t){
  currentTab=t;
  if(t==="site"){
    $("adminContent").innerHTML=`<div class="admin">
      <label>اسم الموقع</label><input id="n" value="${e(D.site.name)}">
      <label>العنوان الرئيسي</label><textarea id="ti">${e(D.site.title)}</textarea>
      <label>الوصف</label><textarea id="de">${e(D.site.description)}</textarea>
      <label>رابط اللوجو</label><input id="lo" value="${e(D.site.logo)}">
      <label>رابط صورة البانر</label><input id="he" value="${e(D.site.hero)}">
      <label>ملاحظة التوصيل</label><input id="delivery" value="${e(D.delivery)}">
      <label>طرق الدفع (كل طريقة في سطر)</label><textarea id="payments">${e(D.payments.join("\n"))}</textarea>
    </div>`;
  }
  if(t==="products"){
    $("adminContent").innerHTML=D.products.map((p,i)=>`<div class="admin">
      <div class="row">
        <div><label>اسم المنتج</label><input data-p="${i}" data-k="name" value="${e(p.name)}"></div>
        <div><label>السعر</label><input type="number" data-p="${i}" data-k="price" value="${Number(p.price||0)}"></div>
      </div>
      <div class="row">
        <div><label>القسم</label><input data-p="${i}" data-k="cat" value="${e(p.cat||"")}"></div>
        <div><label>رابط الصورة</label><input data-p="${i}" data-k="image" value="${e(p.image||"")}"></div>
      </div>
    </div>`).join("")+
    `<button onclick="newProduct()">+ إضافة منتج</button>`;
  }
  if(t==="branches"){
    $("adminContent").innerHTML=D.branches.map((b,i)=>`<div class="admin">
      <h3>${e(b.name||"فرع")}</h3>
      <div class="row">
        <div><label>اسم الفرع</label><input data-b="${i}" data-k="name" value="${e(b.name)}"></div>
        <div><label>العنوان</label><input data-b="${i}" data-k="address" value="${e(b.address||"")}"></div>
      </div>
      <div class="row">
        <div><label>الهاتف</label><input data-b="${i}" data-k="phone" value="${e(b.phone||"")}"></div>
        <div><label>واتساب</label><input data-b="${i}" data-k="wa" value="${e(b.wa||"")}"></div>
      </div>
      <label>مواعيد الفتح والغلق</label><input data-b="${i}" data-k="hours" value="${e(b.hours||"")}">
    </div>`).join("")+
    `<button onclick="newBranch()">+ إضافة فرع</button>`;
  }
}

function collect(){
  if(currentTab==="site"){
    D.site.name=$("n").value;
    D.site.title=$("ti").value;
    D.site.description=$("de").value;
    D.site.logo=$("lo").value;
    D.site.hero=$("he").value;
    D.delivery=$("delivery").value;
    D.payments=$("payments").value.split(/\n/).map(x=>x.trim()).filter(Boolean);
  }
  document.querySelectorAll("[data-p]").forEach(x=>{
    D.products[+x.dataset.p][x.dataset.k]=x.dataset.k==="price"?Number(x.value):x.value;
  });
  document.querySelectorAll("[data-b]").forEach(x=>{
    D.branches[+x.dataset.b][x.dataset.k]=x.value;
  });
}

async function saveAdmin(){
  collect();
  const p=prompt("كلمة مرور الإدارة للتأكيد","1234");
  if(p===null)return;
  const r=await fetch("/api/data",{
    method:"PUT",
    headers:{"Content-Type":"application/json","X-Admin-Password":p},
    body:JSON.stringify(D)
  });
  $("saveMsg").textContent=r.ok?"تم الحفظ بنجاح ✅":"فشل الحفظ.";
  if(r.ok){render();tab(currentTab)}
}

function newProduct(){
  const cats=["شرقي","غربي","نواعم","شيكولاته","رمضانيات","حلاوة المولد"];
  D.products.push({id:Date.now(),name:"منتج جديد",cat:cats[0],price:0,image:"",emoji:"🍰"});
  tab("products");
}
function newBranch(){
  D.branches.push({name:"فرع جديد",address:"",phone:"",wa:"",hours:"10:00 ص - 1:00 ص"});
  tab("branches");
}

$("adminOpen").onclick=openAdmin;
load();
ذ
