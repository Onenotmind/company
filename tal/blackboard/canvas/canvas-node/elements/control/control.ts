
import Helper from '../../Helper'
import Point from '../point'
import OriginShape from '../../libs/origin-shape'

const originShape = new OriginShape()

interface CustomStyle {
  methodName: string
  color: string
  dashed: boolean
  [x: string]: any
}

interface Options {
  position: {
    x: number
    y: number
  }
  name: string
  actionHandler: Function
  [x: string]: any
}
interface TransformParams{
  centerX?: number
  centerY?: number
  scaleX?: number
  scaleY?: number
  angle?: number
}

const defaultStyle = {
  color: '#6CA6CD',
  methodName: 'stroke',
  dashed: true
}

/**
 * 自定义 control，继承当前的 control 类
 * @override getActionHandler 移动或者点击时回调函数，返回格式 {actionName, matrix}
 * @override checkPointInControl 判断当前点是否在control范围内
 * @override _render control ui的渲染函数
 */

// (x, y) 是绘制的 center
class Control {
  private x: number
  private y: number
  private visible: boolean
  private offsetX: number
  private offsetY: number
  private cursorStyle: string
  private styleOverride: CustomStyle
  private actionHandler: Function
  private helper: Helper
  private customWidth: number
  private pointList: Array<Point>
  [x: string]: any

  constructor (options: Options) {
    this.visible = true
    this.x = 0
    this.y = 0
    if (options.position) {
      this.x = options.position.x
      this.y = options.position.y
    }
    this.name = options.name
    this.pointList = []
    this.offsetX = 0 // 对 this.x 之后的偏移
    this.offsetY = 0 // 对 this.y 之后的偏移
    this.cursorStyle = 'crosshair' // control 鼠标样式
    this.styleOverride = {...defaultStyle, ...options.styleOverride} // 画笔相关的样式替换
    delete options.styleOverride
    this.centerPos = options.centerPos // 初始化中心点 { centerX, centerY, width, height }
    this.transformParams = {
      centerX: this.centerPos.centerX,
      centerY: this.centerPos.centerY,
      scaleX: 1,
      scaleY: 1,
      angle: 0
    }
    this.customWidth = options.customWidth || -1 // 当是 circle 时， radius = this.customWidth 当是 square时，width = height = this.customWidth
    this.helper = new Helper()
    this.actionHandler = options.actionHandler // 当触发时的回调函数
    delete options.position
    for (var option in options) {
      this[option] = options[option]
    }
  }

  /**
   * 设置control 中心点 { centerX, centerY, width, height }
   */
  setCenterPos(pos: any) {
    this.centerPos = pos
  }

  /**
   * 由于点经过旋转，缩放后checkPointInControl不准确，需要字段记录
   */
  setTransfromParams (transformParams: TransformParams) {
    if (transformParams.scaleX) {
      this.transformParams.scaleX = transformParams.scaleX * this.transformParams.scaleX
      // this.transformParams.centerX = this.transformParams.centerX + 
    }
    if (transformParams.scaleY) {
      this.transformParams.scaleY = transformParams.scaleY * this.transformParams.scaleY
    }
    if (transformParams.angle) {
      this.transformParams.angle = transformParams.angle
    }
  }

  getActionHandler():Function {
    return this.actionHandler
  }

  getName ():string {
    return this.name
  }

  /**
   * 判断点是否在control中
   * 当处于 移动/缩放/旋转 后的判断
   * 移动 可以根据 transformMatrix 来做变化
   * 缩放 ？
   * 旋转 ？
   */
  checkPointInControl (point: Point, transformMatrix: Array<number>): boolean {
    let { realX, realY, radius, width, height } = this.getControlPos()
    const matrixPoint = this.helper.transformPoint(new Point(realX, realY), transformMatrix)
    console.warn(`[checkPointInControl] [info] ${JSON.stringify({realX, realY, radius, width, height})} [point] ${JSON.stringify(point)} [matrixPoint] ${JSON.stringify(matrixPoint)}`)
    realX = matrixPoint.x
    realY = matrixPoint.y
    if (this.styleOverride.cornerStyle === 'circle') {
      return true
    } else {
      return this.helper.isPointInRect(point, {
        left: realX - width / 2,
        top: realY - height / 2,
        right: realX + width / 2,
        bottom: realY + height / 2
      })
    }
  }

  // get related pos
  getControlPos (): any {
    let realX = this.centerPos.centerX + this.x * this.centerPos.width
    let realY = this.centerPos.centerY + this.y * this.centerPos.height
    const radius = this.customWidth < 0 ? 5 : this.customWidth
    const width = this.customWidth < 0 ? this.centerPos.width : this.customWidth
    const height = this.customWidth < 0 ? this.centerPos.height : this.customWidth
    return { realX, realY, radius, width, height }
  }

  
  /**
   * control的样式绘制
   * 为什么会根据移动或者缩放同时跟着变化呢?
   * 是由于继承了 elementbase 所以 render时候会 context.transform(this.matrix)
   */
  _render (ctx: CanvasRenderingContext2D): any {
    const { realX, realY, radius, width, height } = this.getControlPos()
    console.warn(`[control] [_render] [centerpos] ${JSON.stringify({ realX, realY, radius, width, height })}`)
    if (this.styleOverride.cornerStyle === 'circle') {
      this.helper.renderCircleControl(ctx, realX, realY, radius, this.styleOverride)
      return true
    } else {
      // 生成pointlist
      if (this.pointList.length === 0) {
        const points = [
          new Point(realX - width / 2, realY - height / 2),
          new Point(realX + width / 2, realY - height / 2),
          new Point(realX + width / 2, realY + height / 2),
          new Point(realX - width / 2, realY + height / 2)
        ]
        for (let i = 0; i < points.length - 1; i++) {
          this.pointList.push(...originShape._getLinePointsArr(points[i], points[i+1]))
        }
      }
      this.helper.renderSquareControl(ctx, realX, realY, width, height, this.styleOverride)
      return true
    }
  }
}

export default Control
