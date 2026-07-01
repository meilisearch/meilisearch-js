import { defineConfig } from "vitepress";
import typedocSidebar from "../api/typedoc-sidebar.json";

export default defineConfig({
  title: "Meilisearch JavaScript",
  description: "Official Meilisearch JavaScript client documentation",
  base: "/meilisearch-js/",
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: "Guide", link: "/" },
      { text: "API", link: "/api/" },
      { text: "Documentation", link: "https://www.meilisearch.com/docs" },
    ],
    sidebar: [
      { text: "Guide", items: [{ text: "Introduction", link: "/" }] },
      { text: "API", items: typedocSidebar as any[] },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/meilisearch/meilisearch-js" },
      { icon: "discord", link: "https://discord.gg/meilisearch" },
      { icon: "twitter", link: "https://twitter.com/meilisearch" },
    ],
  },
});
