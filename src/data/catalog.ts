export type ToolCategoryId = 'files' | 'ai-api' | 'developer' | 'data'
export type ToolStatus = 'available' | 'preview'

export interface ToolCategory {
  id: ToolCategoryId
  name: string
  symbol: string
  description: string
  examples: readonly string[]
  accent: string
  softAccent: string
}

export interface ToolDefinition {
  id: string
  name: string
  summary: string
  categoryId: ToolCategoryId
  path: `/${string}/`
  status: ToolStatus
}

export const toolCategories: readonly ToolCategory[] = [
  {
    id: 'files',
    name: '文件处理',
    symbol: 'FL',
    description: '围绕文件读取、转换、拆分、合并与内容提取等常见操作组织独立应用。',
    examples: ['格式转换', '内容提取', '拆分合并'],
    accent: '#67e8f9',
    softAccent: 'rgba(34, 211, 238, 0.16)',
  },
  {
    id: 'ai-api',
    name: 'AI 与 API',
    symbol: 'AI',
    description: '用于接口连通性、参数配置、请求调试和响应结果观察等测试场景。',
    examples: ['接口测试', '参数调试', '响应查看'],
    accent: '#c4b5fd',
    softAccent: 'rgba(139, 92, 246, 0.16)',
  },
  {
    id: 'developer',
    name: '开发调试',
    symbol: 'DV',
    description: '收录编码转换、文本检查、格式化和前端开发过程中反复使用的小工具。',
    examples: ['编码转换', '文本检查', '格式化'],
    accent: '#86efac',
    softAccent: 'rgba(34, 197, 94, 0.14)',
  },
  {
    id: 'data',
    name: '数据处理',
    symbol: 'DT',
    description: '面向结构化数据的清洗、比较、转换和结果预览等轻量处理需求。',
    examples: ['数据转换', '差异比较', '结果预览'],
    accent: '#fda4af',
    softAccent: 'rgba(244, 63, 94, 0.14)',
  },
]

// 只有实际页面可访问时才在这里登记工具，避免首页产生失效链接。
export const tools: readonly ToolDefinition[] = []
