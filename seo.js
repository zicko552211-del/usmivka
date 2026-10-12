(function () {
  "use strict";

  const BRAND = "usmivka";
  const PAGE_INFO = {
    "index.html": {
      title: "Вицове, пожелания и дневен хороскоп | usmivka",
      description: "Открий български вицове, 50 пожелания за всеки повод, дневен хороскоп за 12-те зодии и безплатни игри. Ново настроение всеки ден."
    },
    "jokes.html": {
      title: "Български вицове по категории | usmivka",
      description: "Разгледай забавни български вицове за шофьори, програмисти, Иванчо, тъщи и доктори. Търси по тема, запазвай любими и разкривай поантата."
    },
    "greetings.html": {
      title: "50 пожелания за всеки повод | usmivka",
      description: "Намери пожелание за рожден ден, имен ден, сватба, юбилей и още поводи. Създай личен поздрав с Поздравителното ателие и го сподели."
    },
    "games.html": {
      title: "Безплатни браузърни игри без инсталиране | usmivka",
      description: "Играй без инсталиране: Змия, Морски шах за двама, игра за памет и тест за рефлекси. Забавления направо в браузъра, на компютър и телефон."
    }
  };

  function addMeta(attribute, key, value) {
    if (!value) return;
    let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }
    element.setAttribute("content", value);
  }

  function addLink(rel, href, type) {
    let element = document.head.querySelector(`link[rel="${rel}"]`);
    if (!element) {
      element = document.createElement("link");
      element.rel = rel;
      document.head.appendChild(element);
    }
    if (type) element.type = type;
    element.href = href;
  }

  function canonicalUrl() {
    if (!/^https?:$/.test(window.location.protocol)) return "";
    const url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    if (url.pathname.endsWith("/index.html")) url.pathname = url.pathname.slice(0, -"index.html".length);
    return url.href;
  }

  function structuredData(pageName, info, canonical) {
    const organization = {
      "@type": "Organization",
      name: BRAND,
      description: "Български сайт за вицове, пожелания, дневен хороскоп и браузърни игри.",
      logo: new URL("favicon.svg", window.location.href).href
    };
    const website = {
      "@type": "WebSite",
      name: BRAND,
      inLanguage: "bg-BG",
      publisher: { "@type": "Organization", name: BRAND }
    };
    if (canonical) {
      organization.url = new URL("./", canonical).href;
      website.url = new URL("./", canonical).href;
    }

    const graph = [organization, website];
    const page = {
      "@type": pageName === "index.html" ? "WebPage" : "CollectionPage",
      name: info.title,
      description: info.description,
      inLanguage: "bg-BG",
      isPartOf: { "@type": "WebSite", name: BRAND }
    };
    if (canonical) {
      page.isPartOf.url = new URL("./", canonical).href;
      page.url = canonical;
    }
    {
      if (pageName === "games.html") {
        page.mainEntity = {
          "@type": "ItemList",
          name: "Безплатни игри в браузъра",
          numberOfItems: 4,
          itemListElement: ["Змия", "Морски шах", "Намери двойките", "Светкавични рефлекси"].map((name, index) => ({
            "@type": "ListItem", position: index + 1,
            item: { "@type": "SoftwareApplication", name, applicationCategory: "GameApplication", operatingSystem: "Any", isAccessibleForFree: true }
          }))
        };
      } else if (pageName === "greetings.html") {
        page.mainEntity = { "@type": "ItemList", name: "Пожелания за различни поводи", numberOfItems: 50 };
      } else if (pageName === "jokes.html") {
        page.mainEntity = { "@type": "ItemList", name: "Български вицове по категории", itemListOrder: "https://schema.org/ItemListUnordered" };
      }
      graph.push(page);
    }

    let script = document.getElementById("siteStructuredData");
    if (!script) {
      script = document.createElement("script");
      script.id = "siteStructuredData";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  }

  async function updateContentTimestamp() {
    let targets = [...document.querySelectorAll("[data-last-updated]")];
    if (!targets.length) {
      const footer = document.querySelector("footer > div");
      if (footer) {
        const stamp = document.createElement("p");
        stamp.dataset.lastUpdated = "";
        stamp.className = "text-xs text-slate-500";
        stamp.setAttribute("aria-live", "polite");
        footer.appendChild(stamp);
        targets = [stamp];
      }
    }
    if (!targets.length) return;

    try {
      const response = await fetch(`data.json?updated=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Daily content is not available");
      const data = await response.json();
      const timestamp = data.last_updated || data.date;
      if (!timestamp) throw new Error("Update timestamp is missing");
      const parsed = new Date(timestamp);
      const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(timestamp));
      const label = Number.isNaN(parsed.getTime())
        ? String(timestamp)
        : new Intl.DateTimeFormat("bg-BG", {
          day: "numeric", month: "long", year: "numeric",
          ...(dateOnly ? {} : { hour: "2-digit", minute: "2-digit" }),
          timeZone: "Europe/Sofia"
        }).format(parsed);
      const timeSuffix = dateOnly ? "" : " ч.";
      targets.forEach(target => { target.textContent = `Последна актуализация: ${label}${timeSuffix}`; });
    } catch (error) {
      targets.forEach(target => { target.textContent = "Дневното съдържание се обновява автоматично."; });
    }
  }

  const pathname = window.location.pathname;
  const pageName = pathname.endsWith("/") ? "index.html" : pathname.split("/").pop();
  const info = PAGE_INFO[pageName];
  if (!info) return;

  document.title = info.title;
  addMeta("name", "description", info.description);
  addMeta("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  addMeta("name", "googlebot", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
  addMeta("name", "author", BRAND);
  addMeta("name", "theme-color", "#020617");
  addMeta("name", "color-scheme", "dark");
  addMeta("property", "og:type", "website");
  addMeta("property", "og:locale", "bg_BG");
  addMeta("property", "og:site_name", BRAND);
  addMeta("property", "og:title", info.title);
  addMeta("property", "og:description", info.description);
  addMeta("property", "og:image", new URL("social-preview.svg", window.location.href).href);
  addMeta("property", "og:image:type", "image/svg+xml");
  addMeta("property", "og:image:width", "1200");
  addMeta("property", "og:image:height", "630");
  addMeta("name", "twitter:card", "summary_large_image");
  addMeta("name", "twitter:title", info.title);
  addMeta("name", "twitter:description", info.description);
  addMeta("name", "twitter:image", new URL("social-preview.svg", window.location.href).href);
  addLink("icon", new URL("favicon.svg", window.location.href).href, "image/svg+xml");

  const canonical = canonicalUrl();
  if (canonical) {
    addLink("canonical", canonical);
    addMeta("property", "og:url", canonical);
  }
  addMeta("property", "og:image:alt", "usmivka — български вицове, пожелания, хороскоп и игри");
  structuredData(pageName, info, canonical);
  updateContentTimestamp();
})();
