import { useState, useEffect } from 'react'
import { Grid } from './components/grid/Grid'
import { Keyboard } from './components/keyboard/Keyboard'
import { InfoModal } from './components/modals/InfoModal'
import { SettingsModal } from './components/modals/SettingsModal'
import {
  NOT_ENOUGH_LETTERS_MESSAGE,
} from './constants/strings'
import {
  MAX_CHALLENGES, SUGGESTION_REQ_DELAY,
} from './constants/settings'
import {
  unicodeLength,
} from './lib/words'
import {
  setStoredIsHighContrastMode,
  getStoredIsHighContrastMode,
} from './lib/localStorage'
import { default as GraphemeSplitter } from 'grapheme-splitter'

import './App.css'
import { AlertContainer } from './components/alerts/AlertContainer'
import { useAlert } from './context/AlertContext'
import { Navbar } from './components/navbar/Navbar'
import { dictionaryList } from './constants/dictionaries'
import { maxWordLengthList } from './constants/maxwordlengths'
import { CharStatus } from './lib/statuses'
import { SuggestionList } from './components/suggestion/SuggestionList'
import { useInterval } from './lib/userInterval'
import { getSuggestion, RespSuggestion } from './lib/backendapi'

function App() {
  const prefersDarkMode = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches

  const { showError: showErrorAlert } = useAlert()
  const [currentGuess, setCurrentGuess] = useState('')
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [currentRowClass, setCurrentRowClass] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme')
      ? localStorage.getItem('theme') === 'dark'
      : prefersDarkMode
      ? true
      : false
  )
  const [isHighContrastMode, setIsHighContrastMode] = useState(
    getStoredIsHighContrastMode()
  )
  const [guesses, setGuesses] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<CharStatus[][]>([]);
  const [maxWordLength, setMaxWordLength] = useState<number>(
    localStorage.getItem('maxWordLength') !== null
    ? parseInt(localStorage.getItem('maxWordLength')!)
    : 5
  );

  const [dictionaryName, setDictionaryName] = useState(
    localStorage.getItem('dictionaryName') !== null
    ? localStorage.getItem('dictionaryName')!
      : 'en'
  )

  const [queryLastUpdatedAt, setQueryLastUpdatedAt] = useState<number>(new Date().getTime());
  const [suggestionNeedUpdate, setSuggestionNeedUpdate] = useState<boolean>(true);
  const [suggestionIsLoading, setSuggestionIsLoading] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string>('');
  const [toExploitList, setToExploitList] = useState<[number, string][]>([]);
  const [toExploreList, setToExploreList] = useState<[number, string][]>([]);

  const requestNewSuggestion = () => {
    setQueryLastUpdatedAt(new Date().getTime());
    setSuggestionNeedUpdate(true);
  }

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    if (isHighContrastMode) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  }, [isDarkMode, isHighContrastMode])

  useInterval(()=>{
    if (suggestionNeedUpdate) {
      let now = new Date().getTime();
      let beforeUpdate = (now - queryLastUpdatedAt);
      if (beforeUpdate > SUGGESTION_REQ_DELAY) {
        setSuggestionNeedUpdate(false);
        setSuggestionIsLoading(true);
        getSuggestion(maxWordLength, dictionaryName, guesses, statuses, 5).then((resp:RespSuggestion)=>{
          setSuggestionIsLoading(false);
          setSuggestionError('');
          if (resp.result) {
            setToExploitList(resp.result.to_exploit);
            setToExploreList(resp.result.to_explore);
          } else {
            setSuggestionError((resp.msg || "Failed to fetch").toString());
          }
        }).catch((err)=>{
          setSuggestionIsLoading(false);
          setSuggestionError(err.toString());
        })
      }
    }
  }, 200);

  const handleDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  const handleDictionaryName = (dictionaryName: string) => {
    setDictionaryName(dictionaryName)
    localStorage.setItem('dictionaryName', dictionaryName)
  }

  const handleHighContrastMode = (isHighContrast: boolean) => {
    setIsHighContrastMode(isHighContrast)
    setStoredIsHighContrastMode(isHighContrast)
  }

  const handleMaxWordLength = (newMaxWordLength: string) => {
    resetBoard();
    setMaxWordLength(parseInt(newMaxWordLength));
    localStorage.setItem('maxWordLength', newMaxWordLength);
  }

  const clearCurrentRowClass = () => {
    setCurrentRowClass('')
  }

  const resetBoard = () => {
    setStatuses([]);
    setGuesses([]);
    setCurrentGuess('');
    requestNewSuggestion();
  }

  const handleSuggestionClick = (value: string) => {
    setStatuses([...statuses, Array(maxWordLength).fill('absent')])
    setGuesses([...guesses, value.toUpperCase()])
    requestNewSuggestion();

    setCurrentGuess('')
  }

  const onChar = (value: string) => {
    if (
      unicodeLength(`${currentGuess}${value}`) <= maxWordLength &&
      guesses.length < MAX_CHALLENGES
    ) {
      setCurrentGuess(`${currentGuess}${value}`)
    }
  }

  const onDelete = () => {
    setCurrentGuess(
      new GraphemeSplitter().splitGraphemes(currentGuess).slice(0, -1).join('')
    )
  }

  const onEnter = () => {
    if (!(unicodeLength(currentGuess) === maxWordLength)) {
      setCurrentRowClass('jiggle')
      return showErrorAlert(NOT_ENOUGH_LETTERS_MESSAGE, {
        onClose: clearCurrentRowClass,
      })
    }

    setStatuses([...statuses, Array(maxWordLength).fill('absent')])
    setGuesses([...guesses, currentGuess])
    requestNewSuggestion();

    setCurrentGuess('')
  }

  const handleChangeStatuses = (statuses: CharStatus[][]) => {
    setStatuses(statuses);
    requestNewSuggestion();
  }

  const handleChangeGuesses = (guesses: string[]) => {
    setGuesses(guesses);
    requestNewSuggestion();
  }

  return (
    <div className="h-screen flex flex-col">
      <Navbar
        setIsInfoModalOpen={setIsInfoModalOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        resetBoard={resetBoard}
      />
      <div className="pt-2 px-1 pb-8 md:max-w-7xl w-full mx-auto sm:px-6 lg:px-8 flex flex-col grow justify-between">
        <div className="pb-6 shrink-0">
          <Grid
            statuses={statuses}
            guesses={guesses}
            currentGuess={currentGuess}
            currentRowClassName={currentRowClass}
            handleChangeStatuses={handleChangeStatuses}
            handleChangeGuesses={handleChangeGuesses}
            maxWordLength={maxWordLength}
          />
        </div>
        {(suggestionIsLoading)?
          (<div className="flex flex-row grow shrink place-content-center">
            <svg role="status" className="mr-2 w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
          </div>):
          (suggestionError !== '')?
          (<div className="flex grow text-center">{suggestionError}</div>):
          (<div className="flex flex-row place-content-center shrink overflow-x-hidden overflow-y-auto h-10 grow mb-5">
            <SuggestionList title={"To solve"} wordList={toExploitList} handleClick={handleSuggestionClick} />
            <SuggestionList title={"To reduce"} wordList={toExploreList}  handleClick={handleSuggestionClick} />
          </div>)}
        <div className='shrink-0'>
          <Keyboard
            onChar={onChar}
            onDelete={onDelete}
            onEnter={onEnter}
            guesses={guesses}
            statuses={statuses}
          />
        </div>
        <InfoModal
          isOpen={isInfoModalOpen}
          handleClose={() => setIsInfoModalOpen(false)}
        />
        <SettingsModal
          isOpen={isSettingsModalOpen}
          handleClose={() => setIsSettingsModalOpen(false)}
          dictionaryList={dictionaryList}
          dictionaryName={dictionaryName}
          handleDictionaryName={handleDictionaryName}
          maxWordLengthList={maxWordLengthList}
          maxWordLength={maxWordLength}
          handleMaxWordLength={handleMaxWordLength}
          isDarkMode={isDarkMode}
          handleDarkMode={handleDarkMode}
          isHighContrastMode={isHighContrastMode}
          handleHighContrastMode={handleHighContrastMode}
        />
        <AlertContainer />
      </div>
    </div>
  )
}

export default App
