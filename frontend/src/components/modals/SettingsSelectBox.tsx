import classnames from 'classnames'

export type OptionItem = {
  value: string
  name: string
}

type Props = {
  settingName: string
  selection: any 
  handleSelection: Function
  description?: string
  options?: OptionItem[]
}

export const SettingsSelectBox = ({
  settingName,
  selection,
  handleSelection,
  description,
  options
}: Props) => {
  const selectBoxOption = classnames(
    'w-100 h-8 flex shrink-0 items-center bg-gray-300 rounded-full p-1 duration-300 ease-in-out cursor-pointer',
  )
  const selectBox = classnames(
    'w-60 bg-white h-9 px-5 py-2 rounded-full shadow-md transform duration-300 ease-in-out cursor-pointer',
  )

  return (
    <>
      <div className="justify-between gap-4 py-3">
        <div className="text-gray-500 dark:text-gray-300 mt-2 text-left py-3">
          <p className="leading-none">{settingName}</p>
          {description && (
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-300">
              {description}
            </p>
          )}
        </div>
        <select className={selectBox} onChange={(e)=> handleSelection(e.target.value)} value={selection}>
          {options?.map((oi, idx)=>{
            return (<option value={oi.value} className={selectBoxOption} key={idx}>{oi.name}</option>)
          })}
        </select>
      </div>
    </>
  )
}
