import { Cell } from '../grid/Cell'
import { BaseModal } from './BaseModal'

type Props = {
  isOpen: boolean
  handleClose: () => void
}

export const InfoModal = ({ isOpen, handleClose }: Props) => {
  return (
    <BaseModal title="How to use" isOpen={isOpen} handleClose={handleClose}>
      <p className="text-sm text-gray-500 dark:text-gray-300">
        Put letters and colors from your wordle screen here. We will suggests the best words
        for you. By clicking the boxes, you can change the color.
      </p>

      <div className="flex justify-center mb-1 mt-4">
        <Cell
          isInteractive={true}
          isCompleted={true}
          value="W"
          status="correct"
        />
        <Cell value="E" />
        <Cell value="A" />
        <Cell value="R" />
        <Cell value="Y" />
      </div>

      <div className="flex justify-center mb-1 mt-4">
        <Cell value="P" />
        <Cell value="I" />
        <Cell
          isInteractive={true}
          isCompleted={true}
          value="L"
          status="present"
        />
        <Cell value="O" />
        <Cell value="T" />
      </div>

      <div className="flex justify-center mb-1 mt-4">
        <Cell value="V" />
        <Cell value="A" />
        <Cell value="G" />
        <Cell isInteractive={true} isCompleted={true} value="U" status="absent" />
        <Cell value="E" />
      </div>

      <p className="mt-6 italic text-sm text-gray-500 dark:text-gray-300">
        This frontend is based on {' '}
        <a
          href="https://github.com/cwackerfuss/react-wordle"
          className="underline font-bold"
        >
          this repository.
        </a>{' '}
      </p>
    </BaseModal>
  )
}
