#!/usr/bin/env python3

from re import L
import requests
from pprint import pprint
import datetime

class Timer:
    def __init__(self):
        self.start = None

    def tic(self):
        self.start = datetime.datetime.now()

    def toc(self)->float:
        now = datetime.datetime.now()
        secs = now - self.start
        return secs.total_seconds() * 1000.0

target = 'http://localhost:8000'

data = {
    'wordlen': 5,
    'lang': 'en',
    'trial': ['arose', 'tires', 'brews'],
    'resp': ['02011', '00112', '02222'],
    'k': 10,
}

t = Timer()

t.tic()
resp = requests.post(f'{target}/pred', json=data)
print(t.toc())

pprint (resp.json())