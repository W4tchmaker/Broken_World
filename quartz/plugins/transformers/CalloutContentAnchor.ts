import { QuartzTransformerPlugin } from "../types"
import { visit } from "unist-util-visit"
import { Node, Parent } from "unist"

// 扩展 Node 类型以适配 Remark AST 属性
interface DataNode extends Node {
  data?: {
    id?: string
    [key: string]: any
  }
  children?: DataNode[]
}

export const CalloutContentAnchor: QuartzTransformerPlugin = () => {
  return {
    name: "CalloutContentAnchor",
    markdownPlugins() {
      return [
        () => {
          return (tree: Parent) => {
            // 定义你需要“剥离外壳”的 Callout 类型
            // 比如 'ability', 'skill', 'item' 等
            const TARGET_CALLOUTS = ["ability", "char-skill"]

            visit(tree, "blockquote", (node: DataNode) => {
              const calloutType = node.data?.["data-callout"]
              if (calloutType && TARGET_CALLOUTS.includes(calloutType) && node.data?.id) {
                // 不删除 ID，不移动节点
                // 只添加一个标记类名
                node.data.hProperties = {
                  ...(node.data.hProperties as any),
                  "data-unwrap": "true"
                }
              }
            })
          }
        },
      ]
    },
  }
}