export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "online",
          service: "Arabic AI Site Manager",
          ai: "ready",
        }),
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...cors,
          },
        }
      );
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: cors,
      });
    }

    try {
      const body = await request.json();
      const message = body.message?.trim();

      if (!message) {
        return new Response(
          JSON.stringify({ error: "اكتب رسالة أولًا." }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              ...cors,
            },
          }
        );
      }

      const aiResponse = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openrouter/free",
            messages: [
              {
                role: "system",
                content:
                  "أنت مدير مواقع وبرمجيات شخصي. تحدث دائمًا بالعربية المصرية الواضحة. أنت حاليًا في مرحلة التحليل فقط. لا تدّعي تنفيذ أي تعديل أو اتصال بأي سيرفر. إذا طلب المستخدم تعديلًا، اشرح ما ستفعله أولًا.",
              },
              {
                role: "user",
                content: message,
              },
            ],
          }),
        }
      );

      const data = await aiResponse.json();

      if (!aiResponse.ok) {
        return new Response(
          JSON.stringify({
            error: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.",
          }),
          {
            status: 502,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              ...cors,
            },
          }
        );
      }

      const answer =
        data?.choices?.[0]?.message?.content ||
        "لم يصل رد من النموذج.";

      return new Response(
        JSON.stringify({
          answer,
        }),
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...cors,
          },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "حدث خطأ داخل الـWorker.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...cors,
          },
        }
      );
    }
  },
};