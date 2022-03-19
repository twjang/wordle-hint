import { CharStatus } from '../../lib/statuses'
import { Cell } from './Cell'
import { unicodeSplit } from '../../lib/words'
import BackspaceIcon from '@heroicons/react/outline/BackspaceIcon'

type Props = {
  guess: string
  statuses: CharStatus[]
  handleChangeStatuses: Function
  handleDelete?: Function
}

export const CompletedRow = ({ 
  guess, 
  statuses,
  handleChangeStatuses,
  handleDelete,
}: Props) => {
  const splitGuess = unicodeSplit(guess)

  return (
    <div className="flex justify-center items-center mb-1">
      {splitGuess.map((letter, i) => (
        <Cell
          key={i}
          value={letter}
          status={statuses[i]}
          position={i}
          isInteractive={true}
          isCompleted
          onClick={ ()=> {
            let nextStatus: CharStatus ='absent';
            switch(statuses[i]) {
              case 'absent': nextStatus = 'present'; break;
              case 'present': nextStatus = 'correct'; break;
              case 'correct': nextStatus = 'absent'; break;
            }
            handleChangeStatuses(i, nextStatus);
          }}
        />
      ))}
      <BackspaceIcon className="h-10 w-10 ml-3 dark:stroke-white" onClick={()=>{ if (handleDelete) handleDelete(); }} />
    </div>
  )
}
