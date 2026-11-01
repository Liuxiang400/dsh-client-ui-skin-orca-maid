import { installAbyssPreferences } from './abyss-preferences.ts'
import { SkinAttributeProjector, type AppearanceState, type AppearanceDefinition } from './appearance-state.ts'

export const COMPOSER_SCROLL_HIDE_ATTRIBUTE = 'data-dsh-whale-maid-composer-scroll-hide'
export const COMPOSER_BOTTOM_ONLY_ATTRIBUTE = 'data-dsh-whale-maid-composer-bottom-only'
export const COMPOSER_HANDLES_ATTRIBUTE = 'data-dsh-whale-maid-composer-handles'
export const HEADLINE_TYPEWRITER_ATTRIBUTE = 'data-dsh-whale-maid-headline-typewriter'

/** A declared behaviour switch reads as enabled until the appearance preference says 'off'. */
export function maidFeatureEnabled(doc: Document, attribute: string): boolean {
  return doc.documentElement.getAttribute(attribute) !== 'off'
}

/** Re-run `callback` whenever appearance settings flip one of the given switches. */
export function observeMaidFeature(doc: Document, attributes: string[], callback: () => void): () => void {
  const observer = new MutationObserver(callback)
  observer.observe(doc.documentElement, { attributes: true, attributeFilter: attributes })
  return () => { observer.disconnect() }
}

/** ORCA MAID owns the attributes produced from its declared controls. */
export function installMaidCustomization(root: HTMLElement = document.documentElement): () => void {
  const projector = new SkinAttributeProjector(root)
  const apply = (state: AppearanceState | null): void => {
    if (state === null) {
      projector.release()
      return
    }
    projector.set('data-abyss-texture', state.values.texture === false ? 'off' : 'on')
    projector.set('data-abyss-pixel-headline', state.values.pixelHeadline === false ? 'off' : 'on')
    projector.set('data-dsh-whale-maid-background', state.values.background ? 'visible' : 'hidden')
    projector.set('data-dsh-whale-maid-pricing', state.values.pricingLight ? 'visible' : 'hidden')
    projector.set('data-dsh-whale-maid-art', 'visible')
    projector.set('data-dsh-whale-maid-character', state.values.character ? 'visible' : 'hidden')
    projector.set('data-abyss-heartbeat', state.values.heartbeat === false ? 'off' : 'on')
    projector.set(
      'data-dsh-whale-maid-character-mirror',
      state.values.mirrorCharacter === true ? 'mirrored' : 'original',
    )
    projector.set(
      'data-dsh-whale-maid-settings-layout',
      state.values.centerSettings === true ? 'centered' : 'docked',
    )
    projector.set(COMPOSER_SCROLL_HIDE_ATTRIBUTE, state.values.scrollHideComposer === false ? 'off' : 'on')
    // 与其它声明相反：这个开关默认关闭，所以缺省值不是 'on'。
    projector.set(COMPOSER_BOTTOM_ONLY_ATTRIBUTE, state.values.composerBottomOnly === true ? 'on' : 'off')
    projector.set(COMPOSER_HANDLES_ATTRIBUTE, state.values.composerHandles === false ? 'off' : 'on')
    projector.set(HEADLINE_TYPEWRITER_ATTRIBUTE, state.values.headlineTypewriter === false ? 'off' : 'on')
  }

  const definition: AppearanceDefinition = {
    settings: [
      { key: 'heartbeat', type: 'boolean', label: '工作状态心跳线', labelEn: 'Working heartbeat', description: '仅在任务执行时跳动；减少动态效果时保持静态。', descriptionEn: 'Animates only while working; remains still with reduced motion.', defaultValue: true },
      { key: 'texture', type: 'boolean', label: '终端扫描纹理', labelEn: 'Terminal raster texture', defaultValue: true },
      { key: 'pixelHeadline', type: 'boolean', label: '首页像素标题', labelEn: 'Pixel home headline', defaultValue: true },
      {
        key: 'character',
        type: 'boolean',
        label: '显示左上角状态小人',
        labelEn: 'Show the corner status character',
        defaultValue: true,
      },
      {
        key: 'mirrorCharacter',
        type: 'boolean',
        label: '镜像左上角状态小人',
        labelEn: 'Mirror the corner status character',
        description: '左右翻转像素头像。',
        descriptionEn: 'Flip the pixel portrait horizontally.',
        defaultValue: false,
      },
      {
        key: 'background',
        type: 'boolean',
        label: '显示几何背景',
        labelEn: 'Show geometric backgrounds',
        defaultValue: true,
      },
      {
        key: 'pricingLight',
        type: 'boolean',
        label: '显示红绿灯定价指示',
        labelEn: 'Show the pricing traffic light',
        defaultValue: false,
      },
      {
        key: 'centerSettings',
        type: 'boolean',
        label: '设置界面居中',
        labelEn: 'Center the settings panel',
        description: '在宽阔视口中将设置面板放在屏幕中央；窄视口仍使用全屏布局。',
        descriptionEn: 'Place the settings panel in the center on large viewports; constrained viewports remain full-screen.',
        defaultValue: false,
      },
      {
        key: 'scrollHideComposer',
        type: 'boolean',
        label: '上滚时隐藏输入框',
        labelEn: 'Hide the composer while scrolling up',
        description: '向上翻阅对话时收起输入框，向下滚动或回到底部时再显示。',
        descriptionEn: 'Tuck the composer away while reading back through the conversation; it returns when scrolling down or reaching the bottom.',
        defaultValue: true,
      },
      {
        key: 'composerBottomOnly',
        type: 'boolean',
        label: '输入框只在底部显示',
        labelEn: 'Show the composer only at the conversation bottom',
        description: '只在滚到最新消息末尾时显示输入框，向上回看时它自然隐去、回到底部再显现。开启后接管上面的上滚隐藏。',
        descriptionEn: 'Show the composer only while the conversation sits at its newest message; it fades away while reading back and returns at the bottom. Takes over the scroll-up hiding above.',
        defaultValue: false,
      },
      {
        key: 'composerHandles',
        type: 'boolean',
        label: '输入框拖拽收起手柄',
        labelEn: 'Composer drag-to-hide handles',
        description: '在输入框两侧的括号上显示拖拽手柄，向内拖动即可手动收起输入框。',
        descriptionEn: 'Turn the brackets beside the composer into handles that hide it when dragged inward.',
        defaultValue: true,
      },
    ],
    apply,
  }
  const local = installAbyssPreferences(root, definition)
  return local.dispose
}
