import { MAX_CHALLENGES } from '../../constants/settings'
import { CharStatus } from '../../lib/statuses'
import { CompletedRow } from './CompletedRow'
import { CurrentRow } from './CurrentRow'
import { EmptyRow } from './EmptyRow'

type Props = {
  statuses: CharStatus[][]
  guesses: string[]
  currentGuess: string
  currentRowClassName: string
  handleChangeGuesses?: Function
  handleChangeStatuses?: Function
  maxWordLength: number
}

export const Grid = ({
  statuses,
  guesses,
  currentGuess,
  currentRowClassName,
  handleChangeGuesses,
  handleChangeStatuses, 
  maxWordLength
}: Props) => {
  const empties =
    guesses.length < MAX_CHALLENGES - 1
      ? Array.from(Array(MAX_CHALLENGES - 1 - guesses.length))
      : []

  return (
    <>
      {guesses.map((guess, i) => (
        <CompletedRow
          key={i}
          statuses={(statuses.length > i)? statuses[i]: Array(guess.length).fill('absent')}
          guess={guess}
          handleChangeStatuses={
            (col: number, status: CharStatus) => { 
              if (handleChangeStatuses) {
                let newStatuses = statuses.map((v)=>{return v.slice();});
                newStatuses[i][col] = status;
                handleChangeStatuses(newStatuses);
              }
            }
          }
          handleDelete={()=>{
            if (handleChangeGuesses) {
              let newGuesses = guesses.slice(0, i);
              guesses.slice(i+1).forEach((e)=>{newGuesses.push(e)});
              handleChangeGuesses(newGuesses);
            }
            if (handleChangeStatuses) {
              let newStatuses = statuses.slice(0, i);
              statuses.slice(i+1).forEach((e)=>{newStatuses.push(e)});
              handleChangeStatuses(newStatuses);
            }
          }}
        />
      ))}
      {guesses.length < MAX_CHALLENGES && (
        <CurrentRow guess={currentGuess} className={currentRowClassName} maxWordLength={maxWordLength} />
      )}
      {empties.map((_, i) => (
        <EmptyRow key={i} maxWordLength={maxWordLength} />
      ))}
    </>
  )
}
