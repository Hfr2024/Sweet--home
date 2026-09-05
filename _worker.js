const ADMIN_PASSWORD="1234";

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
  payments:["الدفع عند الاستلام","InstaPay","Vodafone Cash","Visa"],
  delivery:"التوصيل متاح على أي فرع داخل مدينة المنصورة فقط."
};

const merge=(x={})=>({
  site:{...DEFAULT_DATA.site,...(x.site||{})},
  products:Array.isArray(x.products)?x.products:[],
  branches:Array.isArray(x.branches)&&x.branches.length?x.branches:DEFAULT_DATA.branches.map(b=>({...b})),
  payments:Array.isArray(x.payments)&&x.payments.length?x.payments:[...DEFAULT_DATA.payments],
  delivery:x.delivery||DEFAULT_DATA.delivery
});

const json=(data,status=200)=>new Response(JSON.stringify(data),{
  status,
  headers:{"content-type":"application/json;charset=utf-8","cache-control":"no-store"}
});

async function getData(env){
  if(!env.SWEET_HOME_KV)return DEFAULT_DATA;
  const raw=await env.SWEET_HOME_KV.get("site_data");
  if(!raw){
    await env.SWEET_HOME_KV.put("site_data",JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  }
  try{return merge(JSON.parse(raw))}
  catch{return DEFAULT_DATA}
}

export default{
  async fetch(request,env){
    const url=new URL(request.url);

    if(url.pathname==="/api/data"&&request.method==="GET"){
      return json(await getData(env));
    }

    if(url.pathname==="/api/login"&&request.method==="POST"){
      try{
        const body=await request.json();
        return body.password===ADMIN_PASSWORD?json({ok:true}):json({ok:false},401);
      }catch{return json({ok:false},400)}
    }

    if(url.pathname==="/api/data"&&request.method==="PUT"){
      const password=request.headers.get("X-Admin-Password")||"";
      if(password!==ADMIN_PASSWORD)return json({ok:false,error:"Unauthorized"},401);
      try{
        const body=merge(await request.json());
        if(env.SWEET_HOME_KV)await env.SWEET_HOME_KV.put("site_data",JSON.stringify(body));
        return json({ok:true});
      }catch{return json({ok:false,error:"Invalid JSON"},400)}
    }

    return env.ASSETS.fetch(request);
  }
};
