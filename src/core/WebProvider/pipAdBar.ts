/**
 * Doc PiP 窗口内的「伪装外壳」
 *
 * 用途说明（重要）：
 *   这个模块不是为了投放真实广告 / 变现，而是把画中画窗口**伪装成一个
 *   普通的「广告弹窗」外观**——顶部一条绿色栏目头 + ✕，底部一条带「广告」
 *   角标的信息卡片。纯静态、纯视觉，任何点击都是死链接（不绑定任何事件），
 *   ✕ 也不产生任何行为。因此不触及 dmMiniPlayer 的 CC BY-NC 许可中的
 *   「商业使用 / 广告投放」边界，属于个人非商业用途。
 *
 * 技术背景：
 *   Document Picture-in-Picture 开出来的小窗是一个**真实的 Document**，
 *   主页面上的 CSS（Less / Tailwind）不会带过来。所以这里全部用内联样式 +
 *   一份自注入的 <style>，不依赖项目的样式管线，也不受主页面样式污染。
 *
 * 布局（挂在 PiP document.body 上，三段正常流，互不重叠）：
 *   [ 顶部绿色栏目头 48px ]
 *   [ 播放器容器（调用方把高度设为 calc(100% - 总预留) ）]
 *   [ 底部白底卡片条 196px ]
 *
 * 用法（在 DocPIPWebProvider.onOpenPlayer 里）：
 *   const frame = mountPipDisguiseFrame(pipWindow.document, {
 *     topTitle: '今日优选',
 *     topSub: '精选 精彩视频 · 更多详情点击进入',
 *     items: DEFAULT_PIP_DISGUISE_ITEMS,
 *   })
 *   // 调用方需同步：playerEl.style.height = `calc(100% - ${AD_FRAME_TOTAL}px)`
 */

/** 单条伪装卡片数据（纯静态展示，不参与任何跳转） */
export interface PipDisguiseItem {
  id?: string
  /** 主标题，最多两行 */
  title: string
  /** 缩略图地址；留空则渲染成纯文字卡片 */
  cover?: string
  /** 角标，如「广告」「奥运图集」 */
  tag?: string
}

export interface PipDisguiseFrameOptions {
  /** 顶部栏目名，默认「今日优选」 */
  topTitle?: string
  /** 顶部副标题（可为空） */
  topSub?: string
  /** 卡片列表（静态） */
  items: PipDisguiseItem[]
  /**
   * 外壳显隐变化回调。调用方据此同步：
   *  - 播放器容器高度（显示时让位，收起时铺满）
   *  - 弹幕 canvas 的 top 偏移（显示时 = AD_FRAME_TOP，收起时 = 0）
   */
  onVisibilityChange?: (shown: boolean) => void
}

/** 顶部绿色栏目头高度（加高、更显眼） */
export const AD_FRAME_TOP = 48
/** 底部卡片条高度（竖向 3 张卡：3×56 + 2×6 + 上下内边距 16） */
export const AD_BAR_BOTTOM = 196
/** 上下两段合计预留高度（调用方据此给播放器让位） */
export const AD_FRAME_TOTAL = AD_FRAME_TOP + AD_BAR_BOTTOM

/**
 * 伪装外壳的顶部文案，集中在此管理。
 *
 * 目前提供中文一套。之所以没有走 i18n（`src/locales-ext/*`）而在此硬编码：
 * 伪装外壳刻意使用「国内广告弹窗」的固定话术（今日优选 / 广告徽标），
 * 这本身就是伪装效果的一部分——译成英文反而会破坏它要模拟的那种观感。
 * 因此这里与「扩展本身的界面语言」刻意解耦：用户在英文界面下打开小窗，
 * 看到的仍是一副中文广告弹窗的样子。
 *
 * 若后续要接入多语言，把这里改为读取 i18n 即可，调用方无需改动。
 */
export const PIP_DISGUISE_CONTENT = {
  /** 顶部栏目标题 */
  topTitle: '今日优选',
  /** 顶部栏副标题 */
  topSub: '精选 精彩视频 · 更多详情点击进入',
} as const

const STYLE_ID = 'docpip-frame-style'

const CSS = `
#docpip-frame-top{height:${AD_FRAME_TOP}px;flex:0 0 ${AD_FRAME_TOP}px;display:flex;align-items:center;
  gap:10px;padding:0 12px;background:linear-gradient(180deg,#38bd5e,#2fa84f);color:#fff;
  box-sizing:border-box;overflow:hidden;
  /* 提高层级：弹幕 canvas 为 position:fixed;z-index:10，这里确保外壳永远压在其上 */
  position:relative;z-index:20;
  font:12px/1.2 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;}
#docpip-frame-top *{box-sizing:border-box;}
#docpip-frame-badge{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;
  height:20px;padding:0 7px;border-radius:4px;background:#fff;color:#2fa84f;
  font-size:11px;font-weight:700;letter-spacing:.5px;line-height:1;}
#docpip-frame-title{font-weight:700;font-size:15px;letter-spacing:.5px;white-space:nowrap;}
#docpip-frame-sub{font-size:11px;opacity:.92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
/* ✕ 纯装饰：保留手型让它"看起来能点"，但不绑任何事件，点了无反应 */
#docpip-frame-close{margin-left:auto;width:22px;height:22px;flex:0 0 22px;border:0;border-radius:4px;
  display:inline-flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,.18);color:#fff;font-size:13px;line-height:1;cursor:pointer;padding:0;user-select:none;}
#docpip-frame-bottom{height:${AD_BAR_BOTTOM}px;flex:0 0 ${AD_BAR_BOTTOM}px;display:flex;flex-direction:column;
  background:#fff;color:#1a1a1a;box-sizing:border-box;overflow:hidden;
  /* 同上：确保卡片条不被弹幕 canvas 覆盖 */
  position:relative;z-index:20;
  font:12px/1.4 system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;}
#docpip-frame-bottom *{box-sizing:border-box;}
/* 竖向排列：一列三张，超出可滚动 */
#docpip-frame-list{flex:1 1 auto;display:flex;flex-direction:column;gap:6px;padding:8px;
  overflow-y:auto;overflow-x:hidden;scrollbar-width:none;}
#docpip-frame-list::-webkit-scrollbar{display:none;}
/* 卡片：cursor:pointer 仅作伪装，不绑定事件 → 点击无任何反应 */
.docpip-frame-card{flex:0 0 auto;display:flex;gap:8px;width:100%;height:56px;padding:4px;
  border-radius:6px;background:#f5f6f7;cursor:pointer;overflow:hidden;}
.docpip-frame-cover{width:48px;height:48px;flex:0 0 48px;border-radius:4px;object-fit:cover;background:#dfe3e8;}
.docpip-frame-body{display:flex;flex-direction:column;justify-content:center;gap:2px;min-width:0;flex:1 1 auto;}
.docpip-frame-name{font-size:12px;font-weight:600;line-height:1.25;color:#1a1a1a;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.docpip-frame-tag{align-self:flex-start;font-size:10px;line-height:1.4;padding:0 4px;
  border-radius:3px;background:#e8f5ec;color:#2fa84f;white-space:nowrap;}
`

/** 生成一张不依赖网络的占位封面（data URI），保证离线也能看到效果 */
function placeholderCover(text: string, color: string) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">` +
    `<rect width="96" height="96" fill="${color}"/>` +
    `<text x="48" y="60" font-size="34" text-anchor="middle" fill="#fff" ` +
    `font-family="system-ui,sans-serif">${text}</text></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** 默认静态伪装内容：纯展示，不参与任何跳转 */
export const DEFAULT_PIP_DISGUISE_ITEMS: PipDisguiseItem[] = [
  {
    id: 'demo-1',
    title: '古装新剧定档 主演阵容曝光引热议',
    tag: '娱乐',
    cover: placeholderCover('剧', '#e84393'),
  },
  {
    id: 'demo-2',
    title: '歌手巡演官宣 首站门票被抢空',
    tag: '演出',
    cover: placeholderCover('星', '#e17055'),
  },
  {
    id: 'demo-3',
    title: '秋季新款女装上新 全场满 299 减 50',
    tag: '广告',
    cover: placeholderCover('新', '#8e44ad'),
  },
]

function renderCards(container: HTMLElement, items: PipDisguiseItem[]) {
  const doc = container.ownerDocument
  for (const item of items) {
    const card = doc.createElement('div')
    card.className = 'docpip-frame-card'
    card.title = item.title

    if (item.cover) {
      const img = doc.createElement('img')
      img.className = 'docpip-frame-cover'
      img.src = item.cover
      img.alt = ''
      img.decoding = 'async'
      card.appendChild(img)
    }

    const body = doc.createElement('div')
    body.className = 'docpip-frame-body'

    const name = doc.createElement('div')
    name.className = 'docpip-frame-name'
    name.textContent = item.title // textContent，避免文案里的标签被当 HTML 执行
    body.appendChild(name)

    if (item.tag) {
      const tag = doc.createElement('span')
      tag.className = 'docpip-frame-tag'
      tag.textContent = item.tag
      body.appendChild(tag)
    }

    card.appendChild(body)
    // 注意：这里**不绑定任何 click 事件**——伪装外壳，点击无任何反应
    container.appendChild(card)
  }
}

/**
 * 在 PiP document 上挂载「伪装外壳」：顶部绿色栏目头 + 底部白底卡片条，
 * 中间由调用方插入播放器容器。全部静态、不可交互。
 */
export function mountPipDisguiseFrame(doc: Document, options: PipDisguiseFrameOptions) {
  const { topTitle = '今日优选', topSub = '', items, onVisibilityChange } = options

  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    doc.head?.appendChild(style)
  }

  // ---- 顶部绿色栏目头（含装饰性 ✕）----
  const top = doc.createElement('div')
  top.id = 'docpip-frame-top'
  // 伪装内容对读屏软件隐藏，避免把虚构新闻/促销当真实信息播报
  top.setAttribute('aria-hidden', 'true')
  top.setAttribute('role', 'presentation')

  // 白色「广告」徽标：让顶部更像真实广告弹窗的栏头
  const badge = doc.createElement('span')
  badge.id = 'docpip-frame-badge'
  badge.textContent = '广告'
  top.appendChild(badge)

  const titleEl = doc.createElement('span')
  titleEl.id = 'docpip-frame-title'
  titleEl.textContent = topTitle
  top.appendChild(titleEl)

  if (topSub) {
    const subEl = doc.createElement('span')
    subEl.id = 'docpip-frame-sub'
    subEl.textContent = topSub
    top.appendChild(subEl)
  }

  const closeBtn = doc.createElement('span') // span 而非 button：刻意不参与表单/键盘语义
  closeBtn.id = 'docpip-frame-close'
  closeBtn.textContent = '✕'
  closeBtn.title = ''
  // 不绑定事件：这个 ✕ 是装饰，点了不会关闭、不会收起、不会有任何调整
  top.appendChild(closeBtn)

  // ---- 底部白底卡片条 ----
  const bottom = doc.createElement('div')
  bottom.id = 'docpip-frame-bottom'
  bottom.setAttribute('aria-hidden', 'true')
  bottom.setAttribute('role', 'presentation')

  const list = doc.createElement('div')
  list.id = 'docpip-frame-list'
  renderCards(list, items)
  bottom.appendChild(list)

  doc.body.insertBefore(top, doc.body.firstChild) // 顶部头插到最前
  doc.body.appendChild(bottom) // 底部条追加到最后（播放器在二者之间）

  // 窗口被拖得太矮时，整个伪装外壳收起，让视频铺满（避免视频区被挤没）
  const onResize = () => {
    // 顶部 48 + 底部 196 = 244，留出至少约 160px 视频高度，低于此收起外壳
    const tooShort = doc.documentElement.clientHeight < 404
    const shown = !tooShort
    top.style.display = tooShort ? 'none' : 'flex'
    bottom.style.display = tooShort ? 'none' : 'flex'
    onVisibilityChange?.(shown)
  }
  doc.defaultView?.addEventListener('resize', onResize)
  onResize()

  return {
    topEl: top,
    bottomEl: bottom,
    destroy() {
      doc.defaultView?.removeEventListener('resize', onResize)
      top.remove()
      bottom.remove()
    },
  }
}
