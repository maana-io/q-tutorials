## Maana NLTK service

This is a template for creating a Maana Knowledge Service in Python. This requires python 3.6+

## Installation

To install the python packages required, run this:

```
pip install -r requirements.txt
```

then open python and run these commands

```
import nltk
nltk.download()
```

at the prompt, download 'all'

## Starting

python server.py

## Queries to try


Adds a sentence:
    ```
    curl -XPOST http://localhost:7357/graphql -H 'Content-Type: application/json' -d '{"query": "mutation { addSentence(input:{id: \"1\", text: \"this is a sentence\"}) { id } }"}'
    ```

Gets all sentences:
    ```
    curl -X POST -H "Content-Type: application/json" -d '{ "query": "{ allSentences { text } }" }' http://localhost:7357/graphql

This will also automatically parse a the first column of a csv added for text and add sentences using NLTK. Drop a csv where the first column is just text, and it will parse through it all and add them to the sentences kind!