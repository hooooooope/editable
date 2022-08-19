import { Editable, Editor, Node, Element, Range, Point, Transforms, NodeEntry } from "@editablejs/editor";

export const TABLE_CELL_KEY = 'table-cell';

export interface TableCellOptions {

}

export interface TableCell extends Element {
  type: typeof TABLE_CELL_KEY
  colspan: number
  rowspan: number
  span?: TableCellPoint
}

export interface TableCellEditor extends Editable { 

}

export type TableCellPoint = [number, number]

export type TableCellEdge = 'start' | 'end'

const prefixCls = 'editable-table-cell';

export const TableCellEditor = {
  isTableCell: (editor: Editable, n: Node): n is TableCell => { 
    return Editor.isBlock(editor, n) && n.type === TABLE_CELL_KEY
  },

  isActive: (editor: Editable): boolean => {
    const elements = editor.queryActiveElements()[TABLE_CELL_KEY] ?? []
    return elements.some(e => TableCellEditor.isTableCell(editor, e[0]))
  },

  create: (cell: Partial<Omit<TableCell, 'type' | 'children'>> = {}): TableCell => { 
    return {
      colspan: 1,
      rowspan: 1,
      ...cell,
      type: TABLE_CELL_KEY,
      children: [{ children: [{text: ''}] }]
    }
  },

  equal: (a: TableCellPoint, b: TableCellPoint) => { 
    return a[0] === b[0] && a[1] === b[1]
  },

  focus: (editor: TableCellEditor, [, path]: NodeEntry<TableCell>, edge: TableCellEdge = 'start') => { 
    const point = Editable.toLowestPoint(editor, path, edge)
    Transforms.select(editor, point)
  },

  edges: (selection: { start: TableCellPoint, end: TableCellPoint}): { start: TableCellPoint, end: TableCellPoint } => {
    const {start, end} = selection
    const startRow = Math.min(start[0], end[0])
    const endRow = Math.max(start[0], end[0])
    const startCol = Math.min(start[1], end[1])
    const endCol = Math.max(start[1], end[1])
    return {
      start: [Math.max(startRow, 0), Math.max(startCol, 0)],
      end: [Math.max(endRow, 0), Math.max(endCol, 0)]
    }
  },

  getPoint: (editor: TableCellEditor, [, path]: NodeEntry<TableCell>): TableCellPoint => { 
    if(path.length < 2) throw new Error('Invalid path')
    return path.slice(path.length - 2) as TableCellPoint
  },

  getInner: (editor: TableCellEditor, cell: TableCell): HTMLDivElement => { 
    const node = Editable.toDOMNode(editor, cell)
    const element = node.querySelector(`.${prefixCls}-inner`)
    if(!element) throw new Error('Invalid cell')
    return element as HTMLDivElement
  }
}

export const withTableCell =  <T extends Editable>(editor: T, options: TableCellOptions = {}) => { 
  const newEditor = editor as T & TableCellEditor
  const { renderElement, deleteBackward, deleteForward, isCell } = editor

  newEditor.isCell = (node: Node) => {
    return TableCellEditor.isTableCell(newEditor, node) || isCell(node)
  }

  newEditor.renderElement = (props) => { 
    const { element, attributes, children } = props
    if(TableCellEditor.isTableCell(newEditor, element)) {
      const { style, ...rest } = attributes
      return <td rowSpan={element.rowspan ?? 1} colSpan={element.colspan ?? 1} style={{ ...style, display: element.span ? 'none' : ''}} className={prefixCls} {...rest}>
        <div className={`${prefixCls}-inner`}>
        { children }
        </div>
      </td>
    }
    return renderElement(props)
  }

  newEditor.deleteBackward = unit => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: n => TableCellEditor.isTableCell(editor, n)
      })

      if (cell) {
        const [, cellPath] = cell
        const start = Editor.start(editor, cellPath)

        if (Point.equals(selection.anchor, start)) {
          return
        }
      }
    }
    deleteBackward(unit)
  }

  newEditor.deleteForward = unit => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const [cell] = Editor.nodes(editor, {
        match: n => TableCellEditor.isTableCell(editor, n)
      })

      if (cell) {
        const [, cellPath] = cell
        const end = Editor.end(editor, cellPath)
        if (Point.equals(selection.anchor, end)) {
          return
        }
      }
    }
    deleteForward(unit)
  }

  return newEditor
}