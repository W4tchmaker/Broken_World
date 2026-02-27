import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import yaml from "js-yaml"

export const FantasyStatblocks: QuartzTransformerPlugin = () => {
  return {
    name: "FantasyStatblocks",
    markdownPlugins() {
      return [
        () => {
          return (tree, file) => {
            visit(tree, "code", (node, index, parent) => {
              if (node.lang === "statblock") {
                try {
                  // 解析 YAML 数据
                  const data = yaml.load(node.value) as any;
                  
                  // 计算危机值 (Crisis)
                  const hp = data.hp || 0;
                  const crisis = data.crisis || Math.floor(hp / 2);

                  let imgSrc = "";
                  if (data.image) {
                    let rawImage = "";
                    
                    if (typeof data.image === "string") {
                      rawImage = data.image; 
                    } else if (Array.isArray(data.image)) {
                      rawImage = String(data.image.flat(Infinity)[0] || "");
                    } else {
                      rawImage = String(data.image);
                    }

                    imgSrc = rawImage.replace(/^\[\[(.*?)\]\]$/, "$1").trim();
                    
                    if (imgSrc && !imgSrc.includes("/")) {
                      imgSrc = `/附件/${imgSrc}`; 
                    } else if (imgSrc && !imgSrc.startsWith("/") && !imgSrc.startsWith("http")) {
                      imgSrc = `/${imgSrc}`;
                    }
                  }

                  // 构建最终物语专属的 HTML 结构
                  const html = `
<div class="statblock statblock-content-container">
  <div class="statblock-content">
    <div class="column">
      
      <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.5rem;">

        <div style="flex-grow: 1;">
          <div class="heading">
            <h1 class="statblock-heading">${data.name || "未命名"}</h1>
          </div>
          <p class="subheading">${data.level || ""} ◆ ${data.species || ""}</p>
        </div>

        ${imgSrc ? `
        <div style="flex-shrink: 0;">
          <img src="${imgSrc}" width="auto" height="auto" style="max-width: 80px; max-height: 80px; object-fit: cover; border: 2px solid var(--statblock-primary-color); border-radius: 4px;margin: 0;" alt="">
        </div>
        ` : ""}
        
      </div>
      <div class="tapered-rule"></div>

      ${data.description ? `<p class="line">${data.description}</p>` : ""}
      ${data.typical_traits ? `<div class="line"><p class="property-name">典型特质</p> <p class="property-text">${data.typical_traits}</p></div><div class="tapered-rule"></div>` : ""}

      <div class="statblock-table">
        <div class="table-item"><span class="statblock-table-header">敏捷</span><span>${data.dex || "d6"}</span></div>
        <div class="table-item"><span class="statblock-table-header">洞察</span><span>${data.ins || "d6"}</span></div>
        <div class="table-item"><span class="statblock-table-header">力量</span><span>${data.mig || "d6"}</span></div>
        <div class="table-item"><span class="statblock-table-header">意志</span><span>${data.wlp || "d6"}</span></div>
      </div>
      <div class="tapered-rule"></div>

      <div class="statblock-item-inline">
        <div class="line"><p class="property-name">HP</p> <p class="property-text">${hp} ◆ <span style="color:red">${crisis}</span></p></div>
        <div class="line"><p class="property-name">MP</p> <p class="property-text" style="color:#00bfff">${data.mp || 0}</p></div>
        <div class="line"><p class="property-name">先攻</p> <p class="property-text">${data.initiative || 0}</p></div>
      </div>
      <div class="tapered-rule"></div>

      <div class="statblock-item-inline">
        ${data.def ? `<div class="line"><p class="property-name">物防</p> ${data.def}</div>` : ""}
        ${data.mdef ? `<div class="line"><p class="property-name">魔防</p> ${data.mdef}</div>` : ""}
        ${data.vulnerable ? `<div class="line"><p class="property-name">弱点</p> ${data.vulnerable}</div>` : ""}
        ${data.resistant ? `<div class="line"><p class="property-name">抗性</p> ${data.resistant}</div>` : ""}
        ${data.immune ? `<div class="line"><p class="property-name">免疫</p> ${data.immune}</div>` : ""}
        ${data.absorb ? `<div class="line"><p class="property-name">吸收</p> ${data.absorb}</div>` : ""}
      </div>
      <div class="tapered-rule"></div>

      ${renderTraitsList("基础攻击", data.basic_attacks)}
      ${renderTraitsList("魔法", data.spells)}
      ${renderTraitsList("特性规则", data.special_rules)}

    </div>
  </div>
</div>`;
                  // 替换 Markdown 节点为生成的 HTML 节点
                  parent.children[index] = {
                    type: "html",
                    value: html,
                  }
                } catch (e) {
                  console.error("解析 statblock 失败:", e)
                }
              }
            })
          }
        },
      ]
    },
  }
}

// 辅助函数：渲染攻击、法术、特性列表
function renderTraitsList(heading: string, traits: any[]) {
  if (!traits || traits.length === 0) return "";
  let listHtml = `<h2 class="section-header">${heading}</h2>`;
  traits.forEach(t => {
    // 简单处理 Markdown 加粗 (将 **text** 替换为 <strong>text</strong>)
    const desc = (t.desc || "").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    listHtml += `
      <div class="trait">
        <span class="trait-name">${t.name}</span> 
        <span>${desc}</span>
      </div>`;
  });
  return listHtml;
}