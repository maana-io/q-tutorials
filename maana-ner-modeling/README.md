## Maana NER Modeling service

This is the maana NER (Named Entity Recognition) Modeling graphql microservice.
It provides:

1.  Extract entities (Person name, Location, Phone number, ...) from text.
2.  Training new CRF (Conditional Random Field) Classifier Model. https://en.wikipedia.org/wiki/Conditional_random_field
3.  Testing CRF Model.
4.  Auto-annotation of text.

Maana-NER-Modeling detects entities in text data using two approaches:

- Stochastic method - Stanford CRF Classifier (Conditional Random Field: https://en.wikipedia.org/wiki/Conditional_random_field) and
- Deterministic method - Tokens Regex: https://stanfordnlp.github.io/CoreNLP/tokensregex.html

## Detected Entities with default (Stanford) CRF Model:

| n   | Entity               | CRF | Regex |
| --- | -------------------- | --- | ----- |
| 01  | DateKind             | +   | +     |
| 02  | TimeKind             | +   | +     |
| 03  | Person               | +   | -     |
| 04  | Location             | +   | -     |
| 05  | Organization         | +   | -     |
| 06  | Currency             | +   | -     |
| 07  | Number               | +   | -     |
| 08  | Percentage           | +   | -     |
| 09  | URL                  | -   | +     |
| 10  | Email                | -   | +     |
| 11  | PhoneNumber          | -   | +     |
| 12  | SocialSecurityNumber | -   | +     |
| 13  | IpAddress            | -   | +     |
| 14  | WebLink              | -   | +     |
| 15  | GeoCoordinate        | -   | +     |
| 16  | ORDINAL              | +   | -     |
| 17  | DURATION             | +   | -     |
| 18  | SET                  | +   | -     |
| 19  | MISC                 | +   | -     |

## List of all Queries:

| Query          | Comment                                                                         |
| -------------- | ------------------------------------------------------------------------------- |
| extract()      | Extract entities from text with Model (Stanford Model or yours CRF Model).      |
| extractBatch() | Extract entities from many texts with Model.                                    |
| extractFast()  | Extract entities from many texts with Model using multithreading.               |
| train()        | Building new CRF-Model.                                                         |
| test()         | Testing yours CRF-Model.                                                        |
| extend()       | Building new CRF-Model and extending tagged entities throughout the whole text. |
| getModelPath() | Get Model Path located in internal service directory.                           |

## Formats of train/test data

dataURL (in training / testing queries) is a path or URL to data file of many formats: .json, .csv, .tsv, .txt

1.  Phrase array .json
    Each entity can be defined one of combination:

- {tag, token} - entities in this format must to be ordered in according of their appearance in the text
- {tag, span, offset} - this is character-based format and entities may not be ordered
- {tag, tokens} - this is word-based format and entities must to be ordered
- {tag, start, end} - this is word-based format and entities may not be ordered

<details>
<summary>click to expand example</summary>
<p>

```ruby
[
  {
    "text": "Microsoft Corporation is multinational technology company with headquarters in Redmond Washington.",
    "xtext": "<Organization>Microsoft Corporation</Organization> is multinational technology company with headquarters in <Location>Redmond Washington</Location>.",
    "entities": [
      {
        "tag": "Organization",
        "token": "Microsoft Corporation",
        "span": 21,
        "offset": 0,
        "tokens": ["Microsoft", "Corporation"],
        "start": 0,
        "end": 2
      },
      {
        "tag": "Location",
        "token": "Redmond Washington",
        "span": 18,
        "offset": 79,
        "tokens": ["Redmond", "Washington."],
        "start": 9,
        "end": 11
      }
    ]
  }
  //, ... other phrases ...
]
```

</p>
</details>

2.  Document .json

<details>
<summary>click to expand example</summary>
<p>

```ruby
{
  "title": "BOEM Data - Common Entities",
  "type": "Drilling Comments",
  "phrases": [
    //... phrase array ...
  ]
}
```

</p>
</details>

3.  Document array .json

<details>
<summary>click to expand example</summary>
<p>

```ruby
[
  //... document array ...
]
```

</p>
</details>

4.  Phrase list .txt or .csv or .tsv

<details>
<summary>click to expand example</summary>
<p>

```ruby
{
  //phrase 1
}
{
  //phrase 2
}
//...
```

</p>
</details>

5. xml-tagged .txt or .csv or .tsv

<details>
<summary>click to expand example</summary>
<p>

```xml
<Person>Satya Narayana Nadella</Person> is from <Location>India</Location>.
He is the CEO of <Organization>Microsoft</Organization>.
```

</p>
</details>

6. Word-tag .tsv
   This is Stanford lib basic data format. To train new CRF Model all other data formats will be transformed to this format inside service.

- each line contains \t separated word and label
- untagged marked by tag "O"
- punctuation signs , ; . as a separate words
- each phrase ended with dot .
- empty line between phrases

<details>
<summary>click to expand example</summary>
<p>

```
Satya Person
Narayana  Person
Nadella Person
is  O
from  O
India Location
. O

He  O
is  O
the O
CEO O
of  O
Microsoft Organization
. O

```

</p>
</details>

## Examples of query and mutation

### Train from file query

<details>
<summary>click to expand example</summary>
<p>

```python
query TrainFromFile {
  train(
    modelName: "boem-20",
    params: {
      splitRate: 0.2,
      seed: 5,
      saveModel: true # if true, Model will be saved on cluster
    },
    labeledText: {
      id: "BOEM"
      fileURL: {
        path: {
          # This is a path or URL to data file of many formats: .json, .csv, .tsv, .txt (see Formats of train/test data)
          # File "BOEM_labeled.json" is located inside test directory of service, so no need to provide whole path to that file.
          id: "BOEM_labeled.json"
        }
      }
    }
  ) {
    id created
    timeToLearn {value units}
    trainParameters {id splitRate kFolds seed saveModel}
    fileURL {path {id}}
    trainStatistics {
      id phraseCount
      statsOverAll {
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
    }
    testStatistics {
      id phraseCount
      statsOverAll {
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
      statsPerEntity {
        tag
        precision recall f1Score
      }
    }
  }
}
```

</p>
</details>

<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "train": {
      "id": "boem-20",
      "created": "2019-06-19T22:24:54.612Z",
      "timeToLearn": {
        "value": 31.152,
        "units": "seconds"
      },
      "trainParameters": {
        "id": "{\"splitRate\":0.2,\"seed\":5}",
        "splitRate": 0.2,
        "kFolds": null,
        "seed": 5,
        "saveModel": true
      },
      "fileURL": {
        "path": {
          "id": "https://[CLUSTER].knowledge.maana.io:8443/downloads/[ID]/boem-20.ser.gz"
        }
      },
      "trainStatistics": {
        "id": "boem-20-train",
        "phraseCount": 340,
        "statsOverAll": {
          "tag": "OverAll",
          "expectedCount": 1688,
          "observedCount": 1423,
          "truePositives": 1415,
          "falsePositives": 12,
          "falseNegatives": 273,
          "precision": 0.992,
          "recall": 0.838,
          "f1Score": 0.909
        }
      },
      "testStatistics": {
        "id": "boem-20-test",
        "phraseCount": 1360,
        "statsOverAll": {
          "tag": "OverAll",
          "expectedCount": 6674,
          "observedCount": 5375,
          "truePositives": 5262,
          "falsePositives": 150,
          "falseNegatives": 1412,
          "precision": 0.972,
          "recall": 0.788,
          "f1Score": 0.871
        },
        "statsPerEntity": [
          {
            "tag": "Email",
            "precision": 0,
            "recall": 0,
            "f1Score": 0
          },
          {
            "tag": "DateKind",
            "precision": 0.998,
            "recall": 0.807,
            "f1Score": 0.892
          },
          {
            "tag": "Organization",
            "precision": 0.971,
            "recall": 0.79,
            "f1Score": 0.872
          },
          {
            "tag": "TimeKind",
            "precision": 0.981,
            "recall": 0.604,
            "f1Score": 0.747
          },
          {
            "tag": "PhoneNumber",
            "precision": 0,
            "recall": 0,
            "f1Score": 0
          },
          {
            "tag": "Person",
            "precision": 0.957,
            "recall": 0.883,
            "f1Score": 0.919
          },
          {
            "tag": "URL",
            "precision": 0,
            "recall": 0,
            "f1Score": 0
          },
          {
            "tag": "Location",
            "precision": 0.976,
            "recall": 0.921,
            "f1Score": 0.948
          }
        ]
      }
    }
  }
}
```

</p>
</details>

### Get Model Path query

If Model was not saved to cluster - `params.saveModel: false`, we can get it's Path using getModelPath(...)
(In any case the model is hashing in internal service directory)

<details>
<summary>click to expand example</summary>
<p>

```python
query GetModelPath {
  getModelPath(modelName: "boem-20")
}
```

</p>
</details>

<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "getModelPath": "/blah/blah/.../crfmodels/boem-20.ser.gz"
  }
}
```

</p>
</details>

### Test from file query

<details>
<summary>click to expand example</summary>
<p>

```python
query TestFromFile {
  test(
    modelURL: {
      path: {
        # Take this URL from the result of Train query or use getModelPath()
        id: "path/to/model/.../boem-20.ser.gz"
      }
    }
    labeledText: {
      id: "BOEM"
      fileURL: {
        path: {
          id: "BOEM_labeled.json"
        }
      }
    }
  ) {
      id phraseCount
      statsOverAll {
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
      statsPerEntity {
        tag
        precision recall f1Score
      }
  }
}
```

</p>
</details>
<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "test": {
      "id": "boem-20-test",
      "phraseCount": 1700,
      "statsOverAll": {
        "tag": "OverAll",
        "expectedCount": 8362,
        "observedCount": 6798,
        "truePositives": 6677,
        "falsePositives": 162,
        "falseNegatives": 1685,
        "precision": 0.976,
        "recall": 0.798,
        "f1Score": 0.878
      },
      "statsPerEntity": [
        {
          "tag": "Email",
          "precision": 0,
          "recall": 0,
          "f1Score": 0
        },
        {
          "tag": "DateKind",
          "precision": 0.998,
          "recall": 0.818,
          "f1Score": 0.899
        },
        {
          "tag": "Organization",
          "precision": 0.975,
          "recall": 0.801,
          "f1Score": 0.88
        },
        {
          "tag": "TimeKind",
          "precision": 0.982,
          "recall": 0.602,
          "f1Score": 0.747
        },
        {
          "tag": "PhoneNumber",
          "precision": 0,
          "recall": 0,
          "f1Score": 0
        },
        {
          "tag": "Person",
          "precision": 0.965,
          "recall": 0.889,
          "f1Score": 0.926
        },
        {
          "tag": "URL",
          "precision": 0,
          "recall": 0,
          "f1Score": 0
        },
        {
          "tag": "Location",
          "precision": 0.977,
          "recall": 0.926,
          "f1Score": 0.951
        }
      ]
    }
  }
}
```

</p>
</details>

### Train on xml-labled texts query

<details>
<summary>click to expand example</summary>
<p>

```python
query TrainOnXmlTexts {
  train(
    modelName: "scientists",
    params: {
      splitRate: 0.8,
      seed: 5,
      saveModel: true
    },
    labeledText: {
      id: "scientists"
      author: "wiki"
      sources: [
        {
          rawText: "<Person>William Gilbert</Person> was born in <Location>Colchester, England</Location>, into a middle class family of some wealth. He entered <Organization>St. John's College</Organization>, <Location>Cambridge</Location>, in <Date>1558</Date> and obtained an B.A. in <Date>1561</Date>, an M.A. in <Date>1564</Date>, and finally an M.D. in <Date>1569</Date>. Upon receiving this last degree, he became a senior fellow of the <Organization>college</Organization>, where he held several offices. <Person>Gilbert</Person> set up a medical practice in <Location>London</Location> in the <Date>1570s</Date> and became a member of the <Organization>Royal College of Physicians</Organization> (the body that regulated the practice of medicine in <Location>London</Location> and <Location>Vicinity</Location>). He held a number of offices in the <Organization>college</Organization> and in <Date>1600</Date> was elected president. He never married."
        },
        {
          rawText: "Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, <Person>Isaac Newton</Person> (<Date>1643-1727</Date>), who was born in <Location>Lincolnshire</Location>, outlined the laws of mechanics that now underpin vast swaths of classical physics. Most important of all, <Person>Newton</Person> outlined the principle of gravity, which explained how the planets revolve round the sun. During his life, he was showered with honours, including the presidency of the <Organization>Royal Society</Organization>. He is renowned as a supreme rationalist, though he actually wrote more about alchemy and religion, including a 300,000-word treatise that attempted to prove the pope was really the Antichrist and an “apocalyptic whore”."
        },
        {
          rawText: "Born in <Location>Copenhagen</Location>, <Person>Bohr</Person> (<Date>1885-1962</Date>) developed the modern idea of an atom, which has a nucleus at the centre with electrons revolving round it. When electrons move from one energy level to another, they emit discrete quanta of energy. The work won <Person>Bohr</Person> a <Prize>Nobel prize</Prize> in <Date>1922</Date>. For his achievements, <Organization>Carlsberg brewery</Organization> gave <Person>Bohr</Person> a special gift: a house with a pipeline connected to its brewery next door, thus providing him with free beer for life. In <Date>1954</Date>, <Person>Bohr</Person> helped establish <Organization>Cern</Organization>, the <Location>European</Location> particle physics facility. In <Date>1975</Date>, his son, <Person>Aage</Person>, won a <Prize>Nobel</Prize> for research on atomic nuclei."
        }
      ]
    }
  ) {
    id created
    timeToLearn {value units}
    trainParameters {id splitRate kFolds seed saveModel}
    fileURL {path {id}}
    trainStatistics {
      id phraseCount
      statsOverAll {
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
    }
    testStatistics {
      id phraseCount
      statsOverAll {
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
      statsPerEntity {
        tag
        precision recall f1Score
      }
    }
  }
}
```

</p>
</details>

<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "train": {
      "id": "scientists",
      "created": "2019-06-19T23:07:45.392Z",
      "timeToLearn": {
        "value": 0.676,
        "units": "seconds"
      },
      "trainParameters": {
        "id": "{\"splitRate\":0.8,\"seed\":5}",
        "splitRate": 0.8,
        "kFolds": null,
        "seed": 5,
        "saveModel": true
      },
      "fileURL": {
        "path": {
          "id": "https://[CLUSTER].knowledge.maana.io:8443/downloads/[ID]/scientists.ser.gz"
        }
      },
      "trainStatistics": {
        "id": "scientists-train",
        "phraseCount": 2,
        "statsOverAll": {
          "tag": "OverAll",
          "expectedCount": 32,
          "observedCount": 31,
          "truePositives": 31,
          "falsePositives": 0,
          "falseNegatives": 1,
          "precision": 1,
          "recall": 0.962,
          "f1Score": 0.981
        }
      },
      "testStatistics": {
        "id": "scientists-test",
        "phraseCount": 1,
        "statsOverAll": {
          "tag": "OverAll",
          "expectedCount": 5,
          "observedCount": 4,
          "truePositives": 2,
          "falsePositives": 1,
          "falseNegatives": 3,
          "precision": 0.707,
          "recall": 0.483,
          "f1Score": 0.574
        },
        "statsPerEntity": [
          {
            "tag": "Organization",
            "precision": 1,
            "recall": 1,
            "f1Score": 1
          },
          {
            "tag": "Person",
            "precision": 1,
            "recall": 0.208,
            "f1Score": 0.345
          },
          {
            "tag": "Date",
            "precision": 0,
            "recall": 0,
            "f1Score": 0
          },
          {
            "tag": "Location",
            "precision": 0.5,
            "recall": 1,
            "f1Score": 0.667
          }
        ]
      }
    }
  }
}
```

</p>
</details>

### Test on xml-labled texts query

<details>
<summary>click to expand example</summary>
<p>

```python
query TestOnXmlTexts {
  test(
    modelURL: {
      path: {
        # Take this URL from the result of Train query or use getModelPath()
        id: "path/to/model/.../scientists.ser.gz"
      }
    }
    labeledText: {
      id: "gilbert"
      author: "wiki"
      sources: [
        {
          rawText: "<Person>William Gilbert</Person> was born in <Location>Colchester, England</Location>, into a middle class family of some wealth. He entered <Organization>St. John's College</Organization>, <Location>Cambridge</Location>, in <Date>1558</Date> and obtained an B.A. in <Date>1561</Date>, an M.A. in <Date>1564</Date>, and finally an M.D. in <Date>1569</Date>. Upon receiving this last degree, he became a senior fellow of the <Organization>college</Organization>, where he held several offices. <Person>Gilbert</Person> set up a medical practice in <Location>London</Location> in the <Date>1570s</Date> and became a member of the <Organization>Royal College of Physicians</Organization> (the body that regulated the practice of medicine in <Location>London</Location> and <Location>Vicinity</Location>). He held a number of offices in the <Organization>college</Organization> and in <Date>1600</Date> was elected president. He never married."
        },
        {
          rawText: "Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, <Person>Isaac Newton</Person> (<Date>1643-1727</Date>), who was born in <Location>Lincolnshire</Location>, outlined the laws of mechanics that now underpin vast swaths of classical physics. Most important of all, <Person>Newton</Person> outlined the principle of gravity, which explained how the planets revolve round the sun. During his life, he was showered with honours, including the presidency of the <Organization>Royal Society</Organization>. He is renowned as a supreme rationalist, though he actually wrote more about alchemy and religion, including a 300,000-word treatise that attempted to prove the pope was really the Antichrist and an “apocalyptic whore”."
        },
        {
          rawText: "Born in <Location>Copenhagen</Location>, <Person>Bohr</Person> (<Date>1885-1962</Date>) developed the modern idea of an atom, which has a nucleus at the centre with electrons revolving round it. When electrons move from one energy level to another, they emit discrete quanta of energy. The work won <Person>Bohr</Person> a <Prize>Nobel prize</Prize> in <Date>1922</Date>. For his achievements, <Organization>Carlsberg brewery</Organization> gave <Person>Bohr</Person> a special gift: a house with a pipeline connected to its brewery next door, thus providing him with free beer for life. In <Date>1954</Date>, <Person>Bohr</Person> helped establish <Organization>Cern</Organization>, the <Location>European</Location> particle physics facility. In <Date>1975</Date>, his son, <Person>Aage</Person>, won a <Prize>Nobel</Prize> for research on atomic nuclei."
        }
      ]
    }
  ) {
      id phraseCount
      statsOverAll {
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
      statsPerEntity {
        tag
        precision recall f1Score
      }
  }
}
```

</p>
</details>
<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "test": {
      "id": "scientists-test",
      "phraseCount": 3,
      "statsOverAll": {
        "tag": "OverAll",
        "expectedCount": 37,
        "observedCount": 35,
        "truePositives": 33,
        "falsePositives": 1,
        "falseNegatives": 4,
        "precision": 0.971,
        "recall": 0.897,
        "f1Score": 0.933
      },
      "statsPerEntity": [
        {
          "tag": "Organization",
          "precision": 1,
          "recall": 0.968,
          "f1Score": 0.984
        },
        {
          "tag": "Person",
          "precision": 1,
          "recall": 0.824,
          "f1Score": 0.904
        },
        {
          "tag": "Prize",
          "precision": 1,
          "recall": 1,
          "f1Score": 1
        },
        {
          "tag": "Date",
          "precision": 1,
          "recall": 0.818,
          "f1Score": 0.9
        },
        {
          "tag": "Location",
          "precision": 0.889,
          "recall": 1,
          "f1Score": 0.941
        }
      ]
    }
  }
}
```

</p>
</details>

### Train on texts with entities query

<details>
<summary>click to expand example</summary>
<p>

```python
query TrainOnTextsWithEntities {
  train(
    modelName: "animals",
    params: {
      splitRate: 0.5,
      seed: 5,
      saveModel: true
    },
    labeledText: {
      id: "animals"
      author: "wiki"
      sources: [
        {
          rawText: "The cat says: meow-meow.",
          entityMentions: [{tag: "Animal", token: "cat"}, {tag: "Sound", token: "meow-meow"}]
        },
				{
          rawText: "The sheep says: baa-baa.",
          entityMentions: [{tag: "Animal", token: "sheep"}, {tag: "Sound", token: "baa-baa"}]
        },
				{
          rawText: "The horse says: neigh-neigh.",
          entityMentions: [{tag: "Animal", token: "horse"}, {tag: "Sound", token: "neigh-neigh"}]
        },
				{
          rawText: "The dog says: woof-woof.",
          entityMentions: [{tag: "Animal", token: "dog"}, {tag: "Sound", token: "woof-woof"}]
        },
				{
          rawText: "The sparrow says: cheep-cheep.",
          entityMentions: [{tag: "Animal", token: "sparrow"}, {tag: "Sound", token: "cheep-cheep"}]
        },
				{
          rawText: "The rooster says: cock-a-doodle-doo.",
          entityMentions: [{tag: "Animal", token: "rooster"}, {tag: "Sound", token: "cock-a-doodle-doo"}]
        },
				{
          rawText: "The hen says: cluck-cluck.",
          entityMentions: [{tag: "Animal", token: "hen"}, {tag: "Sound", token: "cluck-cluck"}]
        },
				{
          rawText: "The goose says: hhonk-honk.",
          entityMentions: [{tag: "Animal", token: "goose"}, {tag: "Sound", token: "hhonk-honk"}]
        },
				{
          rawText: "The turkey says: gobble-gobble.",
          entityMentions: [{tag: "Animal", token: "turkey"}, {tag: "Sound", token: "gobble-gobble"}]
        },
				{
          rawText: "The goat says: maa-maa.",
          entityMentions: [{tag: "Animal", token: "goat"}, {tag: "Sound", token: "maa-maa"}]
        },
				{
          rawText: "The cow says: moo-moo.",
          entityMentions: [{tag: "Animal", token: "cow"}, {tag: "Sound", token: "moo-moo"}]
        },
				{
          rawText: "The donkey says: hee-haw.",
          entityMentions: [{tag: "Animal", token: "donkey"}, {tag: "Sound", token: "hee-haw"}]
        },
				{
          rawText: "The pig says: oink-oink.",
          entityMentions: [{tag: "Animal", token: "pig"}, {tag: "Sound", token: "oink-oink"}]
        },
				{
          rawText: "The mouse says: squeak-squeak.",
          entityMentions: [{tag: "Animal", token: "mouse"}, {tag: "Sound", token: "squeak-squeak"}]
        },
				{
          rawText: "The cuckoo says: cuckoo.",
          entityMentions: [{tag: "Animal", token: "cuckoo"}, {tag: "Sound", token: "cuckoo"}]
        },
				{
          rawText: "The wolf says: owooooo.",
          entityMentions: [{tag: "Animal", token: "wolf"}, {tag: "Sound", token: "owooooo"}]
        },
				{
          rawText: "The frog says: ribbit-ribbit.",
          entityMentions: [{tag: "Animal", token: "frog"}, {tag: "Sound", token: "ribbit-ribbit"}]
        },
				{
          rawText: "The duck says: quack-quack.",
          entityMentions: [{tag: "Animal", token: "duck"}, {tag: "Sound", token: "quack-quack"}]
        },
				{
          rawText: "The crow says: caw-caw.",
          entityMentions: [{tag: "Animal", token: "crow"}, {tag: "Sound", token: "caw-caw"}]
        },
				{
          rawText: "The pig says: oink-oink.",
          entityMentions: [{tag: "Animal", token: "pig"}, {tag: "Sound", token: "oink-oink"}]
        }
      ]
    }
  ) {
    id created
    timeToLearn {value units}
    trainParameters {id splitRate kFolds seed saveModel}
    fileURL {path {id}}
    trainStatistics {
      id phraseCount
      statsOverAll {
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
    }
    testStatistics {
      id phraseCount
      statsOverAll {
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
      statsPerEntity {
        tag
        precision recall f1Score
      }
    }
  }
}
```

</p>
</details>

<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "train": {
      "id": "animals",
      "created": "2019-06-19T23:16:12.641Z",
      "timeToLearn": {
        "value": 0.15,
        "units": "seconds"
      },
      "trainParameters": {
        "id": "{\"splitRate\":0.5,\"seed\":5}",
        "splitRate": 0.5,
        "kFolds": null,
        "seed": 5,
        "saveModel": true
      },
      "fileURL": {
        "path": {
          "id": "https://[CLUSTER].knowledge.maana.io:8443/downloads/[ID]/animals.ser.gz"
        }
      },
      "trainStatistics": {
        "id": "animals-train",
        "phraseCount": 10,
        "statsOverAll": {
          "tag": "OverAll",
          "expectedCount": 20,
          "observedCount": 20,
          "truePositives": 20,
          "falsePositives": 0,
          "falseNegatives": 0,
          "precision": 1,
          "recall": 1,
          "f1Score": 1
        }
      },
      "testStatistics": {
        "id": "animals-test",
        "phraseCount": 10,
        "statsOverAll": {
          "tag": "OverAll",
          "expectedCount": 20,
          "observedCount": 20,
          "truePositives": 20,
          "falsePositives": 0,
          "falseNegatives": 0,
          "precision": 1,
          "recall": 1,
          "f1Score": 1
        },
        "statsPerEntity": [
          {
            "tag": "Animal",
            "precision": 1,
            "recall": 1,
            "f1Score": 1
          },
          {
            "tag": "Sound",
            "precision": 1,
            "recall": 1,
            "f1Score": 1
          }
        ]
      }
    }
  }
}
```

</p>
</details>

### Test on texts with entities query

<details>
<summary>click to expand example</summary>
<p>

```python
query TestOnTextsWithEntities {
  test(
    modelURL: {
      path: {
        # Take this URL from the result of Train query or use getModelPath()
        id: "path/to/model/.../animals.ser.gz"
      }
    },
    labeledText: {
      id: "animals"
      author: "wiki"
      sources: [
        {
          rawText: "The cat says: meow-meow.",
          entityMentions: [{tag: "Animal", token: "cat"}, {tag: "Sound", token: "meow-meow"}]
        },
				{
          rawText: "The sheep says: baa-baa.",
          entityMentions: [{tag: "Animal", token: "sheep"}, {tag: "Sound", token: "baa-baa"}]
        },
				{
          rawText: "The horse says: neigh-neigh.",
          entityMentions: [{tag: "Animal", token: "horse"}, {tag: "Sound", token: "neigh-neigh"}]
        },
				{
          rawText: "The dog says: woof-woof.",
          entityMentions: [{tag: "Animal", token: "dog"}, {tag: "Sound", token: "woof-woof"}]
        },
				{
          rawText: "The sparrow says: cheep-cheep.",
          entityMentions: [{tag: "Animal", token: "sparrow"}, {tag: "Sound", token: "cheep-cheep"}]
        },
				{
          rawText: "The rooster says: cock-a-doodle-doo.",
          entityMentions: [{tag: "Animal", token: "rooster"}, {tag: "Sound", token: "cock-a-doodle-doo"}]
        },
				{
          rawText: "The hen says: cluck-cluck.",
          entityMentions: [{tag: "Animal", token: "hen"}, {tag: "Sound", token: "cluck-cluck"}]
        },
				{
          rawText: "The goose says: hhonk-honk.",
          entityMentions: [{tag: "Animal", token: "goose"}, {tag: "Sound", token: "hhonk-honk"}]
        },
				{
          rawText: "The turkey says: gobble-gobble.",
          entityMentions: [{tag: "Animal", token: "turkey"}, {tag: "Sound", token: "gobble-gobble"}]
        },
				{
          rawText: "The goat says: maa-maa.",
          entityMentions: [{tag: "Animal", token: "goat"}, {tag: "Sound", token: "maa-maa"}]
        },
				{
          rawText: "The cow says: moo-moo.",
          entityMentions: [{tag: "Animal", token: "cow"}, {tag: "Sound", token: "moo-moo"}]
        },
				{
          rawText: "The donkey says: hee-haw.",
          entityMentions: [{tag: "Animal", token: "donkey"}, {tag: "Sound", token: "hee-haw"}]
        },
				{
          rawText: "The pig says: oink-oink.",
          entityMentions: [{tag: "Animal", token: "pig"}, {tag: "Sound", token: "oink-oink"}]
        },
				{
          rawText: "The mouse says: squeak-squeak.",
          entityMentions: [{tag: "Animal", token: "mouse"}, {tag: "Sound", token: "squeak-squeak"}]
        },
				{
          rawText: "The cuckoo says: cuckoo.",
          entityMentions: [{tag: "Animal", token: "cuckoo"}, {tag: "Sound", token: "cuckoo"}]
        },
				{
          rawText: "The wolf says: owooooo.",
          entityMentions: [{tag: "Animal", token: "wolf"}, {tag: "Sound", token: "owooooo"}]
        },
				{
          rawText: "The frog says: ribbit-ribbit.",
          entityMentions: [{tag: "Animal", token: "frog"}, {tag: "Sound", token: "ribbit-ribbit"}]
        },
				{
          rawText: "The duck says: quack-quack.",
          entityMentions: [{tag: "Animal", token: "duck"}, {tag: "Sound", token: "quack-quack"}]
        },
				{
          rawText: "The crow says: caw-caw.",
          entityMentions: [{tag: "Animal", token: "crow"}, {tag: "Sound", token: "caw-caw"}]
        },
				{
          rawText: "The pig says: oink-oink.",
          entityMentions: [{tag: "Animal", token: "pig"}, {tag: "Sound", token: "oink-oink"}]
        }
      ]
    }
  ) {
      id phraseCount
      statsOverAll {
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
      statsPerEntity {
        tag
        precision recall f1Score
      }
  }
}
```

</p>
</details>
<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "test": {
      "id": "animals-test",
      "phraseCount": 20,
      "statsOverAll": {
        "tag": "OverAll",
        "expectedCount": 40,
        "observedCount": 40,
        "truePositives": 40,
        "falsePositives": 0,
        "falseNegatives": 0,
        "precision": 1,
        "recall": 1,
        "f1Score": 1
      },
      "statsPerEntity": [
        {
          "tag": "Animal",
          "precision": 1,
          "recall": 1,
          "f1Score": 1
        },
        {
          "tag": "Sound",
          "precision": 1,
          "recall": 1,
          "f1Score": 1
        }
      ]
    }
  }
}
```

</p>
</details>

### Extend query

This is three-in-one: train/test/extract queries.

<details>
<summary>click to expand example</summary>
<p>

```python
query ExtendOnTextsWithEntities {
  extend(
    model: {
      id: "animals-2",
      trainParameters: {
        splitRate: 1,
        saveModel: false
      },
      labeledText: {
        id: "animals"
        author: "wiki"
        sources: [
        {
          rawText: "The cat says: meow-meow.",
          entityMentions: [{tag: "Animal", token: "cat"}, {tag: "Sound", token: "meow-meow"}]
        },
				{
          rawText: "The sheep says: baa-baa.",
          entityMentions: [{tag: "Animal", token: "sheep"}, {tag: "Sound", token: "baa-baa"}]
        },
				{
          rawText: "The horse says: neigh-neigh.",
          entityMentions: [{tag: "Animal", token: "horse"}, {tag: "Sound", token: "neigh-neigh"}]
        },
				{
          rawText: "The dog says: woof-woof.",
          entityMentions: [{tag: "Animal", token: "dog"}, {tag: "Sound", token: "woof-woof"}]
        },
				{
          rawText: "The sparrow says: cheep-cheep.",
          entityMentions: [{tag: "Animal", token: "sparrow"}, {tag: "Sound", token: "cheep-cheep"}]
        },
				{
          rawText: "The rooster says: cock-a-doodle-doo.",
          entityMentions: [{tag: "Animal", token: "rooster"}, {tag: "Sound", token: "cock-a-doodle-doo"}]
        },
				{
          rawText: "The hen says: cluck-cluck.",
          entityMentions: [{tag: "Animal", token: "hen"}, {tag: "Sound", token: "cluck-cluck"}]
        },
				{
          rawText: "The goose says: hhonk-honk.",
          entityMentions: [{tag: "Animal", token: "goose"}, {tag: "Sound", token: "hhonk-honk"}]
        },
				{
          rawText: "The turkey says: gobble-gobble.",
          entityMentions: [{tag: "Animal", token: "turkey"}, {tag: "Sound", token: "gobble-gobble"}]
        },
				{
          rawText: "The goat says: maa-maa.",
          entityMentions: [{tag: "Animal", token: "goat"}, {tag: "Sound", token: "maa-maa"}]
        },
				{
          rawText: "The cow says: moo-moo.",
          entityMentions: [{tag: "Animal", token: "cow"}, {tag: "Sound", token: "moo-moo"}]
        },
				{
          rawText: "The donkey says: hee-haw.",
          entityMentions: [{tag: "Animal", token: "donkey"}, {tag: "Sound", token: "hee-haw"}]
        },
				{
          rawText: "The pig says: oink-oink.",
          entityMentions: [{tag: "Animal", token: "pig"}, {tag: "Sound", token: "oink-oink"}]
        },
				{
          rawText: "The mouse says: squeak-squeak.",
          entityMentions: [{tag: "Animal", token: "mouse"}, {tag: "Sound", token: "squeak-squeak"}]
        },
				{
          rawText: "The cuckoo says: cuckoo.",
          entityMentions: [{tag: "Animal", token: "cuckoo"}, {tag: "Sound", token: "cuckoo"}]
        },
				{
          rawText: "The wolf says: owooooo.",
          entityMentions: [{tag: "Animal", token: "wolf"}, {tag: "Sound", token: "owooooo"}]
        },
				{
          rawText: "The frog says: ribbit-ribbit.",
          entityMentions: [{tag: "Animal", token: "frog"}, {tag: "Sound", token: "ribbit-ribbit"}]
        },
				{
          rawText: "The duck says: quack-quack.",
          entityMentions: [{tag: "Animal", token: "duck"}, {tag: "Sound", token: "quack-quack"}]
        },
				{
          rawText: "The crow says: caw-caw.",
          entityMentions: [{tag: "Animal", token: "crow"}, {tag: "Sound", token: "caw-caw"}]
        },
				{
          rawText: "The pig says: oink-oink.",
          entityMentions: [{tag: "Animal", token: "pig"}, {tag: "Sound", token: "oink-oink"}]
        }
      ]
    }
    }
  ) {
    id created
    timeToLearn {value units}
    trainParameters {splitRate kFolds seed}
    fileURL {path {id}}
    trainStatistics {
      id phraseCount
      statsOverAll {
        id
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
    }
    testStatistics {
      id phraseCount
      statsOverAll {
        id
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
      statsPerEntity {
        id
        tag
        expectedCount observedCount
        truePositives falsePositives falseNegatives
        precision recall f1Score
      }
    }
    labeledText {
      id created author
      sources {
        id xText topAnnotationProbabilities
        entityMentions {
          id tag token span offset tokens start end
          labelProbabilities {id tag probability}
        }
      }
    }
  }
}
```

</p>
</details>

<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "extend": {
      "id": "animals-2",
      "created": "2019-06-19T23:21:51.752Z",
      "timeToLearn": {
        "value": 0.182,
        "units": "seconds"
      },
      "trainParameters": {
        "splitRate": 1,
        "kFolds": null,
        "seed": null
      },
      "fileURL": {
        "path": {
          "id": "https://[CLUSTER].knowledge.maana.io:8443/downloads/[ID]/animals-2.ser.gz"
        }
      },
      "trainStatistics": {
        "id": "animals-2-train",
        "phraseCount": 20,
        "statsOverAll": {
          "id": "animals-2-train-OverAll",
          "tag": "OverAll",
          "expectedCount": 40,
          "observedCount": 40,
          "truePositives": 40,
          "falsePositives": 0,
          "falseNegatives": 0,
          "precision": 1,
          "recall": 1,
          "f1Score": 1
        }
      },
      "testStatistics": {
        "id": "animals-2-test",
        "phraseCount": null,
        "statsOverAll": null,
        "statsPerEntity": null
      },
      "labeledText": {
        "id": "animals",
        "created": "2019-06-19T23:21:51.752Z",
        "author": "wiki",
        "sources": [
          {
            "id": "The cat says: meow-meow.",
            "xText": "The <Animal>cat</Animal> says: <Sound>meow-meow</Sound>.",
            "topAnnotationProbabilities": [
              0.992,
              0.00536,
              0.00143
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"cat\",\"span\":3}",
                "tag": "Animal",
                "token": "cat",
                "span": 3,
                "offset": 4,
                "tokens": [
                  "cat"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000578}",
                    "tag": "Sound",
                    "probability": 0.0000578
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000582}",
                    "tag": "O",
                    "probability": 0.0000582
                  }
                ]
              },
              {
                "id": "{\"offset\":14,\"tag\":\"Sound\",\"token\":\"meow-meow\",\"span\":9}",
                "tag": "Sound",
                "token": "meow-meow",
                "span": 9,
                "offset": 14,
                "tokens": [
                  "meow-meow."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00536}",
                    "tag": "Animal",
                    "probability": 0.00536
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.993}",
                    "tag": "Sound",
                    "probability": 0.993
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00163}",
                    "tag": "O",
                    "probability": 0.00163
                  }
                ]
              }
            ]
          },
          {
            "id": "The sheep says: baa-baa.",
            "xText": "The <Animal>sheep</Animal> says: <Sound>baa-baa</Sound>.",
            "topAnnotationProbabilities": [
              0.993,
              0.0042,
              0.00123
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"sheep\",\"span\":5}",
                "tag": "Animal",
                "token": "sheep",
                "span": 5,
                "offset": 4,
                "tokens": [
                  "sheep"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000329}",
                    "tag": "Sound",
                    "probability": 0.0000329
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000323}",
                    "tag": "O",
                    "probability": 0.0000323
                  }
                ]
              },
              {
                "id": "{\"offset\":16,\"tag\":\"Sound\",\"token\":\"baa-baa\",\"span\":7}",
                "tag": "Sound",
                "token": "baa-baa",
                "span": 7,
                "offset": 16,
                "tokens": [
                  "baa-baa."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.0042}",
                    "tag": "Animal",
                    "probability": 0.0042
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.994}",
                    "tag": "Sound",
                    "probability": 0.994
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0014}",
                    "tag": "O",
                    "probability": 0.0014
                  }
                ]
              }
            ]
          },
          {
            "id": "The horse says: neigh-neigh.",
            "xText": "The <Animal>horse</Animal> says: <Sound>neigh-neigh</Sound>.",
            "topAnnotationProbabilities": [
              0.992,
              0.00496,
              0.00168
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"horse\",\"span\":5}",
                "tag": "Animal",
                "token": "horse",
                "span": 5,
                "offset": 4,
                "tokens": [
                  "horse"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000317}",
                    "tag": "Sound",
                    "probability": 0.0000317
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000274}",
                    "tag": "O",
                    "probability": 0.0000274
                  }
                ]
              },
              {
                "id": "{\"offset\":16,\"tag\":\"Sound\",\"token\":\"neigh-neigh\",\"span\":11}",
                "tag": "Sound",
                "token": "neigh-neigh",
                "span": 11,
                "offset": 16,
                "tokens": [
                  "neigh-neigh."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00496}",
                    "tag": "Animal",
                    "probability": 0.00496
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.993}",
                    "tag": "Sound",
                    "probability": 0.993
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00192}",
                    "tag": "O",
                    "probability": 0.00192
                  }
                ]
              }
            ]
          },
          {
            "id": "The dog says: woof-woof.",
            "xText": "The <Animal>dog</Animal> says: <Sound>woof-woof</Sound>.",
            "topAnnotationProbabilities": [
              0.992,
              0.0054,
              0.00168
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"dog\",\"span\":3}",
                "tag": "Animal",
                "token": "dog",
                "span": 3,
                "offset": 4,
                "tokens": [
                  "dog"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000516}",
                    "tag": "Sound",
                    "probability": 0.0000516
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000573}",
                    "tag": "O",
                    "probability": 0.0000573
                  }
                ]
              },
              {
                "id": "{\"offset\":14,\"tag\":\"Sound\",\"token\":\"woof-woof\",\"span\":9}",
                "tag": "Sound",
                "token": "woof-woof",
                "span": 9,
                "offset": 14,
                "tokens": [
                  "woof-woof."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.0054}",
                    "tag": "Animal",
                    "probability": 0.0054
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.993}",
                    "tag": "Sound",
                    "probability": 0.993
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00192}",
                    "tag": "O",
                    "probability": 0.00192
                  }
                ]
              }
            ]
          },
          {
            "id": "The sparrow says: cheep-cheep.",
            "xText": "The <Animal>sparrow</Animal> says: <Sound>cheep-cheep</Sound>.",
            "topAnnotationProbabilities": [
              0.992,
              0.00524,
              0.00145
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"sparrow\",\"span\":7}",
                "tag": "Animal",
                "token": "sparrow",
                "span": 7,
                "offset": 4,
                "tokens": [
                  "sparrow"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000308}",
                    "tag": "Sound",
                    "probability": 0.0000308
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000287}",
                    "tag": "O",
                    "probability": 0.0000287
                  }
                ]
              },
              {
                "id": "{\"offset\":18,\"tag\":\"Sound\",\"token\":\"cheep-cheep\",\"span\":11}",
                "tag": "Sound",
                "token": "cheep-cheep",
                "span": 11,
                "offset": 18,
                "tokens": [
                  "cheep-cheep."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00524}",
                    "tag": "Animal",
                    "probability": 0.00524
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.993}",
                    "tag": "Sound",
                    "probability": 0.993
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00166}",
                    "tag": "O",
                    "probability": 0.00166
                  }
                ]
              }
            ]
          },
          {
            "id": "The rooster says: cock-a-doodle-doo.",
            "xText": "The <Animal>rooster</Animal> says: <Sound>cock-a-doodle-doo</Sound>.",
            "topAnnotationProbabilities": [
              0.994,
              0.00352,
              0.000973
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"rooster\",\"span\":7}",
                "tag": "Animal",
                "token": "rooster",
                "span": 7,
                "offset": 4,
                "tokens": [
                  "rooster"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000325}",
                    "tag": "Sound",
                    "probability": 0.0000325
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.000032}",
                    "tag": "O",
                    "probability": 0.000032
                  }
                ]
              },
              {
                "id": "{\"offset\":18,\"tag\":\"Sound\",\"token\":\"cock-a-doodle-doo\",\"span\":17}",
                "tag": "Sound",
                "token": "cock-a-doodle-doo",
                "span": 17,
                "offset": 18,
                "tokens": [
                  "cock-a-doodle-doo."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00352}",
                    "tag": "Animal",
                    "probability": 0.00352
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.995}",
                    "tag": "Sound",
                    "probability": 0.995
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00111}",
                    "tag": "O",
                    "probability": 0.00111
                  }
                ]
              }
            ]
          },
          {
            "id": "The hen says: cluck-cluck.",
            "xText": "The <Animal>hen</Animal> says: <Sound>cluck-cluck</Sound>.",
            "topAnnotationProbabilities": [
              0.993,
              0.00479,
              0.00126
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"hen\",\"span\":3}",
                "tag": "Animal",
                "token": "hen",
                "span": 3,
                "offset": 4,
                "tokens": [
                  "hen"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.000056}",
                    "tag": "Sound",
                    "probability": 0.000056
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000634}",
                    "tag": "O",
                    "probability": 0.0000634
                  }
                ]
              },
              {
                "id": "{\"offset\":14,\"tag\":\"Sound\",\"token\":\"cluck-cluck\",\"span\":11}",
                "tag": "Sound",
                "token": "cluck-cluck",
                "span": 11,
                "offset": 14,
                "tokens": [
                  "cluck-cluck."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00479}",
                    "tag": "Animal",
                    "probability": 0.00479
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.994}",
                    "tag": "Sound",
                    "probability": 0.994
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00143}",
                    "tag": "O",
                    "probability": 0.00143
                  }
                ]
              }
            ]
          },
          {
            "id": "The goose says: hhonk-honk.",
            "xText": "The <Animal>goose</Animal> says: <Sound>hhonk-honk</Sound>.",
            "topAnnotationProbabilities": [
              0.993,
              0.00487,
              0.00141
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"goose\",\"span\":5}",
                "tag": "Animal",
                "token": "goose",
                "span": 5,
                "offset": 4,
                "tokens": [
                  "goose"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000309}",
                    "tag": "Sound",
                    "probability": 0.0000309
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000278}",
                    "tag": "O",
                    "probability": 0.0000278
                  }
                ]
              },
              {
                "id": "{\"offset\":16,\"tag\":\"Sound\",\"token\":\"hhonk-honk\",\"span\":10}",
                "tag": "Sound",
                "token": "hhonk-honk",
                "span": 10,
                "offset": 16,
                "tokens": [
                  "hhonk-honk."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00487}",
                    "tag": "Animal",
                    "probability": 0.00487
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.994}",
                    "tag": "Sound",
                    "probability": 0.994
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0016}",
                    "tag": "O",
                    "probability": 0.0016
                  }
                ]
              }
            ]
          },
          {
            "id": "The turkey says: gobble-gobble.",
            "xText": "The <Animal>turkey</Animal> says: <Sound>gobble-gobble</Sound>.",
            "topAnnotationProbabilities": [
              0.992,
              0.00543,
              0.00156
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"turkey\",\"span\":6}",
                "tag": "Animal",
                "token": "turkey",
                "span": 6,
                "offset": 4,
                "tokens": [
                  "turkey"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000304}",
                    "tag": "Sound",
                    "probability": 0.0000304
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000305}",
                    "tag": "O",
                    "probability": 0.0000305
                  }
                ]
              },
              {
                "id": "{\"offset\":17,\"tag\":\"Sound\",\"token\":\"gobble-gobble\",\"span\":13}",
                "tag": "Sound",
                "token": "gobble-gobble",
                "span": 13,
                "offset": 17,
                "tokens": [
                  "gobble-gobble."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00543}",
                    "tag": "Animal",
                    "probability": 0.00543
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.993}",
                    "tag": "Sound",
                    "probability": 0.993
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00178}",
                    "tag": "O",
                    "probability": 0.00178
                  }
                ]
              }
            ]
          },
          {
            "id": "The goat says: maa-maa.",
            "xText": "The <Animal>goat</Animal> says: <Sound>maa-maa</Sound>.",
            "topAnnotationProbabilities": [
              0.994,
              0.00416,
              0.00116
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"goat\",\"span\":4}",
                "tag": "Animal",
                "token": "goat",
                "span": 4,
                "offset": 4,
                "tokens": [
                  "goat"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000302}",
                    "tag": "Sound",
                    "probability": 0.0000302
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000282}",
                    "tag": "O",
                    "probability": 0.0000282
                  }
                ]
              },
              {
                "id": "{\"offset\":15,\"tag\":\"Sound\",\"token\":\"maa-maa\",\"span\":7}",
                "tag": "Sound",
                "token": "maa-maa",
                "span": 7,
                "offset": 15,
                "tokens": [
                  "maa-maa."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00416}",
                    "tag": "Animal",
                    "probability": 0.00416
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.995}",
                    "tag": "Sound",
                    "probability": 0.995
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00132}",
                    "tag": "O",
                    "probability": 0.00132
                  }
                ]
              }
            ]
          },
          {
            "id": "The cow says: moo-moo.",
            "xText": "The <Animal>cow</Animal> says: <Sound>moo-moo</Sound>.",
            "topAnnotationProbabilities": [
              0.994,
              0.00345,
              0.00105
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"cow\",\"span\":3}",
                "tag": "Animal",
                "token": "cow",
                "span": 3,
                "offset": 4,
                "tokens": [
                  "cow"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000576}",
                    "tag": "Sound",
                    "probability": 0.0000576
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000544}",
                    "tag": "O",
                    "probability": 0.0000544
                  }
                ]
              },
              {
                "id": "{\"offset\":14,\"tag\":\"Sound\",\"token\":\"moo-moo\",\"span\":7}",
                "tag": "Sound",
                "token": "moo-moo",
                "span": 7,
                "offset": 14,
                "tokens": [
                  "moo-moo."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00345}",
                    "tag": "Animal",
                    "probability": 0.00345
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.995}",
                    "tag": "Sound",
                    "probability": 0.995
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0012}",
                    "tag": "O",
                    "probability": 0.0012
                  }
                ]
              }
            ]
          },
          {
            "id": "The donkey says: hee-haw.",
            "xText": "The <Animal>donkey</Animal> says: <Sound>hee-haw</Sound>.",
            "topAnnotationProbabilities": [
              0.992,
              0.00521,
              0.00134
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"donkey\",\"span\":6}",
                "tag": "Animal",
                "token": "donkey",
                "span": 6,
                "offset": 4,
                "tokens": [
                  "donkey"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000301}",
                    "tag": "Sound",
                    "probability": 0.0000301
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000266}",
                    "tag": "O",
                    "probability": 0.0000266
                  }
                ]
              },
              {
                "id": "{\"offset\":17,\"tag\":\"Sound\",\"token\":\"hee-haw\",\"span\":7}",
                "tag": "Sound",
                "token": "hee-haw",
                "span": 7,
                "offset": 17,
                "tokens": [
                  "hee-haw."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00521}",
                    "tag": "Animal",
                    "probability": 0.00521
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.993}",
                    "tag": "Sound",
                    "probability": 0.993
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00154}",
                    "tag": "O",
                    "probability": 0.00154
                  }
                ]
              }
            ]
          },
          {
            "id": "The pig says: oink-oink.",
            "xText": "The <Animal>pig</Animal> says: <Sound>oink-oink</Sound>.",
            "topAnnotationProbabilities": [
              0.993,
              0.00418,
              0.00131
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"pig\",\"span\":3}",
                "tag": "Animal",
                "token": "pig",
                "span": 3,
                "offset": 4,
                "tokens": [
                  "pig"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000415}",
                    "tag": "Sound",
                    "probability": 0.0000415
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000492}",
                    "tag": "O",
                    "probability": 0.0000492
                  }
                ]
              },
              {
                "id": "{\"offset\":14,\"tag\":\"Sound\",\"token\":\"oink-oink\",\"span\":9}",
                "tag": "Sound",
                "token": "oink-oink",
                "span": 9,
                "offset": 14,
                "tokens": [
                  "oink-oink."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00418}",
                    "tag": "Animal",
                    "probability": 0.00418
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.994}",
                    "tag": "Sound",
                    "probability": 0.994
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0015}",
                    "tag": "O",
                    "probability": 0.0015
                  }
                ]
              }
            ]
          },
          {
            "id": "The mouse says: squeak-squeak.",
            "xText": "The <Animal>mouse</Animal> says: <Sound>squeak-squeak</Sound>.",
            "topAnnotationProbabilities": [
              0.992,
              0.00483,
              0.00158
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"mouse\",\"span\":5}",
                "tag": "Animal",
                "token": "mouse",
                "span": 5,
                "offset": 4,
                "tokens": [
                  "mouse"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000337}",
                    "tag": "Sound",
                    "probability": 0.0000337
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000275}",
                    "tag": "O",
                    "probability": 0.0000275
                  }
                ]
              },
              {
                "id": "{\"offset\":16,\"tag\":\"Sound\",\"token\":\"squeak-squeak\",\"span\":13}",
                "tag": "Sound",
                "token": "squeak-squeak",
                "span": 13,
                "offset": 16,
                "tokens": [
                  "squeak-squeak."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00483}",
                    "tag": "Animal",
                    "probability": 0.00483
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.993}",
                    "tag": "Sound",
                    "probability": 0.993
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00181}",
                    "tag": "O",
                    "probability": 0.00181
                  }
                ]
              }
            ]
          },
          {
            "id": "The cuckoo says: cuckoo.",
            "xText": "The <Animal>cuckoo</Animal> says: <Sound>cuckoo</Sound>.",
            "topAnnotationProbabilities": [
              1,
              0.000115,
              0.0000484
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"cuckoo\",\"span\":6}",
                "tag": "Animal",
                "token": "cuckoo",
                "span": 6,
                "offset": 4,
                "tokens": [
                  "cuckoo"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000526}",
                    "tag": "Sound",
                    "probability": 0.0000526
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000247}",
                    "tag": "O",
                    "probability": 0.0000247
                  }
                ]
              },
              {
                "id": "{\"offset\":17,\"tag\":\"Sound\",\"token\":\"cuckoo\",\"span\":6}",
                "tag": "Sound",
                "token": "cuckoo",
                "span": 6,
                "offset": 17,
                "tokens": [
                  "cuckoo."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.000115}",
                    "tag": "Animal",
                    "probability": 0.000115
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":1}",
                    "tag": "Sound",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000181}",
                    "tag": "O",
                    "probability": 0.0000181
                  }
                ]
              }
            ]
          },
          {
            "id": "The wolf says: owooooo.",
            "xText": "The <Animal>wolf</Animal> says: <Sound>owooooo</Sound>.",
            "topAnnotationProbabilities": [
              1,
              0.0000935,
              0.0000469
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"wolf\",\"span\":4}",
                "tag": "Animal",
                "token": "wolf",
                "span": 4,
                "offset": 4,
                "tokens": [
                  "wolf"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000241}",
                    "tag": "Sound",
                    "probability": 0.0000241
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000236}",
                    "tag": "O",
                    "probability": 0.0000236
                  }
                ]
              },
              {
                "id": "{\"offset\":15,\"tag\":\"Sound\",\"token\":\"owooooo\",\"span\":7}",
                "tag": "Sound",
                "token": "owooooo",
                "span": 7,
                "offset": 15,
                "tokens": [
                  "owooooo."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.0000935}",
                    "tag": "Animal",
                    "probability": 0.0000935
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":1}",
                    "tag": "Sound",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000199}",
                    "tag": "O",
                    "probability": 0.0000199
                  }
                ]
              }
            ]
          },
          {
            "id": "The frog says: ribbit-ribbit.",
            "xText": "The <Animal>frog</Animal> says: <Sound>ribbit-ribbit</Sound>.",
            "topAnnotationProbabilities": [
              0.992,
              0.00532,
              0.00166
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"frog\",\"span\":4}",
                "tag": "Animal",
                "token": "frog",
                "span": 4,
                "offset": 4,
                "tokens": [
                  "frog"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.000029}",
                    "tag": "Sound",
                    "probability": 0.000029
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000288}",
                    "tag": "O",
                    "probability": 0.0000288
                  }
                ]
              },
              {
                "id": "{\"offset\":15,\"tag\":\"Sound\",\"token\":\"ribbit-ribbit\",\"span\":13}",
                "tag": "Sound",
                "token": "ribbit-ribbit",
                "span": 13,
                "offset": 15,
                "tokens": [
                  "ribbit-ribbit."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00532}",
                    "tag": "Animal",
                    "probability": 0.00532
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.993}",
                    "tag": "Sound",
                    "probability": 0.993
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00189}",
                    "tag": "O",
                    "probability": 0.00189
                  }
                ]
              }
            ]
          },
          {
            "id": "The duck says: quack-quack.",
            "xText": "The <Animal>duck</Animal> says: <Sound>quack-quack</Sound>.",
            "topAnnotationProbabilities": [
              0.993,
              0.00476,
              0.00145
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"duck\",\"span\":4}",
                "tag": "Animal",
                "token": "duck",
                "span": 4,
                "offset": 4,
                "tokens": [
                  "duck"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000352}",
                    "tag": "Sound",
                    "probability": 0.0000352
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000273}",
                    "tag": "O",
                    "probability": 0.0000273
                  }
                ]
              },
              {
                "id": "{\"offset\":15,\"tag\":\"Sound\",\"token\":\"quack-quack\",\"span\":11}",
                "tag": "Sound",
                "token": "quack-quack",
                "span": 11,
                "offset": 15,
                "tokens": [
                  "quack-quack."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00476}",
                    "tag": "Animal",
                    "probability": 0.00476
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.994}",
                    "tag": "Sound",
                    "probability": 0.994
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00165}",
                    "tag": "O",
                    "probability": 0.00165
                  }
                ]
              }
            ]
          },
          {
            "id": "The crow says: caw-caw.",
            "xText": "The <Animal>crow</Animal> says: <Sound>caw-caw</Sound>.",
            "topAnnotationProbabilities": [
              0.993,
              0.00488,
              0.00117
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"crow\",\"span\":4}",
                "tag": "Animal",
                "token": "crow",
                "span": 4,
                "offset": 4,
                "tokens": [
                  "crow"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000319}",
                    "tag": "Sound",
                    "probability": 0.0000319
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000243}",
                    "tag": "O",
                    "probability": 0.0000243
                  }
                ]
              },
              {
                "id": "{\"offset\":15,\"tag\":\"Sound\",\"token\":\"caw-caw\",\"span\":7}",
                "tag": "Sound",
                "token": "caw-caw",
                "span": 7,
                "offset": 15,
                "tokens": [
                  "caw-caw."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00488}",
                    "tag": "Animal",
                    "probability": 0.00488
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.994}",
                    "tag": "Sound",
                    "probability": 0.994
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.00134}",
                    "tag": "O",
                    "probability": 0.00134
                  }
                ]
              }
            ]
          },
          {
            "id": "The pig says: oink-oink.",
            "xText": "The <Animal>pig</Animal> says: <Sound>oink-oink</Sound>.",
            "topAnnotationProbabilities": [
              0.993,
              0.00418,
              0.00131
            ],
            "entityMentions": [
              {
                "id": "{\"offset\":4,\"tag\":\"Animal\",\"token\":\"pig\",\"span\":3}",
                "tag": "Animal",
                "token": "pig",
                "span": 3,
                "offset": 4,
                "tokens": [
                  "pig"
                ],
                "start": 1,
                "end": 2,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":1}",
                    "tag": "Animal",
                    "probability": 1
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.0000415}",
                    "tag": "Sound",
                    "probability": 0.0000415
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0000492}",
                    "tag": "O",
                    "probability": 0.0000492
                  }
                ]
              },
              {
                "id": "{\"offset\":14,\"tag\":\"Sound\",\"token\":\"oink-oink\",\"span\":9}",
                "tag": "Sound",
                "token": "oink-oink",
                "span": 9,
                "offset": 14,
                "tokens": [
                  "oink-oink."
                ],
                "start": 3,
                "end": 4,
                "labelProbabilities": [
                  {
                    "id": "{\"tag\":\"Animal\",\"probability\":0.00418}",
                    "tag": "Animal",
                    "probability": 0.00418
                  },
                  {
                    "id": "{\"tag\":\"Sound\",\"probability\":0.994}",
                    "tag": "Sound",
                    "probability": 0.994
                  },
                  {
                    "id": "{\"tag\":\"O\",\"probability\":0.0015}",
                    "tag": "O",
                    "probability": 0.0015
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  }
}
```

</p>
</details>

### Extract with Stanford Model query

<details>
<summary>click to expand example</summary>
<p>

```python
query ExtractWithStanford {
  extract(
    text: "Mikhael lives in Seattle and works for Google."
  ) {
    xText
    entityMentions {
      tag token span offset tokens start end
    }
  }
}
```

</p>
</details>

<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "extract": {
      "xText": "<Person>Mikhael</Person> lives in <Location>Seattle</Location> and works for <Organization>Google</Organization>.",
      "entityMentions": [
        {
          "tag": "Person",
          "token": "Mikhael",
          "span": 7,
          "offset": 0,
          "tokens": [
            "Mikhael"
          ],
          "start": 0,
          "end": 1
        },
        {
          "tag": "Location",
          "token": "Seattle",
          "span": 7,
          "offset": 17,
          "tokens": [
            "Seattle"
          ],
          "start": 3,
          "end": 4
        },
        {
          "tag": "Organization",
          "token": "Google",
          "span": 6,
          "offset": 39,
          "tokens": [
            "Google."
          ],
          "start": 7,
          "end": 8
        }
      ]
    }
  }
}
```

</p>
</details>

### ExtractBatch with Stanford Model query

<details>
<summary>click to expand example</summary>
<p>

```python
query ExtractBatchWithStanford {
  extractBatch(
    texts: [
      "Saint Petersburg (Russian: Санкт-Петербу́рг) is Russia's second-largest city after Moscow, with 5 million inhabitants in 2012, part of the Saint Petersburg agglomeration with a population of 6.2 million (2015).",
      "An important Russian port on the Baltic Sea, it has a status of a federal subject (a federal city).",
      "Situated on the Neva River, at the head of the Gulf of Finland on the Baltic Sea, it was founded by Tsar Peter the Great on 27 May [O.S. 16 May] 1703.",
      "On 1 September 1914, the name was changed from Saint Petersburg to Petrograd (Russian: Петрогра́д), on 26 January 1924 to Leningrad (Russian: Ленингра́д), and on 1 October 1991 back to its original name.",
      "During the periods 1713–1728 and 1732–1918, Saint Petersburg was the capital of Imperial Russia. In 1918, the central government bodies moved to Moscow, which is about 625 km (388 miles) to the south-east.",
      "Saint Petersburg is one of the most modern cities of Russia, as well as its cultural capital. The Historic Centre of Saint Petersburg and Related Groups of Monuments constitute a UNESCO World Heritage Site.",
      "Saint Petersburg is home to the Hermitage, one of the largest art museums in the world. Many foreign consulates, international corporations, banks and businesses have offices in Saint Petersburg."
    ]
  ) {
    xText
    entityMentions {
      tag token span offset tokens start end
    }
  }
}
```

</p>
</details>

<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "extractBatch": [
      {
        "xText": "<Person>Saint Petersburg</Person> (<MISC>Russian</MISC>: Санкт-Петербу́рг) is <Location>Russia</Location>'s second-largest city after <Location>Moscow</Location>, with <Number>5 million</Number> inhabitants in <DateKind>2012</DateKind>, part of the <Location>Saint Petersburg</Location> agglomeration with a population of <Number>6.2 million</Number> (<DateKind>2015</DateKind>).",
        "entityMentions": [
          {
            "tag": "Person",
            "token": "Saint Petersburg",
            "span": 16,
            "offset": 0,
            "tokens": [
              "Saint",
              "Petersburg"
            ],
            "start": 0,
            "end": 2
          },
          {
            "tag": "MISC",
            "token": "Russian",
            "span": 7,
            "offset": 18,
            "tokens": [
              "(Russian:"
            ],
            "start": 2,
            "end": 3
          },
          {
            "tag": "Location",
            "token": "Russia",
            "span": 6,
            "offset": 48,
            "tokens": [
              "Russia's"
            ],
            "start": 5,
            "end": 6
          },
          {
            "tag": "Location",
            "token": "Moscow",
            "span": 6,
            "offset": 83,
            "tokens": [
              "Moscow,"
            ],
            "start": 9,
            "end": 10
          },
          {
            "tag": "Number",
            "token": "5 million",
            "span": 9,
            "offset": 96,
            "tokens": [
              "5",
              "million"
            ],
            "start": 11,
            "end": 13
          },
          {
            "tag": "DateKind",
            "token": "2012",
            "span": 4,
            "offset": 121,
            "tokens": [
              "2012,"
            ],
            "start": 15,
            "end": 16
          },
          {
            "tag": "Location",
            "token": "Saint Petersburg",
            "span": 16,
            "offset": 139,
            "tokens": [
              "Saint",
              "Petersburg"
            ],
            "start": 19,
            "end": 21
          },
          {
            "tag": "Number",
            "token": "6.2 million",
            "span": 11,
            "offset": 191,
            "tokens": [
              "6.2",
              "million"
            ],
            "start": 26,
            "end": 28
          },
          {
            "tag": "DateKind",
            "token": "2015",
            "span": 4,
            "offset": 204,
            "tokens": [
              "(2015)."
            ],
            "start": 28,
            "end": 29
          }
        ]
      },
      {
        "xText": "An important <MISC>Russian</MISC> port on the <Location>Baltic Sea</Location>, it has a status of a federal subject (a federal city).",
        "entityMentions": [
          {
            "tag": "MISC",
            "token": "Russian",
            "span": 7,
            "offset": 13,
            "tokens": [
              "Russian"
            ],
            "start": 2,
            "end": 3
          },
          {
            "tag": "Location",
            "token": "Baltic Sea",
            "span": 10,
            "offset": 33,
            "tokens": [
              "Baltic",
              "Sea,"
            ],
            "start": 6,
            "end": 8
          }
        ]
      },
      {
        "xText": "Situated on the <Location>Neva River</Location>, at the head of the <Location>Gulf of Finland</Location> on the <Location>Baltic Sea</Location>, it was founded by <Person>Tsar Peter</Person> the Great on <DateKind>27 May</DateKind> [<DateKind>O.S. 16 May</DateKind>] <>1703</>.",
        "entityMentions": [
          {
            "tag": "Location",
            "token": "Neva River",
            "span": 10,
            "offset": 16,
            "tokens": [
              "Neva",
              "River,"
            ],
            "start": 3,
            "end": 5
          },
          {
            "tag": "Location",
            "token": "Gulf of Finland",
            "span": 15,
            "offset": 47,
            "tokens": [
              "Gulf",
              "of",
              "Finland"
            ],
            "start": 10,
            "end": 13
          },
          {
            "tag": "Location",
            "token": "Baltic Sea",
            "span": 10,
            "offset": 70,
            "tokens": [
              "Baltic",
              "Sea,"
            ],
            "start": 15,
            "end": 17
          },
          {
            "tag": "Person",
            "token": "Tsar Peter",
            "span": 10,
            "offset": 100,
            "tokens": [
              "Tsar",
              "Peter"
            ],
            "start": 21,
            "end": 23
          },
          {
            "tag": "DateKind",
            "token": "27 May",
            "span": 6,
            "offset": 124,
            "tokens": [
              "27",
              "May"
            ],
            "start": 26,
            "end": 28
          },
          {
            "tag": "DateKind",
            "token": "O.S. 16 May",
            "span": 11,
            "offset": 132,
            "tokens": [
              "[O.S.",
              "16",
              "May]"
            ],
            "start": 28,
            "end": 31
          },
          {
            "tag": "",
            "token": "1703",
            "span": 4,
            "offset": 145,
            "tokens": [
              "1703."
            ],
            "start": 31,
            "end": 32
          }
        ]
      },
      {
        "xText": "On <DateKind>1 September 1914</DateKind>, the name was changed from <Location>Saint Petersburg</Location> to <Location>Petrograd</Location> (<MISC>Russian</MISC>: Петрогра́д), on <DateKind>26 January 1924</DateKind> to <Location>Leningrad</Location> (<MISC>Russian</MISC>: Ленингра́д), and on <DateKind>1 October 1991</DateKind> back to its original name.",
        "entityMentions": [
          {
            "tag": "DateKind",
            "token": "1 September 1914",
            "span": 16,
            "offset": 3,
            "tokens": [
              "1",
              "September",
              "1914,"
            ],
            "start": 1,
            "end": 4
          },
          {
            "tag": "Location",
            "token": "Saint Petersburg",
            "span": 16,
            "offset": 47,
            "tokens": [
              "Saint",
              "Petersburg"
            ],
            "start": 9,
            "end": 11
          },
          {
            "tag": "Location",
            "token": "Petrograd",
            "span": 9,
            "offset": 67,
            "tokens": [
              "Petrograd"
            ],
            "start": 12,
            "end": 13
          },
          {
            "tag": "MISC",
            "token": "Russian",
            "span": 7,
            "offset": 78,
            "tokens": [
              "(Russian:"
            ],
            "start": 13,
            "end": 14
          },
          {
            "tag": "DateKind",
            "token": "26 January 1924",
            "span": 15,
            "offset": 103,
            "tokens": [
              "26",
              "January",
              "1924"
            ],
            "start": 16,
            "end": 19
          },
          {
            "tag": "Location",
            "token": "Leningrad",
            "span": 9,
            "offset": 122,
            "tokens": [
              "Leningrad"
            ],
            "start": 20,
            "end": 21
          },
          {
            "tag": "MISC",
            "token": "Russian",
            "span": 7,
            "offset": 133,
            "tokens": [
              "(Russian:"
            ],
            "start": 21,
            "end": 22
          },
          {
            "tag": "DateKind",
            "token": "1 October 1991",
            "span": 14,
            "offset": 162,
            "tokens": [
              "1",
              "October",
              "1991"
            ],
            "start": 25,
            "end": 28
          }
        ]
      },
      {
        "xText": "During the periods <>1713</>–<>1728</> and <>1732</>–<DateKind>1918</DateKind>, <Location>Saint Petersburg</Location> was the capital of Imperial <Location>Russia</Location>. In <DateKind>1918</DateKind>, the central government bodies moved to <Location>Moscow</Location>, which is about <Number>625</Number> km (<Number>388</Number> miles) to the south-east.",
        "entityMentions": [
          {
            "tag": "",
            "token": "1713",
            "span": 4,
            "offset": 19,
            "tokens": [
              "1713–1728"
            ],
            "start": 3,
            "end": 4
          },
          {
            "tag": "",
            "token": "1728",
            "span": 4,
            "offset": 24,
            "tokens": [
              "1713–1728"
            ],
            "start": 3,
            "end": 4
          },
          {
            "tag": "",
            "token": "1732",
            "span": 4,
            "offset": 33,
            "tokens": [
              "1732–1918,"
            ],
            "start": 5,
            "end": 6
          },
          {
            "tag": "DateKind",
            "token": "1918",
            "span": 4,
            "offset": 38,
            "tokens": [
              "1732–1918,"
            ],
            "start": 5,
            "end": 6
          },
          {
            "tag": "Location",
            "token": "Saint Petersburg",
            "span": 16,
            "offset": 44,
            "tokens": [
              "Saint",
              "Petersburg"
            ],
            "start": 6,
            "end": 8
          },
          {
            "tag": "Location",
            "token": "Russia",
            "span": 6,
            "offset": 89,
            "tokens": [
              "Russia."
            ],
            "start": 13,
            "end": 14
          },
          {
            "tag": "DateKind",
            "token": "1918",
            "span": 4,
            "offset": 100,
            "tokens": [
              "1918,"
            ],
            "start": 15,
            "end": 16
          },
          {
            "tag": "Location",
            "token": "Moscow",
            "span": 6,
            "offset": 145,
            "tokens": [
              "Moscow,"
            ],
            "start": 22,
            "end": 23
          },
          {
            "tag": "Number",
            "token": "625",
            "span": 3,
            "offset": 168,
            "tokens": [
              "625"
            ],
            "start": 26,
            "end": 27
          },
          {
            "tag": "Number",
            "token": "388",
            "span": 3,
            "offset": 176,
            "tokens": [
              "(388"
            ],
            "start": 28,
            "end": 29
          }
        ]
      },
      {
        "xText": "<Location>Saint Petersburg</Location> is <Number>one</Number> of the most modern cities of <Location>Russia</Location>, as well as its cultural capital. The Historic Centre of <Location>Saint Petersburg</Location> and Related Groups of Monuments constitute a <Organization>UNESCO</Organization> World Heritage Site.",
        "entityMentions": [
          {
            "tag": "Location",
            "token": "Saint Petersburg",
            "span": 16,
            "offset": 0,
            "tokens": [
              "Saint",
              "Petersburg"
            ],
            "start": 0,
            "end": 2
          },
          {
            "tag": "Number",
            "token": "one",
            "span": 3,
            "offset": 20,
            "tokens": [
              "one"
            ],
            "start": 3,
            "end": 4
          },
          {
            "tag": "Location",
            "token": "Russia",
            "span": 6,
            "offset": 53,
            "tokens": [
              "Russia,"
            ],
            "start": 10,
            "end": 11
          },
          {
            "tag": "Location",
            "token": "Saint Petersburg",
            "span": 16,
            "offset": 117,
            "tokens": [
              "Saint",
              "Petersburg"
            ],
            "start": 21,
            "end": 23
          },
          {
            "tag": "Organization",
            "token": "UNESCO",
            "span": 6,
            "offset": 179,
            "tokens": [
              "UNESCO"
            ],
            "start": 30,
            "end": 31
          }
        ]
      },
      {
        "xText": "<Location>Saint Petersburg</Location> is home to the Hermitage, <Number>one</Number> of the largest art museums in the world. Many foreign consulates, international corporations, banks and businesses have offices in <Location>Saint Petersburg</Location>.",
        "entityMentions": [
          {
            "tag": "Location",
            "token": "Saint Petersburg",
            "span": 16,
            "offset": 0,
            "tokens": [
              "Saint",
              "Petersburg"
            ],
            "start": 0,
            "end": 2
          },
          {
            "tag": "Number",
            "token": "one",
            "span": 3,
            "offset": 43,
            "tokens": [
              "one"
            ],
            "start": 7,
            "end": 8
          },
          {
            "tag": "Location",
            "token": "Saint Petersburg",
            "span": 16,
            "offset": 178,
            "tokens": [
              "Saint",
              "Petersburg."
            ],
            "start": 27,
            "end": 29
          }
        ]
      }
    ]
  }
}
```

</p>
</details>

### Extract with custom Model query

<details>
<summary>click to expand example</summary>
<p>

```python
query Extract {
  extract(
    text: "The wolf says: owooooo. The goose says: hhonk-honk. The cat says: meow-meow.",
    modelURL: {
      path: {
        # Take this URL from the result of Train query or use getModelPath()
        id: "path/to/model/.../animals.ser.gz"
      }
    }
  ) {
    rawText xText
    topAnnotationProbabilities
    entityMentions {
      tag token span offset tokens start end
      labelProbabilities {tag probability}
    }
  }
}
```

</p>
</details>

<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "extract": {
      "rawText": "The wolf says: owooooo. The goose says: hhonk-honk. The cat says: meow-meow.",
      "xText": "The <Animal>wolf</Animal> says: <Sound>owooooo</Sound>. The <Animal>goose</Animal> says: <Sound>hhonk-honk</Sound>. The <Animal>cat</Animal> says: <Sound>meow-meow</Sound>.",
      "topAnnotationProbabilities": [
        0.968,
        0.0172,
        0.00465
      ],
      "entityMentions": [
        {
          "tag": "Animal",
          "token": "wolf",
          "span": 4,
          "offset": 4,
          "tokens": [
            "wolf"
          ],
          "start": 1,
          "end": 2,
          "labelProbabilities": [
            {
              "tag": "Animal",
              "probability": 1
            },
            {
              "tag": "Sound",
              "probability": 0.0000337
            },
            {
              "tag": "O",
              "probability": 0.0000376
            }
          ]
        },
        {
          "tag": "Sound",
          "token": "owooooo",
          "span": 7,
          "offset": 15,
          "tokens": [
            "owooooo."
          ],
          "start": 3,
          "end": 4,
          "labelProbabilities": [
            {
              "tag": "Animal",
              "probability": 0.000487
            },
            {
              "tag": "Sound",
              "probability": 0.999
            },
            {
              "tag": "O",
              "probability": 0.0000875
            }
          ]
        },
        {
          "tag": "Animal",
          "token": "goose",
          "span": 5,
          "offset": 28,
          "tokens": [
            "goose"
          ],
          "start": 5,
          "end": 6,
          "labelProbabilities": [
            {
              "tag": "Animal",
              "probability": 1
            },
            {
              "tag": "Sound",
              "probability": 0.000305
            },
            {
              "tag": "O",
              "probability": 0.000171
            }
          ]
        },
        {
          "tag": "Sound",
          "token": "hhonk-honk",
          "span": 10,
          "offset": 40,
          "tokens": [
            "hhonk-honk."
          ],
          "start": 7,
          "end": 8,
          "labelProbabilities": [
            {
              "tag": "Animal",
              "probability": 0.0174
            },
            {
              "tag": "Sound",
              "probability": 0.978
            },
            {
              "tag": "O",
              "probability": 0.00491
            }
          ]
        },
        {
          "tag": "Animal",
          "token": "cat",
          "span": 3,
          "offset": 56,
          "tokens": [
            "cat"
          ],
          "start": 9,
          "end": 10,
          "labelProbabilities": [
            {
              "tag": "Animal",
              "probability": 0.999
            },
            {
              "tag": "Sound",
              "probability": 0.000614
            },
            {
              "tag": "O",
              "probability": 0.000184
            }
          ]
        },
        {
          "tag": "Sound",
          "token": "meow-meow",
          "span": 9,
          "offset": 66,
          "tokens": [
            "meow-meow."
          ],
          "start": 11,
          "end": 12,
          "labelProbabilities": [
            {
              "tag": "Animal",
              "probability": 0.00442
            },
            {
              "tag": "Sound",
              "probability": 0.994
            },
            {
              "tag": "O",
              "probability": 0.00134
            }
          ]
        }
      ]
    }
  }
}
```

</p>
</details>

### ExtractBatch with custom Model query

<details>
<summary>click to expand example</summary>
<p>

```python
query ExtractBatch {
  extractBatch(
    texts: [
      "The wolf says: owooooo.",
      "The goose says: hhonk-honk.",
      "The cat says: meow-meow."
    ],
    modelURL: {
      path: {
        # Take this URL from the result of Train query or use getModelPath()
        id: "path/to/model/.../animals.ser.gz"
      }
    }
  ) {
    rawText xText
    topAnnotationProbabilities
    entityMentions {
      tag token span offset tokens start end
      labelProbabilities {tag probability}
    }
  }
}
```

</p>
</details>

<details>
<summary>click to expand output result</summary>
<p>

```ruby
{
  "data": {
    "extractBatch": [
      {
        "rawText": "The wolf says: owooooo.",
        "xText": "The <Animal>wolf</Animal> says: <Sound>owooooo</Sound>.",
        "topAnnotationProbabilities": [
          1,
          0.0000931,
          0.0000743
        ],
        "entityMentions": [
          {
            "tag": "Animal",
            "token": "wolf",
            "span": 4,
            "offset": 4,
            "tokens": [
              "wolf"
            ],
            "start": 1,
            "end": 2,
            "labelProbabilities": [
              {
                "tag": "Animal",
                "probability": 1
              },
              {
                "tag": "Sound",
                "probability": 0.0000346
              },
              {
                "tag": "O",
                "probability": 0.000038
              }
            ]
          },
          {
            "tag": "Sound",
            "token": "owooooo",
            "span": 7,
            "offset": 15,
            "tokens": [
              "owooooo."
            ],
            "start": 3,
            "end": 4,
            "labelProbabilities": [
              {
                "tag": "Animal",
                "probability": 0.0000931
              },
              {
                "tag": "Sound",
                "probability": 1
              },
              {
                "tag": "O",
                "probability": 0.0000266
              }
            ]
          }
        ]
      },
      {
        "rawText": "The goose says: hhonk-honk.",
        "xText": "The <Animal>goose</Animal> says: <Sound>hhonk-honk</Sound>.",
        "topAnnotationProbabilities": [
          0.992,
          0.00436,
          0.00177
        ],
        "entityMentions": [
          {
            "tag": "Animal",
            "token": "goose",
            "span": 5,
            "offset": 4,
            "tokens": [
              "goose"
            ],
            "start": 1,
            "end": 2,
            "labelProbabilities": [
              {
                "tag": "Animal",
                "probability": 1
              },
              {
                "tag": "Sound",
                "probability": 0.0000675
              },
              {
                "tag": "O",
                "probability": 0.0000716
              }
            ]
          },
          {
            "tag": "Sound",
            "token": "hhonk-honk",
            "span": 10,
            "offset": 16,
            "tokens": [
              "hhonk-honk."
            ],
            "start": 3,
            "end": 4,
            "labelProbabilities": [
              {
                "tag": "Animal",
                "probability": 0.00436
              },
              {
                "tag": "Sound",
                "probability": 0.994
              },
              {
                "tag": "O",
                "probability": 0.00206
              }
            ]
          }
        ]
      },
      {
        "rawText": "The cat says: meow-meow.",
        "xText": "The <Animal>cat</Animal> says: <Sound>meow-meow</Sound>.",
        "topAnnotationProbabilities": [
          0.993,
          0.00442,
          0.00116
        ],
        "entityMentions": [
          {
            "tag": "Animal",
            "token": "cat",
            "span": 3,
            "offset": 4,
            "tokens": [
              "cat"
            ],
            "start": 1,
            "end": 2,
            "labelProbabilities": [
              {
                "tag": "Animal",
                "probability": 1
              },
              {
                "tag": "Sound",
                "probability": 0.00012
              },
              {
                "tag": "O",
                "probability": 0.000119
              }
            ]
          },
          {
            "tag": "Sound",
            "token": "meow-meow",
            "span": 9,
            "offset": 14,
            "tokens": [
              "meow-meow."
            ],
            "start": 3,
            "end": 4,
            "labelProbabilities": [
              {
                "tag": "Animal",
                "probability": 0.00442
              },
              {
                "tag": "Sound",
                "probability": 0.994
              },
              {
                "tag": "O",
                "probability": 0.00135
              }
            ]
          }
        ]
      }
    ]
  }
}
```

</p>
</details>

### ExtractFast vs. ExtractBatch with Stanford Model query

ExtractFast is executed ~ 3 times faster then ExtractBatch query.

In current example:

- Input text - 3 chapter of Harry Potter ~ 72 kB (13167 words)
- Elapsed time for ExtractBatch ~ 9 sec.
- Elapsed time for ExtractFast ~ 3 sec.

<details>
<summary>click to expand ExtractFast example</summary>
<p>

```ruby
query ExtractFastWithStanford($text: String!) {
  extractFast(
    texts: [
      $text
    ]
  ) {
    xText
    entityMentions {
      tag token span offset tokens start end
    }
  }
}
```

</p>
</details>

<details>
<summary>click to expand ExtractBatch example</summary>
<p>

```ruby
query ExtractBatchWithStanford($text: String!) {
  extractBatch(
    texts: [
      $text
    ]
  ) {
    xText
    entityMentions {
      tag token span offset tokens start end
    }
  }
}
```

</p>
</details>

<details>
<summary>click to expand query Variables</summary>
<p>

```json
{
  "text": "Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say that they were perfectly normal, thank you very much. They were the last people you'd expect to be involved in anything strange or mysterious, because they just didn't hold with such nonsense. Mr. Dursley was the director of a firm called Grunnings, which made drills. He was a big, beefy man with hardly any neck, although he did have a very large mustache. Mrs. Dursley was thin and blonde and had nearly twice the usual amount of neck, which came in very useful as she spent so much of her time craning over garden fences, spying on the neighbors. The Dursleys had a small son called Dudley and in their opinion there was no finer boy anywhere. The Dursleys had everything they wanted, but they also had a secret, and their greatest fear was that somebody would discover it. They didn't think they could bear it if anyone found out about the Potters. Mrs. Potter was Mrs. Dursley's sister, but they hadn't met for several years; in fact, Mrs. Dursley pretended she didn't have a sister, because her sister and her good-for-nothing husband were as unDursleyish as it was possible to be. The Dursleys shuddered to think what the neighbors would say if the Potters arrived in the street. The Dursleys knew that the Potters had a small son, too, but they had never even seen him. This boy was another good reason for keeping the Potters away; they didn't want Dudley mixing with a child like that. When Mr. and Mrs. Dursley woke up on the dull, gray Tuesday our story starts, there was nothing about the cloudy sky outside to suggest that strange and mysterious things would soon be happening all over the country. Mr. Dursley hummed as he picked out his most boring tie for work, and Mrs. Dursley gossiped away happily as she wrestled a screaming Dudley into his high chair. None of them noticed a large, tawny owl flutter past the window. At half past eight, Mr. Dursley picked up his briefcase, pecked Mrs. Dursley on the cheek, and tried to kiss Dudley good-bye but missed, because Dudley was now having a tantrum and throwing his cereal at the walls. Little tyke, chortled Mr. Dursley as he left the house. He got into his car and backed out of number four's drive. It was on the corner of the street that he noticed the first sign of something peculiar — a cat reading a map. For a second, Mr. Dursley didn't realize what he had seen — then he jerked his head around to look again. There was a tabby cat standing on the corner of Privet Drive, but there wasn't a map in sight. What could he have been thinking of? It must have been a trick of the light. Mr. Dursley blinked and stared at the cat. It stared back. As Mr. Dursley drove around the corner and up the road, he watched the cat in his mirror. It was now reading the sign that said Privet Drive — no, looking at the sign; cats couldn't read maps or signs. Mr. Dursley gave himself a little shake and put the cat out of his mind. As he drove toward town he thought of nothing except a large order of drills he was hoping to get that day. But on the edge of town, drills were driven out of his mind by something else. As he sat in the usual morning traffic jam, he couldn't help noticing that there seemed to be a lot of strangely dressed people about. People in cloaks. Mr. Dursley couldn't bear people who dressed in funny clothes — the getups you saw on young people! He supposed this was some stupid new fashion. He drummed his fingers on the steering wheel and his eyes fell on a huddle of these weirdos standing quite close by. They were whispering excitedly together. Mr. Dursley was enraged to see that a couple of them weren't young at all; why, that man had to be older than he was, and wearing an emerald-green cloak! The nerve of him! But then it struck Mr. Dursley that this was probably some silly stunt — these people were obviously collecting for something... yes, that would be it. The traffic moved on and a few minutes later, Mr. Dursley arrived in the Grunnings parking lot, his mind back on drills. Mr. Dursley always sat with his back to the window in his office on the ninth floor. If he hadn't, he might have found it harder to concentrate on drills that morning. He didn't see the owls swoop ing past in broad daylight, though people down in the street did; they pointed and gazed open- mouthed as owl after owl sped overhead. Most of them had never seen an owl even at nighttime. Mr. Dursley, however, had a perfectly normal, owl-free morning. He yelled at five different people. He made several important telephone calls and shouted a bit more. He was in a very good mood until lunchtime, when he thought he'd stretch his legs and walk across the road to buy himself a bun from the bakery. He'd forgotten all about the people in cloaks until he passed a group of them next to the baker's. He eyed them angrily as he passed. He didn't know why, but they made him uneasy. This bunch were whispering excitedly, too, and he couldn't see a single collecting tin. It was on his way back past them, clutching a large doughnut in a bag, that he caught a few words of what they were saying. The Potters, that's right, that's what I heard yes, their son, Harry Mr. Dursley stopped dead. Fear flooded him. He looked back at the whisperers as if he wanted to say something to them, but thought better of it. He dashed back across the road, hurried up to his office, snapped at his secretary not to disturb him, seized his telephone, and had almost finished dialing his home number when he changed his mind. He put the receiver back down and stroked his mustache, thinking... no, he was being stupid. Potter wasn't such an unusual name. He was sure there were lots of people called Potter who had a son called Harry. Come to think of it, he wasn't even sure his nephew was called Harry. He'd never even seen the boy. It might have been Harvey. Or Harold. There was no point in worrying Mrs. Dursley; she always got so upset at any mention of her sister. He didn't blame her — if he'd had a sister like that... but all the same, those people in cloaks... He found it a lot harder to concentrate on drills that afternoon and when he left the building at five o'clock, he was still so worried that he walked straight into someone just outside the door. Sorry, he grunted, as the tiny old man stumbled and almost fell. It was a few seconds before Mr. Dursley realized that the man was wearing a violet cloak. He didn't seem at all upset at being almost knocked to the ground. On the contrary, his face split into a wide smile and he said in a squeaky voice that made passersby stare, Don't be sorry, my dear sir, for nothing could upset me today! Rejoice, for You-Know-Who has gone at last!Even Muggles like yourself should be celebrating, this happy, happy day! And the old man hugged Mr. Dursley around the middle and walked off. Mr. Dursley stood rooted to the spot. He had been hugged by a complete stranger. He also thought he had been called a Muggle, whatever that was. He was rattled. He hurried to his car and set off for home, hoping he was imagining things, which he had never hoped before, because he didn't approve of imagination. As he pulled into the driveway of number four, the first thing he saw — and it didn't improve his mood — was the tabby cat he'd spotted that morning. It was now sitting on his garden wall. He was sure it was the same one; it had the same markings around its eyes. Shoo! said Mr. Dursley loudly. The cat didn't move. It just gave him a stern look. Was this normal cat behavior? Mr. Dursley wondered. Trying to pull himself together, he let himself into the house. He was still determined not to mention anything to his wife. Mrs. Dursley had had a nice, normal day. She told him over dinner all about Mrs. Next Door's problems with her daughter and how Dudley had learned a new word (Won't!) . Mr. Dursley tried to act normally. When Dudley had been put to bed, he went into the living room in time to catch the last report on the evening news: And finally, bird-watchers everywhere have reported that the nation's owls have been behaving very unusually today. Although owls normally hunt at night and are hardly ever seen in daylight, there have been hundreds of sightings of these birds flying in every direction since sunrise. Experts are unable to explain why the owls have suddenly changed their sleeping pattern. The newscaster allowed himself a grin. Most mysterious. And now, over to Jim McGuffin with the weather. Going to be any more showers of owls tonight, Jim? Well, Ted, said the weatherman, I don't know about that, but it's not only the owls that have been acting oddly today. Viewers as far apart as Kent, Yorkshire, and Dundee have been phoning in to tell me that instead of the rain I promised yesterday, they've had a downpour of shooting stars! Perhaps people have been celebrating Bonfire Night early — it's not until next week, folks! But I can promise a wet night tonight. Mr. Dursley sat frozen in his armchair. Shooting stars all over Britain? Owls flying by daylight? Mysterious people in cloaks all over the place? And a whisper, a whisper about the Potters... Mrs. Dursley came into the living room carrying two cups of tea. It was no good. He'd have to say something to her. He cleared his throat nervously. Er — Petunia, dear — you haven't heard from your sister lately, have you? As he had expected, Mrs. Dursley looked shocked and angry. After all, they normally pretended she didn't have a sister. No, she said sharply. Why? Funny stuff on the news, Mr. Dursley mumbled. Owls... shooting stars... and there were a lot of funny-looking people in town today... So? snapped Mrs. Dursley. Well, I just thought... maybe... it was something to do with... you know... her crowd. Mrs. Dursley sipped her tea through pursed lips. Mr. Dursley wondered whether he dared tell her he'd heard the name Potter. He decided he didn't dare. Instead he said, as casually as he could, Their son — he'd be about Dudley's age now, wouldn't he? I suppose so, said Mrs. Dursley stiffly. What's his name again?Howard, isn't it? Harry. Nasty, common name, if you ask me. Oh, yes, said Mr. Dursley, his heart sinking horribly. Yes, I quite agree. He didn't say another word on the subject as they went upstairs to bed. While Mrs. Dursley was in the bathroom, Mr. Dursley crept to the bedroom window and peered down into the front garden. The cat was still there. It was staring down Privet Drive as though it were waiting for something. Was he imagining things? Could all this have anything to do with the Potters? If it did... if it got out that they were related to a pair of — well, he didn't think he could bear it. The Dursleys got into bed. Mrs. Dursley fell asleep quickly but Mr. Dursley lay awake, turning it all over in his mind. His last, comforting thought before he fell asleep was that even if the Potters were involved, there was no reason for them to come near him and Mrs. Dursley. The Potters knew very well what he and Petunia thought about them and their kind.... He couldn't see how he and Petunia could get mixed up in anything that might be going on — he yawned and turned over — it couldn't affect them.... How very wrong he was. Mr. Dursley might have been drifting into an uneasy sleep, but the cat on the wall outside was showing no sign of sleepiness. It was sitting as still as a statue, its eyes fixed unblinkingly on the far corner of Privet Drive. It didn't so much as quiver when a car door slammed on the next street, nor when two owls swooped overhead. In fact, it was nearly midnight before the cat moved at all. A man appeared on the corner the cat had been watching, appeared so suddenly and silently you'd have thought he'd just popped out of the ground. The cat's tail twitched and its eyes narrowed. Nothing like this man had ever been seen on Privet Drive. He was tall, thin, and very old, judging by the silver of his hair and beard, which were both long enough to tuck into his belt. He was wearing long robes, a purple cloak that swept the ground, and high-heeled, buckled boots. His blue eyes were light, bright, and sparkling behind half-moon spectacles and his nose was very long and crooked, as though it had been broken at least twice. This man's name was Albus Dumbledore. Albus Dumbledore didn't seem to realize that he had just arrived in a street where everything from his name to his boots was unwelcome. He was busy rummaging in his cloak, looking for something. But he did seem to realize he was being watched, because he looked up suddenly at the cat, which was still staring at him from the other end of the street. For some reason, the sight of the cat seemed to amuse him. He chuckled and muttered, I should have known. He found what he was looking for in his inside pocket. It seemed to be a silver cigarette lighter. He flicked it open, held it up in the air, and clicked it. The nearest street lamp went out with a little pop. He clicked it again — the next lamp flickered into darkness. Twelve times he clicked the Put-Outer, until the only lights left on the whole street were two tiny pinpricks in the distance, which were the eyes of the cat watching him. If anyone looked out of their window now, even beady-eyed Mrs. Dursley, they wouldn't be able to see anything that was happening down on the pavement. Dumbledore slipped the Put-Outer back inside his cloak and set off down the street toward number four, where he sat down on the wall next to the cat.I have did not look at Item, but despues de to moment I have spoke to Item. Fancy seeing you here, Professor McGonagall. I have turned to smile at the tabby, but Item had gone. Instead I have was smiling at to rather severe-looking woman quien was wearing square glasses exactly the shape of the markings the cat had had around its eyes. She, too, was wearing to cloak, an emerald one. Her black hair was drawn into to tight bun. She looked distinctly ruffled. How did you know Item was me? she asked. My dear Professor, I 'go never seen to cat sit SW stiffly. You'd be stiff if you'd been sitting on to brick wall all day, said Professor McGonagall. All day? When you could have been Entering the day by delivering it by delivering it by making a difference? I must have passed to dozen feasts and parties on my way here. Professor McGonagall sniffed angrily. Oh And it is, everyone's Entering the day by delivering it by delivering it by making a difference, all right, she said impatiently. You'd think they'd be to bit more careful, but do not - even the Muggles have noticed something's going on. Item was on their news. She jerked her head back at the Dursleys' dark living room window. I heard Item. Flocks of owls... shooting stars.... Well, they're not completely stupid. They were bound to notice something. Shooting stars down in Kent - I'll bet that was Dedalus Diggle. I have never had much sense. You can not blame them, said Dumbledore gently. We've had precious little to celebrate for eleven years. I know that, said Professor McGonagall irritably. But that's do not reason to I know our heads. People are being downright careless, out on the streets in broad daylight, not even dressed in Muggle clothes, swapping rumors. She threw to sharp, sideways glance at Dumbledore here, ace though hoping I have was going to tell her something, but I have did not, SW she went on. TO fine thing Item would be if, on the look and day YouKnow-Who seems to have disappeared at last, the Muggles found out about us all. I suppose I have really have gone, Dumbledore? Item certainly seems SW, said Dumbledore. We have much to be thankful for. Would you care for to lemon drop? TO que? TO lemon drop. They're to kind of Muggle sweet I'm rather fond of Do not, thank you, said Professor McGonagall coldly, ace though she did not think Este was the moment for lemon drops. Ace I say, even if You-Know-Who have gone - My dear Professor, surely to sensitive person like yourself dog call him by his yam? All Este 'You- Know-Who ' nonsense - for eleven years I have been trying to persuade people to call him by his proper yam: Voldemort. Professor McGonagall flinched, but Dumbledore, quien was unsticking two lemon drops, seemed not to notice. Item all gets SW confusing if we keep saying 'You-Know-Who.' I have never seen any reason to be frightened of saying Voldemort's yam. I know you haven 't, said Professor McGonagall, sounding half exasperated, half admiring. But you're different. Everyone knows you're the only one You-Know- oh, all right, Voldemort, was frightened of. You flatter me, said Dumbledore calmly. Voldemort had powers I will never have. Only because you're too - well - noble to use them. It's lucky it's dark. I have not blushed SW much since Madam Pomfrey told me she liked my new earmuffs. Professor McGonagall shot to sharp look at Dumbledore and said, The owls are nothing next to the rumors that are flying around. You know que everyone's saying? About why he's disappeared? About que finally stopped him? Item seemed that Professor McGonagall had reached the point she was most anxious to Discuss, the real reason she had been waiting on to cold, hard wall all day, for neither ace to cat nor ace to woman had she fixed Dumbledore with such to piercing stare ace she did now. Item was plain that whatever everybody was saying, she was not going to believe Item until Dumbledore told her Item was true. Dumbledore, however, was choosing another lemon drop and did not answer. que they're saying, she pressed on, is that last night Voldemort turned up in Godric's Hollow. I have went to find the Potters. The rumor is that Lily and James Potter are - are - that they're - dead. Dumbledore bowed his head. Professor McGonagall gasped. Lily and James... I can not believe Item... I did not want to believe Item... Oh, Albus... Dumbledore reached out and patted her on the shoulder. I know... I know... I have said overloaded. Professor McGonagall's voice trembled ace she went on. That's not all. They're saying I have tried to kill the Potter's They are, Harry. But - I have could not. I have could not kill that little boy. Do not one knows why, or how, but they're saying that when I have could not kill Harry Potter, Voldemort's power somehow broke - and that's why he's gone. Dumbledore nodded glumly. It's - it's true? faltered Professor McGonagall. despues de all he's done... all the people he's killed... I have could not kill to little boy? It's just astounding... of all the things to stop him... but how in the yam of heaven did Harry survive? We dog only Guess, said Dumbledore. We may never know. Professor McGonagall pulled out to lace handkerchief and dabbed at her eyes beneath her spectacles. Dumbledore gave to great sniff ace I have took to golden watch desde his pocket and examined Item. Item was to look and odd watch. Item had twelve hands but do not numbers; instead of, little planets were moving around the edge. Item must have made sense to Dumbledore, though, because I have put Item back in his pocket and said, Hagrid's late. I suppose Item was I have quien told you I'd be here, by the way? And it is, said Professor McGonagall. And I no suppose you're going to tell me why you're here, of all places? I've eat to bring Harry to his aunt and uncle. They're the only Familia I have have left now. You no mean - you can not mean the people quien live here? cried Professor McGonagall, jumping to her feet and pointing at number four. Dumbledore - you can not. I've been watching them all day. You could not find two people quien are less like us. And they've got Este They are - I saw him kicking his mother all the way up the street, screaming for sweets. Harry Potter eat and live here! It's the best place for him, said Dumbledore firmly. His aunt and uncle will be able to explain everything to him when he's older. I've written them to letter. TO letter? repeated Professor McGonagall faintly, sitting back down on the wall. Really, Dumbledore, you think you dog explain all Este in to letter? estos people will never understand him! He'll be famous - to legend - I would not be surprised if today was known ace Harry Potter day in the future - there will be books written about Harry - every child in our world will know his yam! Exactly, said Dumbledore, looking look and seriously over the top of his half-moon glasses. Item would be enough to turn any boy's head. Famous before I have dog walk and talk! Famous for something I have will not even remember!Expensive you see how much better off he'll be, growing up away desde all that until he's ready to take Item? Professor McGonagall open her mouth, changed her mind, swallowed, and then said, And it is - And it is, you're right, of course. But how is the boy getting here, Dumbledore? She eyed his cloak suddenly ace though she thought I have might be hiding Harry underneath Item. Hagrid's bringing him. You think Item - wise - to trust Hagrid with something ace important ace Este? I would trust Hagrid with my life, said Dumbledore. I'm not saying his heart is not in the right place, said Professor McGonagall grudgingly, but you can not pretend he's not careless. I have does tend to - que was that? TO low rumbling sound had broken the silence around them. Item grew steadily louder ace they looked up and down the street for some sign of to eleven headlight; Item swelled to to roar ace they both looked up at the sky - and to huge motorcycle fell out of the air and landed on the road in front of them. If the motorcycle was huge, Item was nothing to the man sitting astride Item. I have was almost twice ace tall ace to normal man and at at least five times ace wide. I have looked simply too big to be allowed, and SW wild - long tangles of bushy black hair and beard hid most of his face, I have had hands the size of trash dog lids, and his feet in their leather boots were like baby dolphins. In his vast, muscular arms I have was holding company to bundle of blankets. Hagrid, said Dumbledore, sounding relieved. At last. And where did you get that motorcycle? Borrowed Item, Professor Dumbledore, sit, said the giant, climbing carefully off the motorcycle ace I have spoke. Young Sirius Black slow Item to me. I've got him, sir. Do not problems, were there? Do not, sir - house was almost destroyed, but I got him out all right before the Muggles started swarmin ' around. I have fell asleep ace we was flyin ' over Bristol board. Dumbledore and Professor McGonagall bent forward over the bundle of blankets. Inside, just visible, was to baby boy, fast asleep. Under to tuft of jet-black hair over his forehead they could see to curiously shaped cut, like to bolt of lightning. Is that where -? whispered Professor McGonagall. And it is, said Dumbledore. He'll have that scar forever. Could not you do something about Item, Dumbledore? Even if I could, I would not. Scars dog eat in handy. I have one myself above my left knee that is to perfect map of the London Underground. Well - give him here, Hagrid - we'd better get Este over with. Dumbledore took Harry in his arms and turned to the Dursleys' house. Could I - could I say good-bye to him, sir? asked Hagrid. I have bent his great, shaggy head over Harry and gave him que must have been to look and scratchy, whiskery kiss. Then, suddenly, Hagrid let out to howl like to wounded dog. Shhh! hissed Professor McGonagall, you'll wake the Muggles! Ss-sorry, sobbed Hagrid, taking out to large, spotted handkerchief and burying his face in Item. But I cc-can't stand Item - Lily an ' James dead - an ' poor little Harry off ter live with Muggles - And it is, And it is, it's all look and sad, but get to grip on yourself, Hagrid, or we'll be found, Professor McGonagall whispered, patting Hagrid gingerly on the arm ace Dumbledore stepped over the low garden wall and walked to the front door. I have laid Harry gently on the doorstep, took to letter out of his cloak, tucked Item inside Harry's blankets, and then came back to the other two.For to full minute the three of them stood and looked at the little bundle; Hagrid's shoulders shook, Professor McGonagall blinked furiously, and the twinkling Light that usually shone desde Dumbledore's eyes seemed to have gone out. Well, said Dumbledore finally, that's that. We've do not business staying here. We may ace well go and join the celebrations. Yeah, said Hagrid in to look and muffled voice, I'll be takin ' Sirius his bike back. G'night, Professor McGonagall - Professor Dumbledore, sir. Wiping his streaming eyes on his jacket sleeve, Hagrid swung himself onto the motorcycle and kicked the engine into life; with to roar Item rose into the air and off into the night. I shall see you soon, I expect, Professor McGonagall, said Dumbledore, nodding to her. Professor McGonagall blew her I dont know in reply. Dumbledore turned and walked back down the street. On the corner I have stopped and took out the silver Put-Outer. I have clicked Item eleven, and twelve balls of Light lawn back to their street lamps SW that Privet Drive glowed suddenly orange and I have could make out to tabby cat slinking around the corner at the other end of the street. I have could just see the bundle of blankets on the step of number four. Good luck, Harry, I have murmured. I have turned on his heel and with to swish of his cloak, I have was gone. TO breeze ruffled the neat hedges of Privet Drive, which lay silent and tidy under the inky sky, the look and last place you would expect astonishing things to happen. Harry Potter rolled over inside his blankets without waking up. One small hand closed on the letter beside him and I have slept on, not knowing I have was special, not knowing I have was famous, not knowing I have would be woken in to few hours' time by Mrs. Dursley's scream ace she open the front door to put out the milk bottles, nor that I have would spend the next few weeks being prodded and pinched by his cousin Dudley... I have could not know that at Este look and moment, people meeting in secret all over the country were holding company up their glasses and saying in hushed voices: To Harry Potter - the boy quien lived! Nearly ten years had passed since the Dursleys had woken up to find their nephew on the front step, but Privet Drive had hardly changed at all. The sun rose on the same tidy front gardens and lit up the brass number four on the Dursleys’ front door; it crept into their living room, which was almost exactly the same as it had been on the night when Mr. Dursley had seen that fateful news report about the owls. Only the photographs on the mantelpiece really showed how much time had passed. Ten years ago, there had been lots of pictures of what looked like a large pink beach ball wearing different-colored bonnets — but Dudley Dursley was no longer a baby, and now the photographs showed a large blond boy riding his first bicycle, on a carousel at the fair, playing a computer game with his father, being hugged and kissed by his mother. The room held no sign at all that another boy lived in the house, too. Yet Harry Potter was still there, asleep at the moment, but not for long. His Aunt Petunia was awake and it was her shrill voice that made the first noise of the day. Up! Get up! Now! Harry woke with a start. His aunt rapped on the door again. Up! she screeched. Harry heard her walking toward the kitchen and then the sound of the frying pan being put on the stove. He rolled onto his back and tried to remember the dream he had been having. It had been a good one. There had been a flying motorcycle in it. He had a funny feeling he’d had the same dream before. His aunt was back outside the door. Are you up yet? she demanded. Nearly, said Harry. Well, get a move on, I want you to look after the bacon. And don’t you dare let it burn, I want everything perfect on Duddy’s birthday. Harry groaned. What did you say? his aunt snapped through the door. Nothing, nothing… Dudley’s birthday — how could he have forgotten? Harry got slowly out of bed and started looking for socks. He found a pair under his bed and, after pulling a spider off one of them, put them on. Harry was used to spiders, because the cupboard under the stairs was full of them, and that was where he slept. When he was dressed he went down the hall into the kitchen. The table was almost hidden beneath all Dudley’s birthday presents. It looked as though Dudley had gotten the new computer he wanted, not to mention the second television and the racing bike. Exactly why Dudley wanted a racing bike was a mystery to Harry, as Dudley was very fat and hated exercise — unless of course it involved punching somebody. Dudley’s favorite punching bag was Harry, but he couldn’t often catch him. Harry didn’t look it, but he was very fast. Perhaps it had something to do with living in a dark cupboard, but Harry had always been small and skinny for his age. He looked even smaller and skinnier than he really was because all he had to wear were old clothes of Dudley’s, and Dudley was about four times bigger than he was. Harry had a thin face, knobbly knees, black hair, and bright green eyes. He wore round glasses held together with a lot of Scotch tape because of all the times Dudley had punched him on the nose. The only thing Harry liked about his own appearance was a very thin scar on his forehead that was shaped like a bolt of lightning. He had had it as long as he could remember, and the first question he could ever remember asking his Aunt Petunia was how he had gotten it. In the car crash when your parents died, she had said. And don’t ask questions. Don’t ask questions — that was the first rule for a quiet life with the Dursleys. Uncle Vernon entered the kitchen as Harry was turning over the bacon. Comb your hair! he barked, by way of a morning greeting. About once a week, Uncle Vernon looked over the top of his newspaper and shouted that Harry needed a haircut. Harry must have had more haircuts than the rest of the boys in his class put together, but it made no difference, his hair simply grew that way — all over the place. Harry was frying eggs by the time Dudley arrived in the kitchen with his mother. Dudley looked a lot like Uncle Vernon. He had a large pink face, not much neck, small, watery blue eyes, and thick blond hair that lay smoothly on his thick, fat head. Aunt Petunia often said that Dudley looked like a baby angel — Harry often said that Dudley looked like a pig in a wig. Harry put the plates of egg and bacon on the table, which was difficult as there wasn’t much room. Dudley, meanwhile, was counting his presents. His face fell. Thirty-six, he said, looking up at his mother and father. That’s two less than last year. Darling, you haven’t counted Auntie Marge’s present, see, it’s here under this big one from Mummy and Daddy. All right, thirty-seven then, said Dudley, going red in the face. Harry, who could see a huge Dudley tantrum coming on, began wolfing down his bacon as fast as possible in case Dudley turned the table over. Aunt Petunia obviously scented danger, too, because she said quickly, And we’ll buy you another two presents while we’re out today. How’s that, popkin? Two more presents. Is that all right Dudley thought for a moment. It looked like hard work. Finally he said slowly, So I’ll have thirty… thirty… Thirty-nine, sweetums, said Aunt Petunia. Oh. Dudley sat down heavily and grabbed the nearest parcel. All right then. Uncle Vernon chuckled. Little tyke wants his money’s worth, just like his father. ’Atta boy, Dudley! He ruffled Dudley’s hair. At that moment the telephone rang and Aunt Petunia went to answer it while Harry and Uncle Vernon watched Dudley unwrap the racing bike, a video camera, a remote control airplane, sixteen new computer games, and a VCR. He was ripping the paper off a gold wristwatch when Aunt Petunia came back from the telephone looking both angry and worried. Bad news, Vernon, she said. Mrs. Figg’s broken her leg. She can’t take him. She jerked her head in Harry’s direction. Dudley’s mouth fell open in horror, but Harry’s heart gave a leap. Every year on Dudley’s birthday, his parents took him and a friend out for the day, to adventure parks, hamburger restaurants, or the movies. Every year, Harry was left behind with Mrs. Figg, a mad old lady who lived two streets away. Harry hated it there. The whole house smelled of cabbage and Mrs. Figg made him look at photographs of all the cats she’d ever owned. Now what? said Aunt Petunia, looking furiously at Harry as though he’d planned this. Harry knew he ought to feel sorry that Mrs. Figg had broken her leg, but it wasn’t easy when he reminded himself it would be a whole year before he had to look at Tibbles, Snowy, Mr. Paws, and Tufty again. We could phone Marge, Uncle Vernon suggested. Don’t be silly, Vernon, she hates the boy. The Dursleys often spoke about Harry like this, as though he wasn’t there — or rather, as though he was something very nasty that couldn’t understand them, like a slug. What about what’s-her-name, your friend — Yvonne? You could just leave me here, Harry put in hopefully (he’d be able to watch what he wanted on television for a change and maybe even have a go on Dudley’s computer). Aunt Petunia looked as though she’d just swallowed a lemon. And come back and find the house in ruins? she snarled. I won’t blow up the house, said Harry, but they weren’t listening. I suppose we could take him to the zoo, said Aunt Petunia slowly, … and leave him in the car… That car’s new, he’s not sitting in it alone… Dudley began to cry loudly. In fact, he wasn’t really crying — it had been years since he’d really cried — but he knew that if he screwed up his face and wailed, his mother would give him anything he wanted. Dinky Duddydums, don’t cry, Mummy won’t let him spoil your special day! she cried, flinging her arms around him. I… don’t… want… him… t-t-to come! Dudley yelled between huge, pretend sobs. He always sp-spoils everything! He shot Harry a nasty grin through the gap in his mother’s arms. Just then, the doorbell rang — Oh, good Lord, they’re here! said Aunt Petunia frantically — and a moment later, Dudley’s best friend, Piers Polkiss, walked in with his mother. Piers was a scrawny boy with a face like a rat. He was usually the one who held people’s arms behind their backs while Dudley hit them. Dudley stopped pretending to cry at once. Half an hour later, Harry, who couldn’t believe his luck, was sitting in the back of the Dursleys’ car with Piers and Dudley, on the way to the zoo for the first time in his life. His aunt and uncle hadn’t been able to think of anything else to do with him, but before they’d left, Uncle Vernon had taken Harry aside. I’m warning you, he had said, putting his large purple face right up close to Harry’s, I’m warning you now, boy — any funny business, anything at all — and you’ll be in that cupboard from now until Christmas. I’m not going to do anything, said Harry, honestly… But Uncle Vernon didn’t believe him. No one ever did. The problem was, strange things often happened around Harry and it was just no good telling the Dursleys he didn’t make them happen. Once, Aunt Petunia, tired of Harry coming back from the barbers looking as though he hadn’t been at all, had taken a pair of kitchen scissors and cut his hair so short he was almost bald except for his bangs, which she left to hide that horrible scar. Dudley had laughed himself silly at Harry, who spent a sleepless night imagining school the next day, where he was already laughed at for his baggy clothes and taped glasses. Next morning, however, he had gotten up to find his hair exactly as it had been before Aunt Petunia had sheared it off. He had been given a week in his cupboard for this, even though he had tried to explain that he couldn’t explain how it had grown back so quickly. Another time, Aunt Petunia had been trying to force him into a revolting old sweater of Dudley’s (brown with orange puff balls). The harder she tried to pull it over his head, the smaller it seemed to become, until finally it might have fitted a hand puppet, but certainly wouldn’t fit Harry. Aunt Petunia had decided it must have shrunk in the wash and, to his great relief, Harry wasn’t punished. On the other hand, he’d gotten into terrible trouble for being found on the roof of the school kitchens. Dudley’s gang had been chasing him as usual when, as much to Harry’s surprise as anyone else’s, there he was sitting on the chimney. The Dursleys had received a very angry letter from Harry’s headmistress telling them Harry had been climbing school buildings. But all he’d tried to do (as he shouted at Uncle Vernon through the locked door of his cupboard) was jump behind the big trash cans outside the kitchen doors. Harry supposed that the wind must have caught him in mid-jump. But today, nothing was going to go wrong. It was even worth being with Dudley and Piers to be spending the day somewhere that wasn’t school, his cupboard, or Mrs. Figg’s cabbage-smelling living room. While he drove, Uncle Vernon complained to Aunt Petunia. He liked to complain about things: people at work, Harry, the council, Harry, the bank, and Harry were just a few of his favorite subjects. This morning, it was motorcycles. … roaring along like maniacs, the young hoodlums, he said, as a motorcycle overtook them. I had a dream about a motorcycle, said Harry, remembering suddenly. It was flying. Uncle Vernon nearly crashed into the car in front. He turned right around in his seat and yelled at Harry, his face like a gigantic beet with a mustache: MOTORCYCLES DON’T FLY! Dudley and Piers sniggered. I know they don’t, said Harry. It was only a dream. But he wished he hadn’t said anything. If there was one thing the Dursleys hated even more than his asking questions, it was his talking about anything acting in a way it shouldn’t, no matter if it was in a dream or even a cartoon — they seemed to think he might get dangerous ideas. It was a very sunny Saturday and the zoo was crowded with families. The Dursleys bought Dudley and Piers large chocolate ice creams at the entrance and then, because the smiling lady in the van had asked Harry what he wanted before they could hurry him away, they bought him a cheap lemon ice pop. It wasn’t bad, either, Harry thought, licking it as they watched a gorilla scratching its head who looked remarkably like Dudley, except that it wasn’t blond. Harry had the best morning he’d had in a long time. He was careful to walk a little way apart from the Dursleys so that Dudley and Piers, who were starting to get bored with the animals by lunchtime, wouldn’t fall back on their favorite hobby of hitting him. They ate in the zoo restaurant, and when Dudley had a tantrum because his knickerbocker glory didn’t have enough ice cream on top, Uncle Vernon bought him another one and Harry was allowed to finish the first. Harry felt, afterward, that he should have known it was all too good to last. After lunch they went to the reptile house. It was cool and dark in there, with lit windows all along the walls. Behind the glass, all sorts of lizards and snakes were crawling and slithering over bits of wood and stone. Dudley and Piers wanted to see huge, poisonous cobras and thick, man-crushing pythons. Dudley quickly found the largest snake in the place. It could have wrapped its body twice around Uncle Vernon’s car and crushed it into a trash can — but at the moment it didn’t look in the mood. In fact, it was fast asleep. Dudley stood with his nose pressed against the glass, staring at the glistening brown coils. Make it move, he whined at his father. Uncle Vernon tapped on the glass, but the snake didn’t budge. Do it again, Dudley ordered. Uncle Vernon rapped the glass smartly with his knuckles, but the snake just snoozed on. This is boring, Dudley moaned. He shuffled away. Harry moved in front of the tank and looked intently at the snake. He wouldn’t have been surprised if it had died of boredom itself — no company except stupid people drumming their fingers on the glass trying to disturb it all day long. It was worse than having a cupboard as a bedroom, where the only visitor was Aunt Petunia hammering on the door to wake you up; at least he got to visit the rest of the house. The snake suddenly opened its beady eyes. Slowly, very slowly, it raised its head until its eyes were on a level with Harry’s. It winked. Harry stared. Then he looked quickly around to see if anyone was watching. They weren’t. He looked back at the snake and winked, too. The snake jerked its head toward Uncle Vernon and Dudley, then raised its eyes to the ceiling. It gave Harry a look that said quite plainly: I get that all the time. I know, Harry murmured through the glass, though he wasn’t sure the snake could hear him. It must be really annoying. The snake nodded vigorously. Where do you come from, anyway? Harry asked. The snake jabbed its tail at a little sign next to the glass. Harry peered at it. Boa Constrictor, Brazil. Was it nice there? The boa constrictor jabbed its tail at the sign again and Harry read on: This specimen was bred in the zoo. Oh, I see — so you’ve never been to Brazil? As the snake shook its head, a deafening shout behind Harry made both of them jump. DUDLEY! MR. DURSLEY! COME AND LOOK AT THIS SNAKE! YOU WON’T BELIEVE WHAT IT’S DOING! Dudley came waddling toward them as fast as he could. Out of the way, you, he said, punching Harry in the ribs. Caught by surprise, Harry fell hard on the concrete floor. What came next happened so fast no one saw how it happened — one second, Piers and Dudley were leaning right up close to the glass, the next, they had leapt back with howls of horror. Harry sat up and gasped; the glass front of the boa constrictor’s tank had vanished. The great snake was uncoiling itself rapidly, slithering out onto the floor. People throughout the reptile house screamed and started running for the exits. As the snake slid swiftly past him, Harry could have sworn a low, hissing voice said, Brazil, here I come… Thanksss, amigo. The keeper of the reptile house was in shock. But the glass, he kept saying, where did the glass go? The zoo director himself made Aunt Petunia a cup of strong, sweet tea while he apologized over and over again. Piers and Dudley could only gibber. As far as Harry had seen, the snake hadn’t done anything except snap playfully at their heels as it passed, but by the time they were all back in Uncle Vernon’s car, Dudley was telling them how it had nearly bitten off his leg, while Piers was swearing it had tried to squeeze him to death. But worst of all, for Harry at least, was Piers calming down enough to say, Harry was talking to it, weren’t you, Harry? Uncle Vernon waited until Piers was safely out of the house before starting on Harry. He was so angry he could hardly speak. He managed to say, Go — cupboard — stay — no meals, before he collapsed into a chair, and Aunt Petunia had to run and get him a large brandy. Harry lay in his dark cupboard much later, wishing he had a watch. He didn’t know what time it was and he couldn’t be sure the Dursleys were asleep yet. Until they were, he couldn’t risk sneaking to the kitchen for some food. He’d lived with the Dursleys almost ten years, ten miserable years, as long as he could remember, ever since he’d been a baby and his parents had died in that car crash. He couldn’t remember being in the car when his parents had died. Sometimes, when he strained his memory during long hours in his cupboard, he came up with a strange vision: a blinding flash of green light and a burning pain on his forehead. This, he supposed, was the crash, though he couldn’t imagine where all the green light came from. He couldn’t remember his parents at all. His aunt and uncle never spoke about them, and of course he was forbidden to ask questions. There were no photographs of them in the house. When he had been younger, Harry had dreamed and dreamed of some unknown relation coming to take him away, but it had never happened; the Dursleys were his only family. Yet sometimes he thought (or maybe hoped) that strangers in the street seemed to know him. Very strange strangers they were, too. A tiny man in a violet top hat had bowed to him once while out shopping with Aunt Petunia and Dudley. After asking Harry furiously if he knew the man, Aunt Petunia had rushed them out of the shop without buying anything. A wild-looking old woman dressed all in green had waved merrily at him once on a bus. A bald man in a very long purple coat had actually shaken his hand in the street the other day and then walked away without a word. The weirdest thing about all these people was the way they seemed to vanish the second Harry tried to get a closer look. At school, Harry had no one. Everybody knew that Dudley’s gang hated that odd Harry Potter in his baggy old clothes and broken glasses, and nobody liked to disagree with Dudley’s gang. On vacation in Majorca, snapped Aunt Petunia The escape of the Brazilian boa constrictor earned Harry his longest-ever punishment. By the time he was allowed out of his cupboard again, the summer holidays had started and Dudley had already broken his new video camera, crashed his remote control airplane, and, first time out on his racing bike, knocked down old Mrs. Figg as she crossed Privet Drive on her crutches. Harry was glad school was over, but there was no escaping Dudley’s gang, who visited the house every single day. Piers, Dennis, Malcolm, and Gordon were all big and stupid, but as Dudley was the biggest and stupidest of the lot, he was the leader. The rest of them were all quite happy to join in Dudley’s favorite sport: Harry Hunting. This was why Harry spent as much time as possible out of the house, wandering around and thinking about the end of the holidays, where he could see a tiny ray of hope. When September came he would be going off to secondary school and, for the first time in his life, he wouldn’t be with Dudley. Dudley had been accepted at Uncle Vernon’s old private school, Smeltings. Piers Polkiss was going there too. Harry, on the other hand, was going to Stonewall High, the local public school. Dudley thought this was very funny. They stuff people’s heads down the toilet the first day at Stonewall, he told Harry. Want to come upstairs and practice? No, thanks, said Harry. The poor toilet’s never had anything as horrible as your head down it — it might be sick. Then he ran, before Dudley could work out what he’d said. One day in July, Aunt Petunia took Dudley to London to buy his Smeltings uniform, leaving Harry at Mrs. Figg’s. Mrs. Figg wasn’t as bad as usual. It turned out she’d broken her leg tripping over one of her cats, and she didn’t seem quite as fond of them as before. She let Harry watch television and gave him a bit of chocolate cake that tasted as though she’d had it for several years. That evening, Dudley paraded around the living room for the family in his brand-new uniform. Smeltings’ boys wore maroon tailcoats, orange knickerbockers, and flat straw hats called boaters. They also carried knobbly sticks, used for hitting each other while the teachers weren’t looking. This was supposed to be good training for later life. As he looked at Dudley in his new knickerbockers, Uncle Vernon said gruffly that it was the proudest moment of his life. Aunt Petunia burst into tears and said she couldn’t believe it was her Ickle Dudleykins, he looked so handsome and grown-up. Harry didn’t trust himself to speak. He thought two of his ribs might already have cracked from trying not to laugh. There was a horrible smell in the kitchen the next morning when Harry went in for breakfast. It seemed to be coming from a large metal tub in the sink. He went to have a look. The tub was full of what looked like dirty rags swimming in gray water. What’s this? he asked Aunt Petunia. Her lips tightened as they always did if he dared to ask a question. Your new school uniform, she said. Harry looked in the bowl again. Oh, he said, I didn’t realize it had to be so wet. Don’t be stupid, snapped Aunt Petunia. I’m dyeing some of Dudley’s old things gray for you. It’ll look just like everyone else’s when I’ve finished. Harry seriously doubted this, but thought it best not to argue. He sat down at the table and tried not to think about how he was going to look on his first day at Stonewall High — like he was wearing bits of old elephant skin, probably. Dudley and Uncle Vernon came in, both with wrinkled noses because of the smell from Harry’s new uniform. Uncle Vernon opened his newspaper as usual and Dudley banged his Smelting stick, which he carried everywhere, on the table. They heard the click of the mail slot and flop of letters on the doormat. Get the mail, Dudley, said Uncle Vernon from behind his paper. Make Harry get it. Get the mail, Harry. Make Dudley get it. Poke him with your Smelting stick, Dudley. Harry dodged the Smelting stick and went to get the mail. Three things lay on the doormat: a postcard from Uncle Vernon’s sister Marge, who was vacationing on the Isle of Wight, a brown envelope that looked like a bill, and — a letter for Harry. Harry picked it up and stared at it, his heart twanging like a giant elastic band. No one, ever, in his whole life, had written to him. Who would? He had no friends, no other relatives — he didn’t belong to the library, so he’d never even got rude notes asking for books back. Yet here it was, a letter, addressed so plainly there could be no mistake: Mr. H. Potter The Cupboard under the Stairs4 Privet Drive Little Whinging Surrey The envelope was thick and heavy, made of yellowish parchment, and the address was written in emerald-green ink. There was no stamp. Turning the envelope over, his hand trembling, Harry saw a purple wax seal bearing a coat of arms; a lion, an eagle, a badger, and a snake surrounding a large letter H. Hurry up, boy! shouted Uncle Vernon from the kitchen. What are you doing, checking for letter bombs? He chuckled at his own joke. Harry went back to the kitchen, still staring at his letter. He handed Uncle Vernon the bill and the postcard, sat down, and slowly began to open the yellow envelope. Uncle Vernon ripped open the bill, snorted in disgust, and flipped over the postcard. Marge’s ill, he informed Aunt Petunia. Ate a funny whelk… Dad! said Dudley suddenly. Dad, Harry’s got something! Harry was on the point of unfolding his letter, which was written on the same heavy parchment as the envelope, when it was jerked sharply out of his hand by Uncle Vernon. That’s mine! said Harry, trying to snatch it back. Who’d be writing to you? sneered Uncle Vernon, shaking the letter open with one hand and glancing at it. His face went from red to green faster than a set of traffic lights. And it didn’t stop there. Within seconds it was the grayish white of old porridge. The escape of the Brazilian boa constrictor earned Harry his longest-ever punishment. By the time he was allowed out of his cupboard again, the summer holidays had started and Dudley had already broken his new video camera, crashed his remote control airplane, and, first time out on his racing bike, knocked down old Mrs. Figg as she crossed Privet Drive on her crutches. Harry was glad school was over, but there was no escaping Dudley’s gang, who visited the house every single day. Piers, Dennis, Malcolm, and Gordon were all big and stupid, but as Dudley was the biggest and stupidest of the lot, he was the leader. The rest of them were all quite happy to join in Dudley’s favorite sport: Harry Hunting. This was why Harry spent as much time as possible out of the house, wandering around and thinking about the end of the holidays, where he could see a tiny ray of hope. When September came he would be going off to secondary school and, for the first time in his life, he wouldn’t be with Dudley. Dudley had been accepted at Uncle Vernon’s old private school, Smeltings. Piers Polkiss was going there too. Harry, on the other hand, was going to Stonewall High, the local public school. Dudley thought this was very funny. They stuff people’s heads down the toilet the first day at Stonewall, he told Harry. Want to come upstairs and practice? No, thanks, said Harry. The poor toilet’s never had anything as horrible as your head down it — it might be sick. Then he ran, before Dudley could work out what he’d said. One day in July, Aunt Petunia took Dudley to London to buy his Smeltings uniform, leaving Harry at Mrs. Figg’s. Mrs. Figg wasn’t as bad as usual. It turned out she’d broken her leg tripping over one of her cats, and she didn’t seem quite as fond of them as before. She let Harry watch television and gave him a bit of chocolate cake that tasted as though she’d had it for several years. That evening, Dudley paraded around the living room for the family in his brand-new uniform. Smeltings’ boys wore maroon tailcoats, orange knickerbockers, and flat straw hats called boaters. They also carried knobbly sticks, used for hitting each other while the teachers weren’t looking. This was supposed to be good training for later life. As he looked at Dudley in his new knickerbockers, Uncle Vernon said gruffly that it was the proudest moment of his life. Aunt Petunia burst into tears and said she couldn’t believe it was her Ickle Dudleykins, he looked so handsome and grown-up. Harry didn’t trust himself to speak. He thought two of his ribs might already have cracked from trying not to laugh. There was a horrible smell in the kitchen the next morning when Harry went in for breakfast. It seemed to be coming from a large metal tub in the sink. He went to have a look. The tub was full of what looked like dirty rags swimming in gray water. What’s this? he asked Aunt Petunia. Her lips tightened as they always did if he dared to ask a question. Your new school uniform, she said. Harry looked in the bowl again. Oh, he said, I didn’t realize it had to be so wet. Don’t be stupid, snapped Aunt Petunia. I’m dyeing some of Dudley’s old things gray for you. It’ll look just like everyone else’s when I’ve finished. Harry seriously doubted this, but thought it best not to argue. He sat down at the table and tried not to think about how he was going to look on his first day at Stonewall High — like he was wearing bits of old elephant skin, probably. Dudley and Uncle Vernon came in, both with wrinkled noses because of the smell from Harry’s new uniform. Uncle Vernon opened his newspaper as usual and Dudley banged his Smelting stick, which he carried everywhere, on the table. They heard the click of the mail slot and flop of letters on the doormat. Get the mail, Dudley, said Uncle Vernon from behind his paper. Make Harry get it. Get the mail, Harry. Make Dudley get it. Poke him with your Smelting stick, Dudley. Harry dodged the Smelting stick and went to get the mail. Three things lay on the doormat: a postcard from Uncle Vernon’s sister Marge, who was vacationing on the Isle of Wight, a brown envelope that looked like a bill, and — a letter for Harry. Harry picked it up and stared at it, his heart twanging like a giant elastic band. No one, ever, in his whole life, had written to him. Who would? He had no friends, no other relatives — he didn’t belong to the library, so he’d never even got rude notes asking for books back. Yet here it was, a letter, addressed so plainly there could be no mistake: Mr. H. Potter The Cupboard under the Stairs 4 Privet Drive Little Whinging Surrey The envelope was thick and heavy, made of yellowish parchment, and the address was written in emerald-green ink. There was no stamp. Turning the envelope over, his hand trembling, Harry saw a purple wax seal bearing a coat of arms; a lion, an eagle, a badger, and a snake surrounding a large letter H. Hurry up, boy! shouted Uncle Vernon from the kitchen. What are you doing, checking for letter bombs? He chuckled at his own joke. Harry went back to the kitchen, still staring at his letter. He handed Uncle Vernon the bill and the postcard, sat down, and slowly began to open the yellow envelope. Uncle Vernon ripped open the bill, snorted in disgust, and flipped over the postcard. Marge’s ill, he informed Aunt Petunia. Ate a funny whelk… Dad! said Dudley suddenly. Dad, Harry’s got something! Harry was on the point of unfolding his letter, which was written on the same heavy parchment as the envelope, when it was jerked sharply out of his hand by Uncle Vernon. That’s mine! said Harry, trying to snatch it back. Who’d be writing to you? sneered Uncle Vernon, shaking the letter open with one hand and glancing at it. His face went from red to green faster than a set of traffic lights. And it didn’t stop there. Within seconds it was the grayish white of old porridge. P-P-Petunia! he gasped. Dudley tried to grab the letter to read it, but Uncle Vernon held it high out of his reach. Aunt Petunia took it curiously and read the first line. For a moment it looked as though she might faint. She clutched her throat and made a choking noise. Vernon! Oh my goodness — Vernon! They stared at each other, seeming to have forgotten that Harry and Dudley were still in the room. Dudley wasn’t used to being ignored. He gave his father a sharp tap on the head with his Smelting stick. I want to read that letter, he said loudly. I want to read it, said Harry furiously, as it’s mine. Get out, both of you, croaked Uncle Vernon, stuffing the letter back inside its envelope. Harry didn’t move. I WANT MY LETTER! he shouted. Let me see it! demanded Dudley. OUT! roared Uncle Vernon, and he took both Harry and Dudley by the scruffs of their necks and threw them into the hall, slamming the kitchen door behind them. Harry and Dudley promptly had a furious but silent fight over who would listen at the keyhole; Dudley won, so Harry, his glasses dangling from one ear, lay flat on his stomach to listen at the crack between door and floor. Vernon, Aunt Petunia was saying in a quivering voice, look at the address — how could they possibly know where he sleeps? You don’t think they’re watching the house? Watching — spying — might be following us, muttered Uncle Vernon wildly. But what should we do, Vernon? Should we write back? Tell them we don’t want — Harry could see Uncle Vernon’s shiny black shoes pacing up and down the kitchen. No, he said finally. No, we’ll ignore it. If they don’t get an answer… Yes, that’s best… we won’t do anything… But — I’m not having one in the house, Petunia! Didn’t we swear when we took him in we’d stamp out that dangerous nonsense? That evening when he got back from work, Uncle Vernon did something he’d never done before; he visited Harry in his cupboard. Where’s my letter? said Harry, the moment Uncle Vernon had squeezed through the door. Who’s writing to me? No one. It was addressed to you by mistake, said Uncle Vernon shortly. I have burned it. It was not a mistake, said Harry angrily, it had my cupboard on it. SILENCE! yelled Uncle Vernon, and a couple of spiders fell from the ceiling. He took a few deep breaths and then forced his face into a smile, which looked quite painful. Er — yes, Harry — about this cupboard. Your aunt and I have been thinking… you’re really getting a bit big for it… we think it might be nice if you moved into Dudley’s second bedroom. Why? said Harry. Don’t ask questions! snapped his uncle. Take this stuff upstairs, now. The Dursleys’ house had four bedrooms: one for Uncle Vernon and Aunt Petunia, one for visitors (usually Uncle Vernon’s sister, Marge), one where Dudley slept, and one where Dudley kept all the toys and things that wouldn’t fit into his first bedroom. It only took Harry one trip upstairs to move everything he owned from the cupboard to this room. He sat down on the bed and stared around him. Nearly everything in here was broken. The month-old video camera was lying on top of a small, working tank Dudley had once driven over the next door neighbor’s dog; in the corner was Dudley’s first-ever television set, which he’d put his foot through when his favorite program had been canceled; there was a large birdcage, which had once held a parrot that Dudley had swapped at school for a real air rifle, which was up on a shelf with the end all bent because Dudley had sat on it. Other shelves were full of books. They were the only things in the room that looked as though they’d never been touched. From downstairs came the sound of Dudley bawling at his mother, I don’t want him in there… I need that room… make him get out… Harry sighed and stretched out on the bed. Yesterday he’d have given anything to be up here. Today he’d rather be back in his cupboard with that letter than up here without it. Next morning at breakfast, everyone was rather quiet. Dudley was in shock. He’d screamed, whacked his father with his Smelting stick, been sick on purpose, kicked his mother, and thrown his tortoise through the greenhouse roof, and he still didn’t have his room back. Harry was thinking about this time yesterday and bitterly wishing he’d opened the letter in the hall. Uncle Vernon and Aunt Petunia kept looking at each other darkly. When the mail arrived, Uncle Vernon, who seemed to be trying to be nice to Harry, made Dudley go and get it. They heard him banging things with his Smelting stick all the way down the hall. Then he shouted, There’s another one! ‘Mr. H. Potter, The Smallest Bedroom, 4 Privet Drive —’ With a strangled cry, Uncle Vernon leapt from his seat and ran down the hall, Harry right behind him. Uncle Vernon had to wrestle Dudley to the ground to get the letter from him, which was made difficult by the fact that Harry had grabbed Uncle Vernon around the neck from behind. After a minute of confused fighting, in which everyone got hit a lot by the Smelting stick, Uncle Vernon straightened up, gasping for breath, with Harry’s letter clutched in his hand. Go to your cupboard — I mean, your bedroom, he wheezed at Harry. Dudley — go — just go. Harry walked round and round his new room. Someone knew he had moved out of his cupboard and they seemed to know he hadn’t received his first letter. Surely that meant they’d try again? And this time he’d make sure they didn’t fail. He had a plan. The repaired alarm clock rang at six o’clock the next morning. Harry turned it off quickly and dressed silently. He mustn’t wake the Dursleys. He stole downstairs without turning on any of the lights. He was going to wait for the postman on the corner of Privet Drive and get the letters for number four first. His heart hammered as he crept across the dark hall toward the front door — AAAAARRRGH! Harry leapt into the air; he’d trodden on something big and squashy on the doormat — something alive! Lights clicked on upstairs and to his horror Harry realized that the big, squashy something had been his uncle’s face. Uncle Vernon had been lying at the foot of the front door in a sleeping bag, clearly making sure that Harry didn’t do exactly what he’d been trying to do. He shouted at Harry for about half an hour and then told him to go and make a cup of tea. Harry shuffled miserably off into the kitchen and by the time he got back, the mail had arrived, right into Uncle Vernon’s lap. Harry could see three letters addressed in green ink. I want — he began, but Uncle Vernon was tearing the letters into pieces before his eyes. Uncle Vernon didn’t go to work that day. He stayed at home and nailed up the mail slot. See, he explained to Aunt Petunia through a mouthful of nails, if they can’t deliver them they’ll just give up. I’m not sure that’ll work, Vernon. Oh, these people’s minds work in strange ways, Petunia, they’re not like you and me, said Uncle Vernon, trying to knock in a nail with the piece of fruitcake Aunt Petunia had just brought him. On Friday, no less than twelve letters arrived for Harry. As they couldn’t go through the mail slot they had been pushed under the door, slotted through the sides, and a few even forced through the small window in the downstairs bathroom. Uncle Vernon stayed at home again. After burning all the letters, he got out a hammer and nails and boarded up the cracks around the front and back doors so no one could go out. He hummed Tiptoe Through the Tulips as he worked, and jumped at small noises. On Saturday, things began to get out of hand. Twenty-four letters to Harry found their way into the house, rolled up and hidden inside each of the two dozen eggs that their very confused milkman had handed Aunt Petunia through the living room window. While Uncle Vernon made furious telephone calls to the post office and the dairy trying to find someone to complain to, Aunt Petunia shredded the letters in her food processor. Who on earth wants to talk to you this badly? Dudley asked Harry in amazement. On Sunday morning, Uncle Vernon sat down at the breakfast table looking tired and rather ill, but happy. No post on Sundays, he reminded them cheerfully as he spread marmalade on his newspapers, no damn letters today — Something came whizzing down the kitchen chimney as he spoke and caught him sharply on the back of the head. Next moment, thirty or forty letters came pelting out of the fireplace like bullets. The Dursleys ducked, but Harry leapt into the air trying to catch one — Out! OUT! Uncle Vernon seized Harry around the waist and threw him into the hall. When Aunt Petunia and Dudley had run out with their arms over their faces, Uncle Vernon slammed the door shut. They could hear the letters still streaming into the room, bouncing off the walls and floor. That does it, said Uncle Vernon, trying to speak calmly but pulling great tufts out of his mustache at the same time. I want you all back here in five minutes ready to leave. We’re going away. Just pack some clothes. No arguments! He looked so dangerous with half his mustache missing that no one dared argue. Ten minutes later they had wrenched their way through the boarded-up doors and were in the car, speeding toward the highway. Dudley was sniffling in the back seat; his father had hit him round the head for holding them up while he tried to pack his television, VCR, and computer in his sports bag. They drove. And they drove. Even Aunt Petunia didn’t dare ask where they were going. Every now and then Uncle Vernon would take a sharp turn and drive in the opposite direction for a while. Shake ’em off… shake ’em off, he would mutter whenever he did this. They didn’t stop to eat or drink all day. By nightfall Dudley was howling. He’d never had such a bad day in his life. He was hungry, he’d missed five television programs he’d wanted to see, and he’d never gone so long without blowing up an alien on his computer. Uncle Vernon stopped at last outside a gloomy-looking hotel on the outskirts of a big city. Dudley and Harry shared a room with twin beds and damp, musty sheets. Dudley snored but Harry stayed awake, sitting on the windowsill, staring down at the lights of passing cars and wondering… They ate stale cornflakes and cold tinned tomatoes on toast for breakfast the next day. They had just finished when the owner of the hotel came over to their table. ’Scuse me, but is one of you Mr. H. Potter? Only I got about an ’undred of these at the front desk. She held up a letter so they could read the green ink address: Mr. H. Potter Room 17 Railview Hotel Cokeworth Harry made a grab for the letter but Uncle Vernon knocked his hand out of the way. The woman stared. I’ll take them, said Uncle Vernon, standing up quickly and following her from the dining room. Wouldn’t it be better just to go home, dear? Aunt Petunia suggested timidly, hours later, but Uncle Vernon didn’t seem to hear her. Exactly what he was looking for, none of them knew. He drove them into the middle of a forest, got out, looked around, shook his head, got back in the car, and off they went again. The same thing happened in the middle of a plowed field, halfway across a suspension bridge, and at the top of a multilevel parking garage. Daddy’s gone mad, hasn’t he? Dudley asked Aunt Petunia dully late that afternoon. Uncle Vernon had parked at the coast, locked them all inside the car, and disappeared. It started to rain. Great drops beat on the roof of the car. Dudley sniveled. It’s Monday, he told his mother. The Great Humberto’s on tonight. I want to stay somewhere with a television. Monday. This reminded Harry of something. If it was Monday — and you could usually count on Dudley to know the days the week, because of television — then tomorrow, Tuesday, was Harry’s eleventh birthday. Of course, his birthdays were never exactly fun — last year, the Dursleys had given him a coat hanger and a pair of Uncle Vernon’s old socks. Still, you weren’t eleven every day. Uncle Vernon was back and he was smiling. He was also carrying a long, thin package and didn’t answer Aunt Petunia when she asked what he’d bought. Found the perfect place! he said. Come on! Everyone out! It was very cold outside the car. Uncle Vernon was pointing at what looked like a large rock way out at sea. Perched on top of the rock was the most miserable little shack you could imagine. One thing was certain, there was no television in there. Storm forecast for tonight! said Uncle Vernon gleefully, clapping his hands together. And this gentleman’s kindly agreed to lend us his boat! A toothless old man came ambling up to them, pointing, with a rather wicked grin, at an old rowboat bobbing in the iron-gray water below them. I’ve already got us some rations, said Uncle Vernon, so all aboard! It was freezing in the boat. Icy sea spray and rain crept down their necks and a chilly wind whipped their faces. After what seemed like hours they reached the rock, where Uncle Vernon, slipping and sliding, led the way to the broken-down house. The inside was horrible; it smelled strongly of seaweed, the wind whistled through the gaps in the wooden walls, and the fireplace was damp and empty. There were only two rooms. Uncle Vernon’s rations turned out to be a bag of chips each and four bananas. He tried to start a fire but the empty chip bags just smoked and shriveled up. Could do with some of those letters now, eh? he said cheerfully. He was in a very good mood. Obviously he thought nobody stood a chance of reaching them here in a storm to deliver mail. Harry privately agreed, though the thought didn’t cheer him up at all. As night fell, the promised storm blew up around them. Spray from the high waves splattered the walls of the hut and a fierce wind rattled the filthy windows. Aunt Petunia found a few moldy blankets in the second room and made up a bed for Dudley on the moth-eaten sofa. She and Uncle Vernon went off to the lumpy bed next door, and Harry was left to find the softest bit of floor he could and to curl up under the thinnest, most ragged blanket. The storm raged more and more ferociously as the night went on. Harry couldn’t sleep. He shivered and turned over, trying to get comfortable, his stomach rumbling with hunger. Dudley’s snores were drowned by the low rolls of thunder that started near midnight. The lighted dial of Dudley’s watch, which was dangling over the edge of the sofa on his fat wrist, told Harry he’d be eleven in ten minutes’ time. He lay and watched his birthday tick nearer, wondering if the Dursleys would remember at all, wondering where the letter writer was now. Five minutes to go. Harry heard something creak outside. He hoped the roof wasn’t going to fall in, although he might be warmer if it did. Four minutes to go. Maybe the house in Privet Drive would be so full of letters when they got back that he’d be able to steal one somehow. Three minutes to go. Was that the sea, slapping hard on the rock like that? And (two minutes to go) what was that funny crunching noise? Was the rock crumbling into the sea? One minute to go and he’d be eleven. Thirty seconds… twenty… ten… nine — maybe he’d wake Dudley up, just to annoy him — three… two… one… BOOM. The whole shack shivered and Harry sat bolt upright, staring at the door. Someone was outside, knocking to come in."
}
```

</p>
</details>
