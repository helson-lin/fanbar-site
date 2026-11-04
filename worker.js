var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// vercel.json
var vercel_default = {
  $schema: "https://openapi.vercel.sh/vercel.json",
  redirects: [
    {
      source: "/en",
      destination: "/",
      permanent: true
    }
  ],
  rewrites: [
    {
      source: "/",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/index.md"
    },
    {
      source: "/zh",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/zh/index.md"
    },
    {
      source: "/compare/macs-fan-control",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/compare/macs-fan-control.md"
    },
    {
      source: "/compatibility",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/compatibility.md"
    },
    {
      source: "/zh/compare/macs-fan-control",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/zh/compare/macs-fan-control.md"
    },
    {
      source: "/zh/compatibility",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/zh/compatibility.md"
    },
    {
      source: "/api",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/api.md"
    },
    {
      source: "/is-fanbar-safe",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/is-fanbar-safe.md"
    },
    {
      source: "/zh/is-fanbar-safe",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/zh/is-fanbar-safe.md"
    },
    {
      source: "/ru",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/ru/index.md"
    },
    {
      source: "/zh-tw",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/zh-tw/index.md"
    },
    {
      source: "/ja",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/ja/index.md"
    },
    {
      source: "/fr",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      destination: "/fr/index.md"
    }
  ],
  headers: [
    {
      source: "/(.*)",
      headers: [
        {
          key: "Content-Signal",
          value: "ai-train=no, search=yes, ai-input=yes"
        }
      ]
    },
    {
      source: "/.well-known/api-catalog",
      headers: [
        {
          key: "Content-Type",
          value: 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"'
        },
        {
          key: "Link",
          value: '<https://getfanbar.com/.well-known/api-catalog>; rel="api-catalog"'
        },
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        },
        {
          key: "Cache-Control",
          value: "public, max-age=0, s-maxage=3600"
        }
      ]
    },
    {
      source: "/openapi.json",
      headers: [
        {
          key: "Content-Type",
          value: "application/vnd.oai.openapi+json;version=3.1; charset=utf-8"
        },
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        }
      ]
    },
    {
      source: "/api/product.json",
      headers: [
        {
          key: "Content-Type",
          value: "application/json; charset=utf-8"
        },
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        },
        {
          key: "Cache-Control",
          value: "public, max-age=0, s-maxage=3600"
        }
      ]
    },
    {
      source: "/api/health.json",
      headers: [
        {
          key: "Content-Type",
          value: "application/json; charset=utf-8"
        },
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        },
        {
          key: "Cache-Control",
          value: "public, max-age=0, s-maxage=3600"
        }
      ]
    },
    {
      source: "/llms.txt",
      headers: [
        {
          key: "Content-Type",
          value: "text/plain; charset=utf-8"
        },
        {
          key: "Link",
          value: '</>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/llms-full.txt",
      headers: [
        {
          key: "Content-Type",
          value: "text/plain; charset=utf-8"
        },
        {
          key: "Link",
          value: '</llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/index.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/zh/index.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/compare/macs-fan-control.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</compare/macs-fan-control>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/compatibility.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</compatibility>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/zh/compare/macs-fan-control.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</zh/compare/macs-fan-control>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/zh/compatibility.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</zh/compatibility>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/api.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</api>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/",
      headers: [
        {
          key: "Vary",
          value: "Accept"
        },
        {
          key: "Link",
          value: '</index.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby", </.well-known/api-catalog>; rel="api-catalog"'
        }
      ]
    },
    {
      source: "/zh",
      headers: [
        {
          key: "Vary",
          value: "Accept"
        },
        {
          key: "Link",
          value: '</zh/index.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby", </.well-known/api-catalog>; rel="api-catalog"'
        }
      ]
    },
    {
      source: "/compare/macs-fan-control",
      headers: [
        {
          key: "Vary",
          value: "Accept"
        },
        {
          key: "Link",
          value: '</compare/macs-fan-control.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/compatibility",
      headers: [
        {
          key: "Vary",
          value: "Accept"
        },
        {
          key: "Link",
          value: '</compatibility.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/zh/compare/macs-fan-control",
      headers: [
        {
          key: "Vary",
          value: "Accept"
        },
        {
          key: "Link",
          value: '</zh/compare/macs-fan-control.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/zh/compatibility",
      headers: [
        {
          key: "Vary",
          value: "Accept"
        },
        {
          key: "Link",
          value: '</zh/compatibility.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/api",
      headers: [
        {
          key: "Vary",
          value: "Accept"
        },
        {
          key: "Link",
          value: '</api.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby", </.well-known/api-catalog>; rel="api-catalog"'
        }
      ]
    },
    {
      source: "/",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        }
      ]
    },
    {
      source: "/zh",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        }
      ]
    },
    {
      source: "/compare/macs-fan-control",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        }
      ]
    },
    {
      source: "/compatibility",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        }
      ]
    },
    {
      source: "/zh/compare/macs-fan-control",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        }
      ]
    },
    {
      source: "/zh/compatibility",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        }
      ]
    },
    {
      source: "/api",
      has: [
        {
          type: "header",
          key: "accept",
          value: "(.*)text/markdown(.*)"
        }
      ],
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        }
      ]
    },
    {
      source: "/is-fanbar-safe.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</is-fanbar-safe>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/zh/is-fanbar-safe.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</zh/is-fanbar-safe>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/ru/index.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</ru>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/zh-tw/index.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</zh-tw>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/ja/index.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</ja>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    },
    {
      source: "/fr/index.md",
      headers: [
        {
          key: "Content-Type",
          value: "text/markdown; charset=utf-8"
        },
        {
          key: "Link",
          value: '</fr>; rel="canonical", </llms.txt>; rel="describedby"'
        }
      ]
    }
  ]
};

// cloudflare/worker.mjs
function matches(rule, pathname, request) {
  return (rule.source === "/(.*)" || rule.source === pathname) && (rule.has ?? []).every((condition) => {
    if (condition.type !== "header") throw new Error("Unsupported HTTP rule condition");
    const value = request.headers.get(condition.key);
    return value !== null && new RegExp(`^(?:${condition.value})$`).test(value);
  });
}
__name(matches, "matches");
function varyOn(response, value) {
  const values = new Set((response.headers.get("Vary") ?? "").split(",").map((item) => item.trim()).filter(Boolean));
  if (![...values].some((item) => item.toLowerCase() === value.toLowerCase())) values.add(value);
  response.headers.set("Vary", [...values].join(", "));
}
__name(varyOn, "varyOn");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.getfanbar.com") {
      url.hostname = "getfanbar.com";
      url.protocol = "https:";
      return new Response(null, {
        status: 308,
        headers: { Location: url.href, "Content-Signal": "ai-train=no, search=yes, ai-input=yes" }
      });
    }
    const pathname = url.pathname;
    const redirect = vercel_default.redirects.find((rule) => matches(rule, pathname, request));
    if (redirect) {
      url.pathname = redirect.destination;
      return new Response(null, {
        status: redirect.permanent ? 308 : 307,
        headers: { Location: url.href, "Content-Signal": "ai-train=no, search=yes, ai-input=yes" }
      });
    }
    const rewrite = vercel_default.rewrites.find((rule) => matches(rule, pathname, request));
    if (rewrite && (request.method === "GET" || request.method === "HEAD")) {
      url.pathname = rewrite.destination;
    }
    const asset = await env.ASSETS.fetch(new Request(url, request));
    const response = new Response(asset.body, asset);
    for (const path of /* @__PURE__ */ new Set([url.pathname, pathname])) {
      for (const rule of vercel_default.headers) {
        if (!matches(rule, path, request)) continue;
        for (const { key, value } of rule.headers) {
          if (key.toLowerCase() === "vary") {
            varyOn(response, value);
          } else {
            response.headers.set(key, value);
          }
        }
      }
    }
    if (vercel_default.rewrites.some((rule) => rule.source === pathname)) varyOn(response, "Accept");
    if (url.hostname.endsWith(".workers.dev")) response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map