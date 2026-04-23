import options from "src/configuration";
import { GridChild, ModuleMapArray } from "src/configuration/types";
import { DashboardModules } from "src/widget/dashboard/_component";

type Coordinate = { x: number | null; y: number | null }

export class ModuleMap {
  private selectedModule: DashboardModules | null = null
  private firstCorner: Coordinate = { x: null, y: null }
  private secondCorner: Coordinate = { x: null, y: null }
  private modules: ModuleMapArray

  constructor(map?: ModuleMapArray) {
    this.modules = map ? map : []
  }

  clone(): ModuleMap {
    const m = new ModuleMap(this.getModules())
    m.selectedModule = this.selectedModule
    m.firstCorner = { ...this.firstCorner }
    m.secondCorner = { ...this.secondCorner }
    return m
  }

  setModule(module: DashboardModules): void {
    this.selectedModule = module
  }

  isModuleNull(): boolean {
    return this.selectedModule === null
  }

  setFirstCorner(row: number, col: number): void {
    this.firstCorner = { x: row, y: col }
  }

  isFirstCornerNull(): boolean {
    return this.firstCorner.x === null || this.firstCorner.y === null
  }

  setSecondCorner(row: number, col: number): void {
    this.secondCorner = { x: row, y: col }
  }

  isSecondCornerNull(): boolean {
    return this.secondCorner.x === null || this.secondCorner.y === null
  }

  private _normalizeCorners(): void {
    if (this.isFirstCornerNull() || this.isSecondCornerNull()) {
      return
    }

    const fx = this.firstCorner.x!
    const fy = this.firstCorner.y!
    const sx = this.secondCorner.x!
    const sy = this.secondCorner.y!

    // Top left corner coordinates
    const tlX = Math.min(fx, sx)
    const tlY = Math.min(fy, sy)

    // Bottom right corner coordinates
    const brX = Math.max(fx, sx)
    const brY = Math.max(fy, sy)

    this.setFirstCorner(tlX, tlY)
    this.setSecondCorner(brX, brY)
  }

  reset(): void {
    this.selectedModule = null
    this.firstCorner = { x: null, y: null }
    this.secondCorner = { x: null, y: null }
  }

  addModule(): boolean {
    if (this.isModuleNull()) {
      console.error("Module isn't set")
      return false
    }

    if (this.isFirstCornerNull() || this.isSecondCornerNull()) {
      console.error("A corner isn't set")
      return false
    }

    this._normalizeCorners()

    const deltaX = this.secondCorner.x! - this.firstCorner.x!
    const deltaY = this.secondCorner.y! - this.firstCorner.y!

    const newModule: GridChild = {
      module: this.selectedModule!,
      column: this.firstCorner.y!,
      row: this.firstCorner.x!,
      width: deltaX + 1,
      height: deltaY + 1
    }

    this.modules.push(newModule)

    //WARNING: remove this in the future
    const db = options.dashboard.grid.modulesList

    console.log("Added db:", db.set([newModule]))
    this.reset()
    return true
  }

  getModules(): ModuleMapArray {
    return [...this.modules]
  }

  clear(): void {
    this.modules = []
    this.reset()
  }

  getBitMap(rows: number, cols: number): number[][] {
    const bitMap = Array.from({ length: rows }, () => Array(cols).fill(0))
    for (const module of this.getModules()) {
      for (let i = module.row; i < module.row + module.height; i++) {
        for (let j = module.column; j < module.column + module.width; j++) {
          bitMap[i][j] = 1
        }
      }
    }
    return bitMap
  }
}
