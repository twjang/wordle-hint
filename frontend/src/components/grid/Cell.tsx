import { CharStatus } from '../../lib/statuses'
import classnames from 'classnames'
import { REVEAL_TIME_MS } from '../../constants/settings'
import { getStoredIsHighContrastMode } from '../../lib/localStorage'
import { useState } from 'react'

type Props = {
  value?: string
  status?: CharStatus
  isCompleted?: boolean
  isInteractive?: boolean
  position?: number
  onClick?: Function
}

export const Cell = ({
  value,
  status,
  isCompleted,
  isInteractive,
  position = 0,
  onClick
}: Props) => {
  let [isRevealing, setRevealing] = useState<boolean>(false);

  const isFilled = value && !isCompleted
  const shouldReveal = isRevealing && isCompleted
  const isHighContrast = getStoredIsHighContrastMode()


  const classes = classnames(
    'w-10 h-14 border-solid border-2 flex items-center justify-center mx-0.5 text-4xl font-bold rounded dark:text-white',
    {
      'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600':
        !status,
      'border-black dark:border-slate-100': value && !status,
      'absent shadowed bg-slate-400 dark:bg-slate-700 text-white border-slate-400 dark:border-slate-700':
        status === 'absent',
      'correct shadowed bg-orange-500 text-white border-orange-500':
        status === 'correct' && isHighContrast,
      'present shadowed bg-cyan-500 text-white border-cyan-500':
        status === 'present' && isHighContrast,
      'correct shadowed bg-green-500 text-white border-green-500':
        status === 'correct' && !isHighContrast,
      'present shadowed bg-yellow-500 text-white border-yellow-500':
        status === 'present' && !isHighContrast,
      'cell-fill-animation': isFilled,
      'cell-reveal': shouldReveal,
    }
  )

  return (
    <div className={classes} onClick={(e)=>{ 
      if (isInteractive) {
        if (onClick) onClick(); 
        setRevealing(true); 
        setTimeout(()=>setRevealing(false), REVEAL_TIME_MS ); 
      }
    }}>
      <div className="letter-container select-none">
        {value}
      </div>
    </div>
  )
}
