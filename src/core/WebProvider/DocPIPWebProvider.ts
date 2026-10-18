import configStore, { videoBorderType } from '@root/store/config'
import { createElement } from '@root/utils'
import {
  getBrowserSyncStorage,
  setBrowserSyncStorage,
} from '@root/utils/storage'
import { WebProvider } from '.'
import { PlayerEvent } from '../event'
import { HtmlVideoPlayer } from '../VideoPlayer/HtmlVideoPlayer'
import { PIP_WINDOW_CONFIG } from '@root/shared/storeKey'
import {
  AD_FRAME_TOP,
  AD_FRAME_TOTAL,
  DEFAULT_PIP_DISGUISE_ITEMS,
  PIP_DISGUISE_CONTENT,
  mountPipDisguiseFrame,
} from './pipAdBar'

/**
 * 首次打开小窗的默认宽度（px）。
 * 值越小越像「屏幕右下角的小弹窗」；高度会按视频宽高比自动推算，
 * 用户把窗口拖大/拖小后会被记住（见 PIP_WINDOW_CONFIG）。
 */
const DEFAULT_PIP_WIDTH = 400

/**
 * 小窗尺寸存储的版本号。
 * v3：默认宽度改为 400（更像屏幕右下角的小弹窗）。
 * 版本号不匹配的旧尺寸一律忽略，让新的默认值生效；用户手动拖拽后才会重新记录。
 */
const PIP_WINDOW_CONFIG_VERSION = 3

export default class DocPIPWebProvider extends WebProvider {
  declare miniPlayer: HtmlVideoPlayer
  protected MiniPlayer = HtmlVideoPlayer

  pipWindow?: Window

  /**
   * 画中画内的伪装外壳（顶部栏目头 + 底部卡片条）。纯静态展示，不参与跳转。
   */
  private frame?: ReturnType<typeof mountPipDisguiseFrame>

  async onOpenPlayer() {
    // 获取应该有的docPIP宽高
    const rawPipWindowConfig = await getBrowserSyncStorage(PIP_WINDOW_CONFIG)

    // cw / ch = vw / vh
    const vw = this.webVideo.videoWidth,
      vh = this.webVideo.videoHeight

    // 只认「用户手动拖拽过」留下的尺寸（带当前版本号）。
    // 旧版本把页面里的视频尺寸直接当成小窗尺寸存下来，会导致每次都开出一个大窗，
    // 这里靠版本号把它丢弃，回到下面的默认小窗尺寸。
    const pipWindowConfig =
      rawPipWindowConfig?.v === PIP_WINDOW_CONFIG_VERSION
        ? rawPipWindowConfig
        : undefined

    // 默认宽度：更像「屏幕右下角的小弹窗」，同时不超过页面内视频本身的宽度
    const defaultWidth = Math.min(
      DEFAULT_PIP_WIDTH,
      this.webVideo.clientWidth || DEFAULT_PIP_WIDTH
    )

    let width = pipWindowConfig?.width ?? defaultWidth

    // 存储里记的是「整个小窗」的高度（含伪装外壳），这里换算成「视频区」高度；
    // 没有存储时按视频宽高比从宽度推算，保证默认小窗不变形
    let height = pipWindowConfig?.height
      ? Math.max(160, pipWindowConfig.height - AD_FRAME_TOTAL)
      : vw && vh
        ? (width * vh) / vw
        : this.webVideo.clientHeight

    console.log('pipWindowConfig', rawPipWindowConfig, { width, height })

    switch (configStore.videoNoBorder) {
      // cw = vw / vh * ch
      case videoBorderType.height: {
        width = (vw / vh) * height
        break
      }
      // ch = vh / vw * cw
      case videoBorderType.width: {
        height = (vh / vw) * width
        break
      }
    }

    await this.miniPlayer.init()
    const playerEl = this.miniPlayer.playerRootEl
    if (!playerEl) {
      console.error('不正常的miniPlayer.init()，没有 playerEl', this.miniPlayer)
      throw Error('不正常的miniPlayer.init()')
    }

    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width,
      // 小窗总高 = 视频区 + 伪装外壳（顶部头 + 底部条）
      height: height + AD_FRAME_TOTAL,
    })
    this.pipWindow = pipWindow

    // 只有用户真的手动拖拽过尺寸才记住它。
    // 否则「默认小窗尺寸」会被当成用户偏好存下来，之后想调默认值也调不动了。
    let userResized = false
    const requestedWidth = width
    const requestedHeight = height + AD_FRAME_TOTAL

    // 挂载事件
    pipWindow.addEventListener('pagehide', () => {
      this.frame?.destroy()
      this.emit(PlayerEvent.close)
      if (userResized) {
        setBrowserSyncStorage(PIP_WINDOW_CONFIG, {
          height: pipWindow.innerHeight,
          width: pipWindow.innerWidth,
          v: PIP_WINDOW_CONFIG_VERSION,
        })
      }
    })
    pipWindow.addEventListener('resize', () => {
      // 打开瞬间浏览器会按请求尺寸布局并触发一次 resize，差值在 4px 内不算用户操作
      if (
        Math.abs(pipWindow.innerWidth - requestedWidth) > 4 ||
        Math.abs(pipWindow.innerHeight - requestedHeight) > 4
      ) {
        userResized = true
      }
      this.emit(PlayerEvent.resize)
    })

    this.on(PlayerEvent.close, () => {
      try {
        pipWindow.close()
      } catch (error) {}
    })

    pipWindow.document.body.appendChild(playerEl)

    // ★ 让出伪装外壳空间：视频区占中间剩余高度（inline style 优先级高于 h-full）
    playerEl.style.height = `calc(100% - ${AD_FRAME_TOTAL}px)`
    playerEl.style.overflow = 'hidden'
    // ★ 关键：playerEl 本身没有定位上下文，而弹幕容器是 position:absolute;top:0，
    //   没有定位祖先时它会锚定到视口顶部，导致弹幕越过顶部绿条从 0 开始。
    //   设为 relative 后，弹幕容器才会以播放器（绿条下方）为基准。
    playerEl.style.position = 'relative'

    // 弹幕 canvas 是 position:fixed 提到视口顶部的，顶部栏目头占 48px，
    // 必须把 canvas 顶边同步下移，否则弹幕会压到绿色栏目头上。
    pipWindow.document.documentElement.style.setProperty(
      '--docpip-canvas-top',
      `${AD_FRAME_TOP}px`
    )

    // docPIP有自带的样式，需要覆盖掉
    const docPIPRootStyle = createElement('style', {
      innerHTML: `html,body{
  height: 100%;
  overflow: hidden;
}
body{
  margin: 0;
  background-color: #000;
}
video{
  width: 100%;
  height: 100%;
}
canvas{
  position: fixed;
  top: var(--docpip-canvas-top, 0px);
  left: 0;
  z-index: 10;
  width: 100%;
  pointer-events: none;
}`,
    })
    playerEl.appendChild(docPIPRootStyle)

    // 弹幕器相关
    if (this.danmakuEngine) {
      const danmakuContainer = createElement('div', {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          pointerEvents: 'none',
        },
      })
      playerEl.appendChild(danmakuContainer)
      this.danmakuEngine.init({
        media: this.webVideo,
        container: danmakuContainer,
      })
    }

    // ★ 画中画内「伪装外壳」：顶部栏目头 + 底部卡片条，包裹视频。
    //   PiP 窗口是一个完整的 Document，往 body 里追加任意 DOM 都合法，
    //   不需要 hack，也不影响 playurl / 弹幕时序。本外壳纯静态、不可交互。
    //   文案统一取自 pipAdBar.ts 的 PIP_DISGUISE_CONTENT（集中管理，便于后续接 i18n），
    //   此处不再散落硬编码字符串。
    this.frame = mountPipDisguiseFrame(pipWindow.document, {
      topTitle: PIP_DISGUISE_CONTENT.topTitle,
      topSub: PIP_DISGUISE_CONTENT.topSub,
      items: DEFAULT_PIP_DISGUISE_ITEMS,
      onVisibilityChange: (shown) => {
        // 外壳收起（窗口过矮）时视频铺满、canvas 回到 0；显示时反过来
        playerEl.style.height = shown ? `calc(100% - ${AD_FRAME_TOTAL}px)` : '100%'
        pipWindow.document.documentElement.style.setProperty(
          '--docpip-canvas-top',
          shown ? `${AD_FRAME_TOP}px` : '0px'
        )
      },
    })
  }
}
