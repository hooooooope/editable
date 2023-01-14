import { Editor, Transforms } from 'slate'
import { TextInsertTextOptions } from 'slate/dist/transforms/text'
import { Editable } from '../plugin/editable'
import { handleInserInGrid } from './utils'

const { insertText: defaultInsertText } = Transforms

export const insertText = (editor: Editor, text: string, options: TextInsertTextOptions = {}) => {
  const { at = editor.selection } = options
  if (Editable.isEditor(editor) && handleInserInGrid(editor, at)) {
    defaultInsertText(editor, text, options)
  }
}
