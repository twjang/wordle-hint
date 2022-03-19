use std::{cmp::max, path::Path, fs::File, io::{self, BufRead}, collections::{BinaryHeap, HashMap}, sync::{Arc, RwLock}};
use lazy_static::lazy_static;

use ordered_float::NotNan;

pub trait CharMapper: CharMapperClone + Send + Sync {
    fn map_char(&self, c:char)->u16;
    fn unmap_char(&self, n:u16)->char;

    fn map_word(&self, s:&String)->Vec<u16> {
        let mut res: Vec<u16> = Vec::new();
        for c in s.chars() {
            let v = self.map_char(c);
            if v > 0 {
                res.push(self.map_char(c));
            }
        }
        return res;
    }

    fn unmap_word(&self, v:&Vec<u16>)->String {
        let mut res: Vec<char> = Vec::new();
        for val in v {
            let ch = self.unmap_char(*val);
            if ch != ' ' {
                res.push(ch);
            }
        }
        return res.into_iter().collect();
    }

    fn alphabet_cnt(&self) -> u16;
}

// https://stackoverflow.com/questions/30353462/how-to-clone-a-struct-storing-a-boxed-trait-object
pub trait CharMapperClone {
    fn clone_box(&self)->Box<dyn CharMapper>;
}

impl<T> CharMapperClone for T where T: 'static + CharMapper + Clone {
    fn clone_box(&self) -> Box<dyn CharMapper> {
        Box::new(self.clone())
    } 
}

impl Clone for Box<dyn CharMapper> {
    fn clone(&self) -> Box<dyn CharMapper> {
        self.clone_box()
    }
}



pub struct Dictionary{
    pub name: String,
    pub words: Vec<Vec<u16>>,
    pub char_mapper: Box<dyn CharMapper>,
}

#[derive(Clone, Copy)]
pub struct EnglishCharMapper {}


#[derive(Debug, Clone, Copy)]
pub enum CharConstraint {
    ShouldNotContain,
    ShouldContainAtLeast(u8),
    ShouldContainExactly(u8)
}

#[derive(Debug, Clone, Copy)]
pub enum WordleResp {
    Black,
    Yellow,
    Green
}

pub enum FilterMode {
    ForExploration,
    ForExploit
}

#[derive(Debug, Clone)]
pub struct WordFilter<const CNTALPHA:usize> {
    wordlen: u16,
    cnt_constraint: [CharConstraint; CNTALPHA],
    prohib_chars: Vec<[bool; CNTALPHA]>,
    match_chars: Vec<u16>,

}

impl<const CNTALPHA: usize> WordFilter <CNTALPHA> {
    pub fn new(wordlen: u16, cnt_constraint: &[CharConstraint; CNTALPHA], prohib_chars: &Vec<[bool; CNTALPHA]>, match_chars: &Vec<u16>) -> WordFilter<CNTALPHA> {
        WordFilter::<CNTALPHA> {
            wordlen,
            cnt_constraint: cnt_constraint.clone(),
            prohib_chars: prohib_chars.clone(),
            match_chars: match_chars.clone()
        }
    }

    pub fn from_wordle(wordlen: u16, trial: &Vec<Vec<u16>>, response: &Vec<Vec<WordleResp>>) -> Result<WordFilter<CNTALPHA>, String> {
        if trial.len() != response.len() {
            return Err("trial and response has different lengths".to_string());
        }

        assert!(trial.len() == response.len());
        let mut cnt_constraint = [CharConstraint::ShouldContainAtLeast(0); CNTALPHA];
        let mut prohib_chars = Vec::<[bool; CNTALPHA]>::new();
        let mut match_chars = Vec::<u16>::new();

        match_chars.resize(usize::from(wordlen), 0);
        prohib_chars.resize(usize::from(wordlen), [false; CNTALPHA]);

        for i in 0..trial.len() {
            let cur_trial = &trial[i];
            let cur_resp= &response[i];
            if cur_trial.len() != cur_resp.len() {
                return Err(format!("trial[{}] and response[{}] have different lengths", i, i));
            }

            let mut chcnt:[u8; CNTALPHA] = [0; CNTALPHA];

            for pos in 0..cur_trial.len() {
                let cur_ch = cur_trial[pos] - 1;
                let cur_chresp = &cur_resp[pos];

                match cur_chresp {
                    WordleResp::Green => {
                        chcnt[usize::from(cur_ch)] += 1;
                        match_chars[pos] = cur_ch + 1;
                    },
                    WordleResp::Yellow => chcnt[usize::from(cur_ch)] += 1,
                    _ => ()
                }
            }

            for pos in 0..cur_trial.len() {
                let cur_ch = cur_trial[pos] - 1;
                let cur_chresp = &cur_resp[pos];
                let cur_chcnt = &chcnt[usize::from(cur_ch)];

                match cur_chresp {
                    WordleResp::Black => {
                        if *cur_chcnt == 0 {
                            cnt_constraint[usize::from(cur_ch)] = CharConstraint::ShouldNotContain;
                        } else {
                            cnt_constraint[usize::from(cur_ch)] = CharConstraint::ShouldContainExactly(*cur_chcnt);
                        }
                    }
                    WordleResp::Green => {
                        match cnt_constraint[usize::from(cur_ch)] {
                            CharConstraint::ShouldContainAtLeast(cnt)=>
                                cnt_constraint[usize::from(cur_ch)] = CharConstraint::ShouldContainAtLeast(max(cnt, *cur_chcnt)),
                            _=>{}
                        }
                    },
                    WordleResp::Yellow => {
                        prohib_chars[pos][usize::from(cur_ch)] = true;
                        match cnt_constraint[usize::from(cur_ch)] {
                            CharConstraint::ShouldContainAtLeast(cnt)=> {
                                cnt_constraint[usize::from(cur_ch)] = CharConstraint::ShouldContainAtLeast(max(cnt, *cur_chcnt));
                            }
                            _=>{}
                        }
                    }
                }
            }

            for alpha in 0..cnt_constraint.len() {
                match cnt_constraint[alpha] {
                    CharConstraint::ShouldNotContain=> {
                        for pos in 0..usize::from(wordlen) {
                            prohib_chars[pos][alpha] = true;
                        }
                    }
                    _=>{}
                }
            }
        }

        Ok(WordFilter {
            wordlen,
            cnt_constraint,
            prohib_chars: prohib_chars,
            match_chars: match_chars
        })
    }

    pub fn can_be_answer(&self, word: &Vec<u16>)-> bool {
        if usize::from(self.wordlen) != word.len() {
            return false;
        }

        for pos in 0..usize::from(self.wordlen) {
            let expected_char = self.match_chars[pos];
            if expected_char != 0 && expected_char != word[pos] {
                return false;
            }
            if self.prohib_chars[pos][usize::from(word[pos] - 1)] {
                return false;
            }
        }

        let mut chcnt: [u16; CNTALPHA] = [0; CNTALPHA];
        for ch in word.iter() {
            chcnt[usize::from(*ch) - 1] += 1;
        }

        for ch in 0..CNTALPHA {
            match self.cnt_constraint[ch] {
                CharConstraint::ShouldNotContain => {
                    if chcnt[ch] > 0 {
                        return false;
                    }
                }
                CharConstraint::ShouldContainAtLeast(mincnt) => {
                    if chcnt[ch] < u16::from(mincnt) {
                        return false;
                    }
                }
                CharConstraint::ShouldContainExactly(mincnt) => {
                    if chcnt[ch] != u16::from(mincnt) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    pub fn is_explorable(&self, word: &Vec<u16>) -> bool {
        if usize::from(self.wordlen) != word.len() {
            return false;
        }

        let mut chcnt: [u16; CNTALPHA] = [0; CNTALPHA];
        for ch in word.iter() {
            chcnt[usize::from(*ch) - 1] += 1;
        }

        for ch in 0..CNTALPHA {
            match self.cnt_constraint[ch] {
                CharConstraint::ShouldNotContain => {
                    if chcnt[ch] > 0 {
                        return false;
                    }
                }
                CharConstraint::ShouldContainAtLeast(mincnt) => {
                    if chcnt[ch] < u16::from(mincnt) {
                        return false;
                    }
                }
                _=>{}
            }
        }

        return true;
    }

    pub fn is_char_explored(&self) -> Vec<bool> {
        let mut res:Vec<bool> = Vec::new();
        res.resize(CNTALPHA, false);
        for (eidx, e) in self.cnt_constraint.iter().enumerate() {
            match *e {
                CharConstraint::ShouldNotContain => res[eidx] = true,
                CharConstraint::ShouldContainAtLeast(cnt) => res[eidx] = cnt != 0,
                CharConstraint::ShouldContainExactly(_cnt) => res[eidx] = true
            }
        }

        res
    }
}


impl CharMapper for EnglishCharMapper {
    fn map_char(&self, c:char)->u16 {
        let val = u32::from(c);
        let char_lower_a = u32::from('a');
        let char_lower_z = u32::from('z');
        let char_upper_a = u32::from('A');
        let char_upper_z = u32::from('Z');
        if char_lower_a <= val && val <= char_lower_z {
            return (val - char_lower_a + 1) as u16;
        }

        if char_upper_a <= val && val <= char_upper_z {
            return (val - char_upper_a + 1) as u16;
        }

        return 0;
    }

    fn unmap_char(&self, n:u16)->char {
        if n == 0 || n > 26 {
            return ' ';
        }
        let val = u32::from('a') + (u32::from(n) - 1);
        return char::from_u32(val).unwrap();
    }

    fn alphabet_cnt(&self)->u16 {
        26 as u16
    }
}


impl Dictionary {
    pub fn new(name: &String, char_mapper: Box<dyn CharMapper>) -> Dictionary {
        Dictionary { 
            name: name.clone(),
            words: Vec::new(),
            char_mapper: char_mapper,
        }
    }

    pub fn from_file<P>(name: &String, path: P, char_mapper: Box<dyn CharMapper>) -> Result<Dictionary, String> 
        where P: AsRef<Path> {
        let mut words: Vec<Vec<u16>> = Vec::new(); 

        let file = File::open(path);
        if let Err(e) = file {
            return Err(format!("file open error: {}", e));
        }

        if let Ok(file) = file {
            let lines = io::BufReader::new(file).lines();
            for line in lines {
                if let Ok(word) = line {
                    let trimmed = word.trim();
                    let mapped_word = char_mapper.map_word(&trimmed.to_string());
                    words.push(mapped_word);
                }
            }
        }

        Ok(Dictionary {
            name: name.clone(),
            words: words,
            char_mapper: char_mapper,
        })
    }

    pub fn log_letter_freq(&self)->Vec<f32> {
        let mut res : Vec<f32> = Vec::new();
        let alpcnt =usize::from(self.char_mapper.alphabet_cnt());
        res.resize(alpcnt, 0.0); 
        let mut totalcnt = 0;

        for word in self.words.iter(){
            for c in word {
                res[usize::from(*c) - 1] += 1.0;
            }
            totalcnt += word.len();
        }


        for i in 0..alpcnt {
            res[i] = -((f64::from(res[i] + 1.0) / (1.0 + f64::from(totalcnt as u32))) as f32).ln();
        }
        res
    }

    pub fn log_letter_locfreq(&self, pos: usize)->Vec<f32> {
        let mut res : Vec<f32> = Vec::new();
        let alpcnt =usize::from(self.char_mapper.alphabet_cnt());
        res.resize(alpcnt, 0.0); 
        let mut totalcnt = 0;

        for word in self.words.iter(){
            if word.len() > pos {
                let c = word[pos] - 1;
                res[usize::from(c)] += 1.0;
                totalcnt += 1;
            } 
        }


        for i in 0..alpcnt {
            res[i] = -((f64::from(res[i] + 1.0) / (1.0 + f64::from(totalcnt as u32))) as f32).ln();
        }
        res
    }

    pub fn find_best_words_to_explore(&self, k: usize, freq:&Vec<f32>, is_char_explored: &Vec<bool>) -> Vec<(f32, Vec<u16>)> {
        let mut worst_score: f32 = 0.0;
        for s in freq.iter() {
            worst_score = max(NotNan::new(*s).unwrap(), NotNan::new(worst_score).unwrap()).into_inner();
        }

        let mut score_heap: BinaryHeap<(NotNan<f32>, usize)> = BinaryHeap::new();
        for (wordidx, word) in self.words.iter().enumerate() {
            let mut cur_score: f32 = 0.0;

            let cntalpha = usize::from(self.char_mapper.alphabet_cnt());
            let mut incl_char: Vec<bool> = Vec::new();
            incl_char.resize(cntalpha, false);

            for c in word {
                let cidx = usize::from(*c - 1);
                if incl_char[cidx] {
                    cur_score += worst_score;
                } else {
                    incl_char[cidx] = true;
                }
            }

            for i in 0..cntalpha {
                if incl_char[i] {
                    if is_char_explored[i] {
                        cur_score += worst_score;
                    } else {
                        cur_score += freq[i];
                    }
                }
            }

            score_heap.push((NotNan::new(cur_score).unwrap(), wordidx));
            if score_heap.len() > k {
                score_heap.pop();
            }
        }

        let mut res: Vec<(f32, Vec<u16>)> = Vec::new();
        while score_heap.len() > 0 {
            let (score, wordidx) = score_heap.pop().unwrap();
            res.push((score.into_inner(), self.words[wordidx].clone()));
        }
        res.reverse();
        res
    }

    pub fn find_best_words_to_exploit(&self, k: usize, locfreq:Vec<Vec<f32>>) -> Vec<(f32, Vec<u16>)> {
        let mut score_heap: BinaryHeap<(NotNan<f32>, usize)> = BinaryHeap::new();
        for (wordidx, word) in self.words.iter().enumerate() {
            let mut cur_score: f32 = 0.0;
            for (cidx, c) in word.iter().enumerate() {
                cur_score += locfreq[cidx][usize::from(*c - 1)];
            }
            score_heap.push((NotNan::new(cur_score).unwrap(), wordidx));
            if score_heap.len() > k {
                score_heap.pop();
            }
        }

        let mut res: Vec<(f32, Vec<u16>)> = Vec::new();
        while score_heap.len() > 0 {
            let (score, wordidx) = score_heap.pop().unwrap();
            res.push((score.into_inner(), self.words[wordidx].clone()));
        }
        res.reverse();
        res
    }

    pub fn apply_filter<const CNTALPHA:usize>(&self, word_filter: &WordFilter<CNTALPHA>, mode: FilterMode) -> Dictionary {
        let mut words:Vec<Vec<u16>> = Vec::new();
        for cur_word in self.words.iter() {
            let to_include = match mode {
                FilterMode::ForExploit => word_filter.can_be_answer(cur_word),
                FilterMode::ForExploration => word_filter.is_explorable(cur_word)
            };
            if to_include {
                words.push(cur_word.clone());
            }
        }

        Dictionary {
            name: self.name.clone(),
            words: words,
            char_mapper: self.char_mapper.clone(),
        }
    }

    pub fn get_word(&self, pos: usize)->Option<String> {
        if self.words.len() <= pos {
            return None;
        }
        return Some(self.char_mapper.unmap_word(&self.words[pos]));
    }

    pub fn get_char_mapper(&self)->Box<dyn CharMapper> {
        self.char_mapper.clone_box()
    }
}

pub struct DictionaryService {
    reg: HashMap<String, RwLock<Arc<Dictionary>>>,
}

impl DictionaryService {
    pub fn new() -> DictionaryService {
        DictionaryService { reg: HashMap::new() }
    }

    pub fn load(&mut self, lang: &String, path: String, charset:&String) -> Result<(), String> {
        let char_mapper: Box<dyn CharMapper + Sync + Send> = match charset {
            _ => Box::new(EnglishCharMapper{}),
        };

        let dict = RwLock::new(Arc::new(Dictionary::from_file(lang, path, char_mapper).unwrap()));
        self.reg.insert(lang.clone() , dict);

        Ok(())
    }

    pub fn list(&self)->Vec<String> {
        let mut res:Vec<String> = Vec::new();

        for k in self.reg.keys() {
            res.push(k.clone());
        }

        res
    }

    pub fn get(&self, lang: &String) -> Option<&RwLock<Arc<Dictionary>>> {
        self.reg.get(lang)
    }
}

lazy_static! {
    static ref DICT_SERVICE: Arc<RwLock<DictionaryService>> = Arc::new(RwLock::new(DictionaryService::new()));
}

pub fn get_dict_service()->&'static Arc<RwLock<DictionaryService>> {
    &DICT_SERVICE
}