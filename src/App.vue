<script setup lang="ts">
import { toolCategories, tools, type ToolCategoryId } from './data/catalog'

const repositoryUrl = 'https://github.com/cnxzq/ai-tools-web'
const publishedTools = tools.filter((tool) => tool.status === 'available')

function toolsForCategory(categoryId: ToolCategoryId) {
  return tools.filter((tool) => tool.categoryId === categoryId)
}
</script>

<template>
  <a
    href="#main-content"
    class="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg transition-transform focus:translate-y-0"
  >
    跳到主要内容
  </a>

  <div class="min-h-screen overflow-hidden bg-[#080d1a] text-slate-200">
    <div class="pointer-events-none fixed inset-0 opacity-80" aria-hidden="true">
      <div class="absolute left-[-8rem] top-[-12rem] h-96 w-96 rounded-full bg-cyan-400/12 blur-3xl"></div>
      <div class="absolute right-[-10rem] top-32 h-[30rem] w-[30rem] rounded-full bg-violet-500/12 blur-3xl"></div>
    </div>

    <header class="relative z-10 border-b border-white/8">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" class="group flex items-center gap-3 text-white no-underline" aria-label="ZQZYZ 在线工具箱首页">
          <span
            class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-500 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/15 transition-transform group-hover:-rotate-3 group-hover:scale-105"
            aria-hidden="true"
          >ZT</span>
          <span>
            <strong class="block text-sm tracking-[0.12em]">ZQZYZ TOOLS</strong>
            <span class="block text-xs text-slate-500">Web 在线工具箱</span>
          </span>
        </a>

        <nav aria-label="主要导航" class="flex items-center gap-2 sm:gap-5">
          <a href="#categories" class="hidden text-sm text-slate-400 no-underline transition-colors hover:text-white sm:block">工具分类</a>
          <a href="#principles" class="hidden text-sm text-slate-400 no-underline transition-colors hover:text-white sm:block">收录原则</a>
          <a
            :href="repositoryUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 no-underline transition-colors hover:border-cyan-300/40 hover:bg-cyan-300/8 hover:text-white"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>

    <main id="main-content" class="relative z-10">
      <section class="mx-auto max-w-6xl px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
        <div class="max-w-4xl">
          <p class="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            <span class="h-px w-8 bg-cyan-300/70" aria-hidden="true"></span>
            Web utilities · 持续整理
          </p>
          <h1 class="m-0 text-balance text-5xl font-black leading-[1.08] tracking-[-0.045em] text-white sm:text-7xl lg:text-[5.5rem]">
            把常用操作，<br />放回浏览器里完成
          </h1>
          <p class="mt-8 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
            ZQZYZ 在线工具箱是一个 Web 静态应用集合，面向文件处理、AI API 测试、开发调试与数据处理等日常场景。
          </p>

          <div class="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#categories"
              class="rounded-full bg-cyan-300 px-6 py-3 text-sm font-bold text-slate-950 no-underline transition hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
            >
              浏览工具分类
            </a>
            <span class="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-400">
              {{ publishedTools.length > 0 ? `已上线 ${publishedTools.length} 个工具` : '首批工具整理中' }}
            </span>
          </div>
        </div>

        <div class="mt-18 grid gap-3 border-t border-white/8 pt-7 text-sm text-slate-500 sm:grid-cols-3">
          <p class="m-0"><span class="mr-2 text-cyan-300">01</span>静态部署，直接访问</p>
          <p class="m-0"><span class="mr-2 text-cyan-300">02</span>按使用场景分类</p>
          <p class="m-0"><span class="mr-2 text-cyan-300">03</span>独立应用，持续增加</p>
        </div>
      </section>

      <section id="categories" class="border-y border-white/8 bg-white/[0.018] scroll-mt-20">
        <div class="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div class="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Catalog</p>
              <h2 class="m-0 text-3xl font-bold tracking-tight text-white sm:text-4xl">按场景找到合适的工具</h2>
            </div>
            <p class="m-0 max-w-md text-sm leading-6 text-slate-500">
              当前先建立清晰的分类边界；只有具备实际可访问页面的应用才会显示为已上线工具。
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <article
              v-for="(category, index) in toolCategories"
              :id="`category-${category.id}`"
              :key="category.id"
              class="category-card group relative overflow-hidden rounded-2xl border border-white/9 bg-[#0d1425]/80 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/18 sm:p-8"
              :style="{ '--category-accent': category.accent, '--category-soft': category.softAccent }"
            >
              <div class="mb-10 flex items-start justify-between">
                <span class="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 font-mono text-sm font-bold text-white">
                  {{ category.symbol }}
                </span>
                <span class="font-mono text-xs text-slate-600">0{{ index + 1 }}</span>
              </div>

              <h3 class="m-0 text-2xl font-bold text-white">{{ category.name }}</h3>
              <p class="mt-3 max-w-lg text-sm leading-6 text-slate-400">{{ category.description }}</p>

              <ul class="mt-6 flex list-none flex-wrap gap-2 p-0" :aria-label="`${category.name}包含的典型场景`">
                <li
                  v-for="example in category.examples"
                  :key="example"
                  class="rounded-full border border-white/8 bg-white/[0.025] px-3 py-1.5 text-xs text-slate-500"
                >
                  {{ example }}
                </li>
              </ul>

              <div v-if="toolsForCategory(category.id).length" class="mt-7 grid gap-2">
                <a
                  v-for="tool in toolsForCategory(category.id)"
                  :key="tool.id"
                  :href="tool.path"
                  class="rounded-xl border border-white/8 px-4 py-3 text-sm font-medium text-white no-underline transition-colors hover:bg-white/5"
                >
                  {{ tool.name }}
                </a>
              </div>
              <p v-else class="mb-0 mt-7 border-t border-white/8 pt-5 text-xs font-medium text-slate-600">
                工具接入中 · 暂无空白详情页
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="principles" class="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24">
        <div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p class="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Principles</p>
            <h2 class="m-0 text-3xl font-bold tracking-tight text-white sm:text-4xl">清楚、独立、可持续</h2>
            <p class="mt-5 text-sm leading-7 text-slate-500">
              这个仓库不限定某一种技术或主题，重点是让每个 Web 应用都有明确用途、稳定入口和可理解的使用边界。
            </p>
          </div>

          <ol class="m-0 grid list-none gap-3 p-0">
            <li class="flex gap-5 rounded-2xl border border-white/8 bg-white/[0.018] p-6">
              <span class="font-mono text-sm text-cyan-300">01</span>
              <div>
                <h3 class="m-0 text-base font-semibold text-white">真实可用再上线</h3>
                <p class="mb-0 mt-2 text-sm leading-6 text-slate-500">不为尚不存在的工具生成可索引详情页，避免失效入口和空洞内容。</p>
              </div>
            </li>
            <li class="flex gap-5 rounded-2xl border border-white/8 bg-white/[0.018] p-6">
              <span class="font-mono text-sm text-cyan-300">02</span>
              <div>
                <h3 class="m-0 text-base font-semibold text-white">每个工具独立表达</h3>
                <p class="mb-0 mt-2 text-sm leading-6 text-slate-500">上线后拥有独立地址、功能说明、输入输出边界和相关工具导航。</p>
              </div>
            </li>
            <li class="flex gap-5 rounded-2xl border border-white/8 bg-white/[0.018] p-6">
              <span class="font-mono text-sm text-cyan-300">03</span>
              <div>
                <h3 class="m-0 text-base font-semibold text-white">分类服务于使用场景</h3>
                <p class="mb-0 mt-2 text-sm leading-6 text-slate-500">文件、API、开发和数据只是当前入口，后续可以按真实应用继续扩展。</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </main>

    <footer class="relative z-10 border-t border-white/8">
      <div class="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p class="m-0">© {{ new Date().getFullYear() }} ZQZYZ Tools</p>
        <p class="m-0">工具能力与数据处理方式以各应用页面说明为准</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.category-card::before {
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--category-accent), transparent);
  content: '';
  opacity: 0.55;
}

.category-card::after {
  position: absolute;
  top: -5rem;
  right: -5rem;
  width: 12rem;
  height: 12rem;
  border-radius: 9999px;
  background: var(--category-soft);
  filter: blur(36px);
  content: '';
  opacity: 0.7;
  pointer-events: none;
}
</style>
