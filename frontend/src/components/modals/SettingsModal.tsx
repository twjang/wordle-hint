import { BaseModal } from './BaseModal'
import { SettingsToggle } from './SettingsToggle'
import { HIGH_CONTRAST_MODE_DESCRIPTION } from '../../constants/strings'
import { OptionItem, SettingsSelectBox } from './SettingsSelectBox'

type Props = {
  isOpen: boolean
  handleClose: () => void
  dictionaryList: OptionItem[]
  dictionaryName: string
  handleDictionaryName: Function
  maxWordLengthList: OptionItem[]
  maxWordLength: number
  handleMaxWordLength: Function
  isDarkMode: boolean
  handleDarkMode: Function
  isHighContrastMode: boolean
  handleHighContrastMode: Function
}

export const SettingsModal = ({
  isOpen,
  handleClose,
  dictionaryList,
  dictionaryName,
  handleDictionaryName,
  maxWordLength,
  maxWordLengthList,
  handleMaxWordLength,
  isDarkMode,
  handleDarkMode,
  isHighContrastMode,
  handleHighContrastMode,
}: Props) => {
  return (
    <BaseModal title="Settings" isOpen={isOpen} handleClose={handleClose}>
      <div className="flex flex-col mt-2 divide-y">
        <SettingsSelectBox
          settingName="Word Dictionary"
          options={dictionaryList}
          selection={dictionaryName}
          handleSelection={handleDictionaryName}
        />
        <SettingsSelectBox
          settingName="Max Word Length"
          options={maxWordLengthList}
          selection={maxWordLength}
          handleSelection={handleMaxWordLength}
        />
        <SettingsToggle
          settingName="Dark Mode"
          flag={isDarkMode}
          handleFlag={handleDarkMode}
        />
        <SettingsToggle
          settingName="High Contrast Mode"
          flag={isHighContrastMode}
          handleFlag={handleHighContrastMode}
          description={HIGH_CONTRAST_MODE_DESCRIPTION}
        />
      </div>
    </BaseModal>
  )
}
