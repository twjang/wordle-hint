#![feature(proc_macro_hygiene, decl_macro)]
pub mod dict;

#[macro_use] extern crate rocket;
#[macro_use] extern crate serde_derive;

use dict::{WordFilter, get_dict_service};
use rocket::routes;
use serde::{Serialize, Deserialize};
use rocket_contrib::json::{Json};
use serde_derive::Deserialize;

#[get("/")]
fn index() -> &'static str {
    "OK"
}

#[derive(Serialize, Deserialize)]
struct PredictReq {
    wordlen: i32,
    lang: String,
    trial: Vec<String>,
    resp: Vec<String>,
    k: Option<usize>
}

#[derive(Serialize, Deserialize)]
struct Resp<T> where T:Serialize{
    success: bool,
    msg: Option<String>,
    result: Option<T>
}

#[derive(Serialize, Deserialize)]
struct PredictionResult {
    to_exploit: Vec<(f32, String)>,
    to_explore: Vec<(f32, String)>,
}

#[post("/pred", data="<req>")]
fn pred(req: Json<PredictReq>) -> Json<Resp<PredictionResult>> {
    if req.wordlen < 0 || req.wordlen > 10 {
        return Json(Resp {
            success: false,
            msg: Some(format!("wordlen({}) out of range", req.wordlen)),
            result: None
        });
    }

    if req.trial.len() > 10 || req.resp.len() > 10 {
        return Json(Resp {
            success: false,
            msg: Some(format!("trial/resp is too long")),
            result: None
        });
    }

    let res = suggest(&req.lang, usize::from(req.wordlen as u16), &req.trial, &req.resp, req.k.unwrap_or(5));
    if let Err(msg) = res {
        return Json(Resp {
            success: false,
            msg: Some(msg),
            result: None
        });
    }

    let (to_explore, to_exploit ) = res.unwrap();
    return Json(Resp {
        success: true ,
        msg: None,
        result: Some(PredictionResult {
            to_exploit: to_exploit,
            to_explore: to_explore
        })
    });
}

fn suggest(lang: &String, wordlen:usize, trial:&Vec<String>, resp:&Vec<String>, k:usize)->Result<(Vec<(f32, String)>, Vec<(f32, String)>), String> {
    let mut res_explore: Vec<(f32, String)> = Vec::new();
    let mut res_exploit: Vec<(f32, String)> = Vec::new();

    if trial.len() != resp.len() {
        return Err(format!("input / resp have different lengths"));
    }

    {
        let lck_svc = get_dict_service();
        let svc = lck_svc.read().unwrap(); 
        if let Some(dictarc) = svc.get(&lang) {
            let dict = dictarc.read().unwrap();
            let char_mapper = dict.get_char_mapper();

            let mut translated_trial: Vec<Vec<u16>> = Vec::new();
            let mut translated_resp: Vec<Vec<dict::WordleResp>> = Vec::new();
            for (wordidx, word) in trial.iter().enumerate() {
                if word.len() == wordlen && resp[wordidx].len() == wordlen {
                    let cur_word = char_mapper.map_word(word);
                    let mut cur_resp: Vec<dict::WordleResp> = Vec::new();
                    for c in resp[wordidx].chars() {
                        cur_resp.push(
                        match c {
                            '1' => dict::WordleResp::Yellow,
                            '2' => dict::WordleResp::Green,
                            _ => dict::WordleResp::Black,
                        })
                    }
                    translated_trial.push(cur_word);
                    translated_resp.push(cur_resp)
                }
            }

            let filter = WordFilter::<26>::from_wordle(wordlen as u16, &translated_trial, &translated_resp);
            match filter {
                Ok(word_filter) => {
                    let exploit_dict = dict.apply_filter(&word_filter, dict::FilterMode::ForExploit);
                    let explore_dict = dict.apply_filter(&word_filter, dict::FilterMode::ForExploration);

                    let freq = exploit_dict.log_letter_freq();
                    let is_char_explored = word_filter.is_char_explored();
                    let mut locfreq :Vec<Vec<f32>> = Vec::new();
                    for pos in 0..wordlen {
                        locfreq.push(exploit_dict.log_letter_locfreq(pos));
                    }

                    let tmp_explore = explore_dict.find_best_words_to_explore(k, &freq, &is_char_explored);
                    for (cur_score, cur_word) in tmp_explore.iter() {
                        res_explore.push((*cur_score, char_mapper.unmap_word(cur_word)))
                    }

                    let tmp_exploit = exploit_dict.find_best_words_to_exploit(k, locfreq);
                    for (cur_score, cur_word) in tmp_exploit.iter() {
                        res_exploit.push((*cur_score, char_mapper.unmap_word(cur_word)))
                    }

                },
                Err(e) => {
                    return Err(e)
                }
            }
        } else {
            return Err("dictioanry not found".to_string());
        }
    }

    Ok((res_explore, res_exploit))
}

fn main() {
    {
        let mut svc = get_dict_service().write().unwrap();
        svc.load(&"en".to_string(), "./dict/en.txt".to_string(), &"en".to_string()).unwrap();
    }
    rocket::ignite().mount("/", routes![index, pred]).launch();
}