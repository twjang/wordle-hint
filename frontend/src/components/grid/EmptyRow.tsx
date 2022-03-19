import { Cell } from './Cell'

type Prop = {
  maxWordLength: number
}

export const EmptyRow = ({maxWordLength}:Prop) => {
  const emptyCells = Array.from(Array(maxWordLength))

  return (
    <div className="flex justify-center mb-1">
      {emptyCells.map((_, i) => (
        <Cell key={i} />
      ))}
    </div>
  )
}
