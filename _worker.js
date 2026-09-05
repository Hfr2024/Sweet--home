const DEFAULT_DATA = {
  site: {
    name: "Sweet Home",
    title: "حلويات تُصنع<br><em>بحب</em> كل يوم.",
    description: "اختار من تشكيلتنا من الحلويات الشرقية والغربية والنواعم، وحدد فرعك واستلم طلبك بسهولة.",
    logo: "sweet-home-logo.jpg",
    hero: "hero-sweet-home.jpg"
  },
  products: [
    {id:1,name:"بسبوسة بالقشطة",cat:"شرقي",price:95,emoji:"🍮"},
    {id:2,name:"كنافة نابلسية",cat:"شرقي",price:120,emoji:"🥮"},
    {id:3,name:"تشيز كيك",cat:"غربي",price:135,emoji:"🍰"},
    {id:4,name:"مولتن شوكولاتة",cat:"غربي",price:110,emoji:"🍫"},
    {id:5,name:"كرواسون زبدة",cat:"نواعم",price:55,emoji:"🥐"},
    {id:6,name:"دونات شوكولاتة",cat:"نواعم",price:60,emoji:"🍩"},
    {id:7,name:"أم علي",cat:"شرقي",price:85,emoji:"🥣"},
    {id:8,name:"كب كيك",cat:"غربي",price:65,emoji:"🧁"}
  ],
  branches: [
    {name:"فرع مدينة السلام",address:"مدينة السلام",phone:"01094004001",wa:"201094004001"},
    {name:"فرع قناة السويس",address:"قناة السويس",phone:"01090881475",wa:"201090881475"},
    {name:"فرع الترعة",address:"الترعة",phone:"01022266663",wa:"201022266663"},
    {name:"فرع النخلة",address:"النخلة",phone:"01002999907",wa:"201002999907"}
  ]
};

const json = (data, status=200) => new Response(JSON.stringify(data), {
  status,
  headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
});

async function getData(env) {
  const raw = await env.SWEET_HOME_KV.get("site_data");
  if (!raw) {
    await env.SWEET_HOME_KV.put("site_data", JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  }
  try { return JSON.parse(raw); } catch (_) { return DEFAULT_DATA; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/data" && request.method === "GET") {
      return json(await getData(env));
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      try {
        const body = await request.json();
        if (!env.ADMIN_PASSWORD || body.password !== env.ADMIN_PASSWORD) return json({ok:false}, 401);
        return json({ok:true});
      } catch (_) { return json({ok:false}, 400); }
    }

    if (url.pathname === "/api/data" && request.method === "PUT") {
      if (!env.ADMIN_PASSWORD || request.headers.get("X-Admin-Password") !== env.ADMIN_PASSWORD) {
        return json({ok:false, error:"Unauthorized"}, 401);
      }
      try {
        const body = await request.json();
        if (!body || !body.site || !Array.isArray(body.products) || !Array.isArray(body.branches)) {
          return json({ok:false,error:"Invalid data"},400);
        }
        // Basic size protection for accidental oversized uploads.
        const encoded = JSON.stringify(body);
        if (encoded.length > 20000000) return json({ok:false,error:"Data too large"},413);
        await env.SWEET_HOME_KV.put("site_data", encoded);
        return json({ok:true});
      } catch (_) { return json({ok:false,error:"Invalid JSON"},400); }
    }

    return env.ASSETS.fetch(request);
  }
};