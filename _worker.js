const DEFAULT_DATA={
site:{
name:"Sweet Home",
title:"حلويات تُصنع<br><em>بحب</em> كل يوم.",
description:"حلويات شرقية وغربية ونواعم وشيكولاتة ورمضانيات وحلاوة المولد، مع طلب مباشر عبر واتساب والتوصيل داخل مدينة المنصورة.",
logo:"",
hero:""
},
products:[
{id:1,name:"بسبوسة بالقشطة",cat:"حلويات شرقية",price:95,image:"",emoji:"🍮"},
{id:2,name:"كنافة نابلسية",cat:"حلويات شرقية",price:120,image:"",emoji:"🥮"},
{id:3,name:"أم علي",cat:"حلويات شرقية",price:85,image:"",emoji:"🥣"},
{id:4,name:"تشيز كيك",cat:"حلويات غربية",price:135,image:"",emoji:"🍰"},
{id:5,name:"مولتن شوكولاتة",cat:"حلويات غربية",price:110,image:"",emoji:"🍫"},
{id:6,name:"كب كيك",cat:"حلويات غربية",price:65,image:"",emoji:"🧁"},
{id:7,name:"كرواسون زبدة",cat:"نواعم",price:55,image:"",emoji:"🥐"},
{id:8,name:"دونات شوكولاتة",cat:"نواعم",price:60,image:"",emoji:"🍩"},
{id:9,name:"علبة شيكولاتة",cat:"شيكولاتة",price:180,image:"",emoji:"🍫"},
{id:10,name:"بوكس شيكولاتة فاخر",cat:"شيكولاتة",price:250,image:"",emoji:"🍫"},
{id:11,name:"قطايف رمضان",cat:"رمضانيات",price:90,image:"",emoji:"🥟"},
{id:12,name:"كنافة رمضان",cat:"رمضانيات",price:130,image:"",emoji:"🥮"},
{id:13,name:"بلح الشام",cat:"رمضانيات",price:80,image:"",emoji:"🍯"},
{id:14,name:"علبة حلاوة مولد مشكلة",cat:"حلاوة المولد",price:220,image:"",emoji:"🍬"},
{id:15,name:"حمصية",cat:"حلاوة المولد",price:90,image:"",emoji:"🥜"},
{id:16,name:"سمسمية",cat:"حلاوة المولد",price:90,image:"",emoji:"🍯"}
],
branches:[
{name:"فرع مدينة السلام",address:"مدينة السلام - المنصورة",phone:"01094004001",wa:"201094004001",open:"10:00 ص",close:"1:00 ص"},
{name:"فرع قناة السويس",address:"قناة السويس - المنصورة",phone:"01090881475",wa:"201090881475",open:"10:00 ص",close:"1:00 ص"},
{name:"فرع الترعة",address:"الترعة - المنصورة",phone:"01022266663",wa:"201022266663",open:"10:00 ص",close:"2:00 ص"},
{name:"فرع النخلة",address:"النخلة - المنصورة",phone:"01002999907",wa:"201002999907",open:"10:00 ص",close:"1:00 ص"}
],
payments:["الدفع عند الاستلام","InstaPay","Vodafone Cash","Visa"],
delivery:"التوصيل داخل مدينة المنصورة فقط — يمكنك اختيار أي فرع للتوصيل والاستلام."
};

const out=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json;charset=utf-8","cache-control":"no-store"}});
async function data(env){
if(!env.SWEET_HOME_KV)return DEFAULT_DATA;
let r=await env.SWEET_HOME_KV.get("site_data");
if(!r){await env.SWEET_HOME_KV.put("site_data",JSON.stringify(DEFAULT_DATA));return DEFAULT_DATA}
try{return JSON.parse(r)}catch{return DEFAULT_DATA}
}
function ok(p,e){return p==="1234"||(e.ADMIN_PASSWORD&&p===e.ADMIN_PASSWORD)}
export default{async fetch(req,env){
let u=new URL(req.url);
if(u.pathname==="/api/data"&&req.method==="GET")return out(await data(env));
if(u.pathname==="/api/login"&&req.method==="POST"){
try{let b=await req.json();return ok(b.password,env)?out({ok:true}):out({ok:false},401)}
catch{return out({ok:false},400)}
}
if(u.pathname==="/api/data"&&req.method==="PUT"){
if(!ok(req.headers.get("X-Admin-Password")||"",env))return out({ok:false,error:"Unauthorized"},401);
try{
let b=await req.json();
if(!b?.site||!Array.isArray(b.products)||!Array.isArray(b.branches))return out({ok:false,error:"Invalid data"},400);
let s=JSON.stringify(b);
if(s.length>20000000)return out({ok:false,error:"Data too large"},413);
if(env.SWEET_HOME_KV)await env.SWEET_HOME_KV.put("site_data",s);
return out({ok:true})
}catch{return out({ok:false,error:"Invalid JSON"},400)}
}
return env.ASSETS.fetch(req)
}};
