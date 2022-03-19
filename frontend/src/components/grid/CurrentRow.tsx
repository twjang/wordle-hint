import { Cell } from './Cell'
import { unicodeSplit } from '../../lib/words'

type Props = {
  guess: string
  className: string
  maxWordLength: number
}

export const CurrentRow = ({ guess, className, maxWordLength }: Props) => {
  const splitGuess = unicodeSplit(guess)
  const emptyCells = Array.from(Array(maxWordLength - splitGuess.length))
  const classes = `flex justify-center mb-1 ${className}`

  return (
    <div className={classes}>
      {splitGuess.map((letter, i) => (
        <Cell key={i} value={letter} />
      ))}
      {emptyCells.map((_, i) => (
        <Cell key={i} />
      ))}
    </div>
  )
}
