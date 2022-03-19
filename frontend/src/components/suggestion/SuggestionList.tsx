type Props = {
  wordList: [number, string][]
  tagClassName?: string
  title?:string
  handleClick?:Function
}

export const SuggestionList = ({
  wordList,
  tagClassName,
  title,
  handleClick
}: Props) => {
  return (
    <div className="flex-col ">
      <div className="text-s ml-4 font-bold ">{title}</div>
      {wordList.map((scoreAndWord)=>{
        let [score, word] = scoreAndWord;
        return (
        <div className={`shadow-md mb-2 ml-4 text-xs flex flex-row items-center font-bold leading-sm uppercase px-3 py-1 rounded-full ${(tagClassName)?tagClassName:" bg-green-200 text-green-700"}`}
          onClick={()=>{if (handleClick) handleClick(word);}}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="feather feather-arrow-right mr-2"
          >
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
          {word} 
          <div className="grow" />
          <div className="ml-4 w-12 text-center text-xs justify-self-end items-center font-normal uppercase px-3 py-1 bg-white text-green-700 rounded-full">
           {(Math.trunc(score * 100) / 100).toString()} 
          </div>
        </div>)
      })}
    </div>
  )
}
