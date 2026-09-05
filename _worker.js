const ADMIN_PASSWORD = "1234";

const DEFAULT_DATA = {
  site: {
    name: "Sweet Home",
    title: "حلويات تُصنع<br><em>بحب</em> كل يوم.",
    description:
      "اختار من تشكيلتنا من الحلويات الشرقية والغربية والنواعم، وحدد فرعك واستلم طلبك بسهولة.",
    logo: "",
    hero: ""
  },
  products: [],
  branches: [],
  payments: [
    "الدفع عند الاستلام",
    "InstaPay",
    "Vodafone Cash",
    "Visa"
  ],
  delivery: "التوصيل داخل مدينة المنصورة فقط"
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json;charset=utf-8",
      "cache-control": "no-store"
    }
  });

async function getData(env) {
  if (!env.SWEET_HOME_KV) return DEFAULT_DATA;

  let result = await env.SWEET_HOME_KV.get("site_data");

  if (!result) {
    await env.SWEET_HOME_KV.put(
      "site_data",
      JSON.stringify(DEFAULT_DATA)
    );
    return DEFAULT_DATA;
  }

  try {
    return JSON.parse(result);
  } catch {
    return DEFAULT_DATA;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // قراءة بيانات الموقع
    if (url.pathname === "/api/data" && request.method === "GET") {
      return json(await getData(env));
    }

    // تسجيل دخول الأدمن
    if (url.pathname === "/api/login" && request.method === "POST") {
      try {
        const body = await request.json();

        if (body.password === ADMIN_PASSWORD) {
          return json({ ok: true });
        }

        return json({ ok: false }, 401);
      } catch {
        return json({ ok: false }, 400);
      }
    }

    // حفظ بيانات الموقع من لوحة الأدمن
    if (url.pathname === "/api/data" && request.method === "PUT") {
      const password = request.headers.get("X-Admin-Password") || "";

      if (password !== ADMIN_PASSWORD) {
        return json(
          {
            ok: false,
            error: "Unauthorized"
          },
          401
        );
      }

      try {
        const body = await request.json();

        if (
          !body ||
          !body.site ||
          !Array.isArray(body.products) ||
          !Array.isArray(body.branches)
        ) {
          return json(
            {
              ok: false,
              error: "Invalid data"
            },
            400
          );
        }

        if (env.SWEET_HOME_KV) {
          await env.SWEET_HOME_KV.put(
            "site_data",
            JSON.stringify(body)
          );
        }

        return json({ ok: true });
      } catch {
        return json(
          {
            ok: false,
            error: "Invalid JSON"
          },
          400
        );
      }
    }

    // باقي ملفات الموقع
    return env.ASSETS.fetch(request);
  }
};
