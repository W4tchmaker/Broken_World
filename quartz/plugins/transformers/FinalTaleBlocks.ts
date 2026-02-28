import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import yaml from "js-yaml"
import fs from "fs"
import path from "path"

// 定义可配置的选项，允许用户传入数据库路径
interface Options {
  dbPath?: string
}

export const FinalTaleBlocks: QuartzTransformerPlugin<Options> = (userOpts) => {
  // 1. 在插件初始化时，尝试加载 JSON 数据库
  let db: any = { spells: {}, traits: {} }
  try {
    // 默认路径假设数据文件放在 content 根目录
    const targetPath = userOpts?.dbPath || "content/World_data.json"
    const resolvedPath = path.resolve(process.cwd(), targetPath)
    
    if (fs.existsSync(resolvedPath)) {
      db = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"))
      db.spells = db.spells || {}
      db.traits = db.traits || {}
    } else {
      console.warn(`[FinalTaleBlocks] 警告: 未找到数据库文件 ${resolvedPath}`)
    }
  } catch (e) {
    console.error("[FinalTaleBlocks] 解析数据库失败:", e)
  }

  return {
    name: "FinalTaleBlocks",
    markdownPlugins() {
      return [
        () => {
          return (tree, file) => {
            // 2. 遍历 AST，寻找特定语言的代码块
            visit(tree, "code", (node, index, parent) => {
              if (node.lang === "spell" || node.lang === "ability") {
                try {
                  // 解析代码块内的 YAML
                  const overrides = (yaml.load(node.value) || {}) as any
                  const type = node.lang
                  
                  // 寻找原型数据
                  const lookupKey = overrides.template || overrides.id || overrides.name || ""
                  const category = type === "spell" ? db.spells : db.traits
                  let baseData = category[lookupKey]

                  if (!baseData && lookupKey) {
                    const lowerKey = String(lookupKey).toLowerCase()
                    const foundKey = Object.keys(category).find(k => 
                        k.toLowerCase() === lowerKey || 
                        (category[k].name && category[k].name === lookupKey)
                    )
                    if (foundKey) baseData = category[foundKey]
                  }

                  baseData = baseData || {}
                  const finalData = Object.assign({}, baseData, overrides)
                  const displayName = overrides.name || baseData.name || lookupKey || (type === "spell" ? "自定义法术" : "自定义能力")
                  
                  // 处理描述，并进行简易的 Markdown 渲染 (加粗、高亮、换行)
                  let rawDesc = finalData.desc || "*（暂无描述）*"
                  let descHtml = rawDesc
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 处理加粗 **文本**
                    .replace(/==(.*?)==/g, '<mark>$1</mark>')         // 处理高亮 ==文本==
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')             // 处理斜体 *文本*
                    .replace(/\n/g, '<br/>')                          // 处理换行符

                  let html = ""

                  // 3. 构建对应的 HTML 结构
                  if (type === "spell") {
                    html = `
                    <div class="fv-callout fv-spell">
                        <div class="fv-header">
                            <span class="fv-title">${displayName}</span>
                            <span class="fv-cost">${finalData.cost || ""}</span>
                        </div>
                        <div class="fv-meta">
                            ${finalData.target ? `<span><b>目标:</b> ${finalData.target}</span>` : ""}
                            ${finalData.duration ? `<span><b>持续:</b> ${finalData.duration}</span>` : ""}
                            ${finalData.check ? `<span><b>检定:</b> ${finalData.check}</span>` : ""}
                        </div>
                        <div class="fv-desc">${descHtml}</div>
                    </div>`
                  } else {
                    html = `
                    <div class="fv-trait-card">
                        <div class="fv-trait-badge">等级 ${finalData.currentlevel || 0} / ${finalData.maxlevel || 0}</div>
                        <div class="fv-trait-header">
                            <div class="fv-trait-title-row">
                                <div class="fv-trait-icon"></div>
                                <span class="fv-trait-title">${displayName}</span>
                            </div>
                            <div class="fv-trait-class">${finalData.class || "能力"}</div>
                        </div>
                        <div class="fv-trait-body">
                            <p>${descHtml}</p>
                        </div>
                    </div>`
                  }

                  // 4. 将原本的 Markdown 节点替换为 HTML 节点
                  if (parent && typeof index === "number") {
                    parent.children[index] = {
                      type: "html",
                      value: html,
                    } as any
                  }

                } catch (e) {
                  console.error(`[FinalTaleBlocks] 解析 ${node.lang} 失败:`, e)
                }
              }
            })
          }
        },
      ]
    },
  }
}