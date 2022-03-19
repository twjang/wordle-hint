import { CharStatus } from "./statuses";


export type RespSuggestion = {
  success: boolean,
  msg?: string,
  result?: {
    to_exploit: [number, string][],
    to_explore: [number, string][],
  }
}

export async function getSuggestion(wordlen: number, dict:string, guess:string[], statuses:CharStatus[][], k:number): Promise<RespSuggestion> {
  const resp = await fetch(
    `/pred`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors',
      body: JSON.stringify({
        wordlen,
        lang: dict,
        trial: guess,
        resp: statuses.map(e=>{
          let numStatuses = e.map(v=>{
            if (v === 'absent') return '0';
            if (v === 'present') return '1';
            if (v === 'correct') return '2';
            return '0';
          });
          return numStatuses.join('');
        }),
        k
      })
    }
  );
  console.log(resp);
  const json = await resp.json();
  return json;
}