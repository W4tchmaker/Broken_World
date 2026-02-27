import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "破碎世界",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    locale: "zh-CN",
    baseUrl: "www.w4tchmaker.com",
    ignorePatterns: ["private", "templates", ".obsidian", "模板/*", "测试/*"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        header: "ZCOOL XiaoWei",
        body: "Noto Sans SC",
        code: "monospace",
      },
      colors: {
        lightMode: {
          light: "#faf8f8",       // 页面背景
          lightgray: "#e5e5e5",   // 边框
          gray: "#b8b8b8",        // 关系图谱连线
          darkgray: "#4e4e4e",    // 正文文字
          dark: "#2b2b2b",        // 标题与图标
          secondary: "#d32f2f",   // 链接颜色（推荐用符合 JRPG 的鲜艳红色或蓝色）
          tertiary: "#84a59d",    // 悬停状态
          highlight: "rgba(143, 159, 169, 0.15)", // 内部链接背景
        },
        darkMode: {
          light: "#161617",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#ff5252",   // 暗色模式下的高亮红
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),

      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "absolute" }),
      Plugin.Description(),
      Plugin.LeafletMap(),
      Plugin.FantasyStatblocks()
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      // Plugin.CustomOgImages(),
    ],
  },
}

export default config
