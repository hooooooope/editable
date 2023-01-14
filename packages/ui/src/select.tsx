import * as React from 'react'
import tw, { css } from 'twin.macro'
import { Button } from './button'
import { Icon } from './icon'
import {
  MenuAnchor,
  MenuContent,
  MenuItemIndicator,
  MenuRadioGroup,
  MenuRadioItem,
  Menu,
  MenuSeparator,
  MenuItem,
} from './menu'

export interface SelectItemProps extends Omit<MenuItem, 'onSelect' | 'textValue'> {
  value: string
  content?: React.ReactNode
  disabled?: boolean
}

type SelectSize = 'small' | 'default' | 'large'

export interface Select extends Menu {
  size?: SelectSize
  value?: string
  defaultValue?: string
  defaultActiveFirstItem?: boolean
  disabled?: boolean
  items: SelectItem[]
  onSelect?: (value: string) => void
}

type SelectItem = SelectItemProps | 'separator'

const sizeCls = (size: SelectSize = 'default') => [
  tw`py-2`,
  size === 'small' && tw`py-1 pr-2 pl-5`,
  size === 'large' && tw`py-3 pr-5 pl-12`,
]

export const Select = React.forwardRef<HTMLButtonElement, Select>(
  (
    {
      children,
      disabled,
      items,
      defaultActiveFirstItem = true,
      onSelect,
      defaultValue: defaultValueProps,
      value: valueProps,
      size = 'default',
      ...props
    },
    ref,
  ) => {
    const defaultValue = React.useMemo(() => {
      if (defaultValueProps) return defaultValueProps
      const firstItem = items.find(item => item !== 'separator')
      return defaultActiveFirstItem && typeof firstItem === 'object' ? firstItem.value : ''
    }, [defaultActiveFirstItem, items, defaultValueProps])

    const [value, setValue] = React.useState(defaultValue)

    const handleSelect = (e: Event, v: string) => {
      setValue(v)
      if (onSelect) onSelect(value)
      setOpen(false)
    }

    React.useEffect(() => {
      setValue(valueProps ?? defaultValue)
    }, [defaultValue, valueProps])

    const renderItems = (items: SelectItem[]) => {
      return items.map((item, index) => {
        if (item === 'separator') {
          return <MenuSeparator key={index} />
        } else {
          const { value, content, disabled, ...props } = item
          return (
            <MenuRadioItem
              disabled={disabled}
              key={value}
              value={value}
              css={[
                tw`relative flex cursor-pointer items-center pl-9 pr-4 hover:bg-gray-100`,
                sizeCls(size),
              ]}
              onSelect={e => handleSelect(e, value)}
              onMouseDown={e => e.preventDefault()}
              {...props}
            >
              <MenuItemIndicator
                css={[
                  tw`absolute left-3 top-0 flex items-center h-full text-gray-400`,
                  size === 'small' && tw`left-2`,
                  size === 'large' && tw`left-4`,
                ]}
              >
                <Icon name="check" />
              </MenuItemIndicator>
              {content ?? value}
            </MenuRadioItem>
          )
        }
      })
    }

    const { open: openProp, onOpenChange, dir, ...triggerProps } = props

    const [open, setOpen] = React.useState(openProp)

    const activeItem = React.useMemo(() => {
      const findItem = (items: SelectItem[]): SelectItemProps | null => {
        for (const item of items) {
          if (item !== 'separator' && item.value === value) return item
        }
        return null
      }
      return findItem(items)
    }, [items, value])

    return (
      <Menu open={open} onOpenChange={onOpenChange} dir={dir}>
        <MenuAnchor>
          <Button
            type="text"
            size={size}
            disabled={disabled}
            css={[
              tw`inline-flex content-center items-center gap-2 px-1.5`,
              size === 'small' && tw`px-0.5 gap-1`,
              size === 'large' && tw`px-2.5 gap-3`,
              css`
                &[data-open='true'] {
                  ${tw`bg-gray-100`}
                }
              `,
            ]}
            data-open={open || undefined}
            {...triggerProps}
            onPointerDown={event => {
              if (!disabled && event.button === 0 && event.ctrlKey === false) {
                setOpen(!open)
                event.preventDefault()
              }
            }}
            onKeyDown={event => {
              if (disabled) return
              if (['Enter', ' '].includes(event.key)) setOpen(!open)
              if (event.key === 'ArrowDown') setOpen(true)
              // prevent keydown from scrolling window / first focused item to execute
              // that keydown (inadvertently closing the menu)
              if (['Enter', ' ', 'ArrowDown'].includes(event.key)) event.preventDefault()
            }}
            ref={ref}
          >
            {children ?? activeItem?.content ?? value}
            <Icon
              name="arrowCaretDown"
              css={[tw`text-xxs text-gray-400`, open && tw`rotate-180 mt-1`]}
            />
          </Button>
        </MenuAnchor>
        <MenuContent
          align="start"
          sideOffset={1}
          onEscapeKeyDown={() => setOpen(false)}
          onPointerDownOutside={() => setOpen(false)}
          css={[
            tw`overflow-hidden text-base py-1 rounded-md border border-zinc-200 bg-white shadow-md z-50`,
            size === 'small' && tw`text-sm`,
            size === 'large' && tw`text-lg`,
          ]}
        >
          <MenuRadioGroup value={value} onValueChange={onSelect}>
            {renderItems(items)}
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    )
  },
)
Select.displayName = 'Select'
