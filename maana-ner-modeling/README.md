## Maana NER Modeling service

This is the maana NER (Named Entity Recognition) Modeling graphql microservice.
It provides:

1.  Extract entities (Person name, Location, Phone number, ...) from text.
2.  Training new CRF (Conditional Random Field) Classifier Model. https://en.wikipedia.org/wiki/Conditional_random_field
3.  Testing CRF Model.

Maana-NER-Modeling detects entities in text data using:

- Stochastic (CRF-classifier) and
- Deterministic (Token-Regex) methods. File: **/maana-ner-modeling/src/main/resources/Regex.rules**
  To write your own TokensRegex rules use:
  https://nlp.stanford.edu/software/tokensregex.html

## Detected Entities with default Stanford CRF Model:

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

| Query                   | Comment                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| extract();              | Extract entities from text with Model (Stanford Model or yours CRF Model).               |
| extractBatch();         | Extract entities from many texts with Model.                                             |
| isSurfaceForm();        | Detection if text is surface form of entity.                                             |
| parse();                | Parsing text to entity.                                                                  |
| normalize();            | Data transformation to standard (see below) format.                                      |
| saveProgressToKind();   | Normalize data and save as a record to Maana Kinds "NERLabeledData" and "NERModelStat".  |
| readProgressFromKind(); | Read normalized data from Maana Kind "NERLabeledData".                                   |
| training();             | Building new CRF-Model and caching inside NER-Modeling-Service.                          |
| testing();              | Testing external CRF-Model.                                                              |
| trainingToKind();       | training() + saving CRF-Model as Maana Kind File and make record to Kind "NERModelStat". |
| testingToKind();        | testing() + make record to Maana Kind "NERModelStat".                                    |
| getModel();             | Read CRF-Model from NER-Modeling-Service cache and return as Base64-String.              |
| extendXMLText();        | Extending XML-tagged entities throughout the whole text.                                 |
| extend();               | Extending tagged entities throughout the whole text.                                     |
| extendBatch();          | Extending tagged entities throughout the whole texts.                                    |
| splitToSentences();     | Split text to sentences.                                                                 |

## Schema

<details style="color:green">
<summary>click to expand Schema</summary>
<p>

```ruby
type Info {
  id: ID!
  name: String!
  description: String
  srl: String
}

# Here the following entity formats are supported:
# 1) tag, token, span, offset
# 2) tag, tokens, start, end
input EntityInput {
  tag: String! # tag or label or name or kindName
  token: String # = tokens.join(' ')
  span: Int # length of token
  offset: Int # char offset of token in text
  tokens: [String] # = token.split(' ')
  start: Int # number of first word of tokens in text
  end: Int # number of last word of tokens in text + 1
  color: String
}

input PhraseInput {
  text: String! # Alternative: either entities not omitted either text contains xml-tagged entities
  entities: [EntityInput]
}

type Entity {
  tag: String!
  token: String!
  span: Int!
  offset: Int!
  tokens: [String]
  start: Int
  end: Int
  prob: [Prob]
  color: String
}

type Prob {
  tag: String!
  prob: Float!
}

type Phrase {
  text: String!
  xtext: String
  entities: [Entity]
  kBestProb: [Float]
}

type EntityStatistics {
  tag: String
  expectedCount: Int
  observedCount: Int
  truePositives: Float
  falsePositives: Float
  falseNegatives: Float
  precision: Float
  recall: Float
  f1: Float
}

type NERStatistics {
  timeStamp: String
  name: String
  dataKind: String # JSON: id, url, name, ...
  elapsedTime: String
  phraseCount: Int
  statOverAll: EntityStatistics
  statPerEntity: [EntityStatistics]
}

# Priority order: URL, name, kindId
input ModelInput {
  URL: String
  name: String
  kindId: ID
}

input DataInput {
  URL: String
  name: String
  kindId: ID
  sources: [PhraseInput] # priority
  labels: String # JSON
}

type Data {
  id: String
  timeStamp: String
  name: String
  labels: String # JSON
  sources: [Phrase]
}

type RecordToKind {
  timeStamp: String
  dataKindName: String
  dataKindId: String
  dataRecordId: String
  modelKindName: String
  modelKindId: String
  modelRecordId: String
}

type CRFModel {
  timeStamp: String
  modelKind: String # JSON: id, url, name, ...
  dataKind: String # JSON: id, url, name, ...
  params: String # JSON: splitRate, seed, ...
  timeToLearn: String
  trainStat: NERStatistics
  testStat: NERStatistics
}

type Query {
  # Information about the service.
  info: Info!

  # Extract entities from the provided source.
  # calcProb - to calc probability distribution for each detected entity
  # k - return probabilities of k best annotations
  # calcProb & k - don't work with default Stanford CRF Model
  extract(
    source: String!
    model: ModelInput
    calcProb: Boolean
    k: Int
    decimals: Int
  ): Phrase

  # Extract entities from many sources.
  extractBatch(
    sources: [String]!
    model: ModelInput
    calcProb: Boolean
    k: Int
    decimals: Int
  ): [Phrase]

  # Return true if source == serfaceForm
  isSurfaceForm(source: String!, tag: String!, model: ModelInput): Boolean!

  # Return source if source is serfaceForm of entity
  parse(source: String!, model: ModelInput): String!

  # Training/Testing CRF model by 3 ways:
  # 1) splitRate > 0.0 - split data to training and testing sets
  # 2) numFolds > 0 - cross fold validation
  # 3) otherwise - training on whole data set
  training(
    data: DataInput!
    model: ModelInput!
    splitRate: Float
    numFolds: Int
    seed: Int
    decimals: Int
  ): CRFModel

  # Testing CRF model.
  testing(data: DataInput!, model: ModelInput!, decimals: Int): NERStatistics

  # Get CRF model as string of bytes.
  # Retrieve by portions if length > 0, length - is a size (bytes) of each portion.
  # After last portion return empty string and then again starts from first portion.
  getModel(model: ModelInput, length: Int): String

  splitToSentences(text: String): [String]

  # Extending XML-tagged entities throughout the whole text.
  # text - partially XML-tagging text
  extendXMLText(text: String!, model: ModelInput): String

  # Extending tagged entities throughout the whole source (phrase).
  # calcProb - to calc probability distribution for each detected entity
  # k - return probabilities of k best annotations
  # calcProb & k - don't work with default Stanford CRF Model
  extend(
    source: PhraseInput!
    model: ModelInput
    calcProb: Boolean
    k: Int
    decimals: Int
  ): Phrase

  # Extending tagged entities throughout the whole sources (phrases).
  extendBatch(
    sources: [PhraseInput]!
    model: ModelInput
    calcProb: Boolean
    k: Int
    decimals: Int
  ): [Phrase]

  readProgressFromKind(dataKindRecordId: String!): Data

  normalize(sources: [PhraseInput]!): [Phrase]
}

type Mutation {
  # Training/Testing CRF model by 3 ways:
  # 1) splitRate > 0.0 - split data to training and testing sets
  # 2) numFolds > 0 - cross fold validation
  # 3) otherwise - training on whole data set
  trainingToKind(
    data: DataInput!
    model: ModelInput
    splitRate: Float
    numFolds: Int
    seed: Int
    decimals: Int
  ): CRFModel

  # Testing CRF model.
  testingToKind(
    data: DataInput!
    model: ModelInput!
    decimals: Int
  ): NERStatistics

  saveProgressToKind(data: DataInput!, model: ModelInput): RecordToKind
}

schema {
  query: Query
  mutation: Mutation
}
```

</p>
</details>

## Formats of train/test data

dataURL (in training / testing queries) is a path or URL to data file of many formats: .json, .csv, .tsv, .txt

1.  Phrase array .json
    Each entity can be defined one of combination:

- {tag, token} - entities in this format must to be ordered in according of their appearance in the text
- {tag, span, offset} - this is character-based format and entities may not be ordered
- {tag, tokens} - this is word-based format and entities must to be ordered
- {tag, start, end} - this is word-based format and entities may not be ordered

```json
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

2.  Document .json

```json
{
  "title": "BOEM Data - Common Entities",
  "type": "Drilling Comments",
  "phrases": [
    //... phrase array ...
  ]
}
```

3.  Document array .json

```json
[
  //... document array ...
]
```

4.  Phrase list .txt or .csv or .tsv

```json
{
  //phrase 1
}
{
  //phrase 2
}
//...
```

5. xml-tagged .txt or .csv or .tsv

```xml
<Person>Satya Narayana Nadella</Person> is from <Location>India</Location>.
He is the CEO of <Organization>Microsoft</Organization>.
```

6. Word-tag .tsv
   This is Stanford lib basic data format. To train new CRF Model all other data formats will be transformed to this format inside service.

- each line contains \t separated word and label
- untagged marked by tag "O"
- punctuation signs , ; . as a separate words
- each phrase ended with dot .
- empty line between phrases

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

## Examples of query

### Example of normalize query:

- Normalization of tagged phrases means to convert them to standard format - { text xtext entities {tag token span offset tokens start end} }
- Tagged phrases could be represented in different formats (see examples and comments below in query code)
- To avoid ambiguity use xml-tagged text or character based entity format - {tag, token, offset, span}.
- Words based data format - {tokens, start, end, color} is developed to use in Active Learning UI and is not precise format because entity sometime is the part of word but not separate word.

```graphql
query Normalize {
  normalize(
    sources: [
      {
        # format of text with xml-tagged entities
        text: "<Person>William Gilbert</Person> was born in <Location>Colchester, England</Location>, into a middle class family of some wealth."
      }
      {
        # format of plain text with list of entities, where entities defined by {tag and token} and must be ordered in according of their appearance in the text.
        text: "Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, Isaac Newton (1643-1727), who was born in Lincolnshire, outlined the laws of mechanics that now underpin vast swaths of classical physics."
        entities: [
          { tag: "Person", token: "Isaac Newton" }
          { tag: "Date", token: "1643-1727" }
          { tag: "Location", token: "Lincolnshire" }
        ]
      }
      {
        # format of plain text with list of entities, where entities are fully defined and don't need to be ordered
        text: "Born in Copenhagen, Bohr (1885-1962) developed the modern idea of an atom, which has a nucleus at the centre with electrons revolving round it."
        entities: [
          { tag: "Location", token: "Copenhagen", offset: 8, span: 10 }
          { tag: "Person", token: "Bohr", offset: 20, span: 4 }
          { tag: "Date", token: "1885-1962", offset: 26, span: 9 }
        ]
      }
    ]
  ) {
    text
    xtext
    entities {
      tag
      token
      span
      offset
      tokens
      start
      end
    }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "normalize": [
      {
        "text": "William Gilbert was born in Colchester, England, into a middle class family of some wealth.",
        "xtext": "<Person>William Gilbert</Person> was born in <Location>Colchester, England</Location>, into a middle class family of some wealth.",
        "entities": [
          {
            "tag": "Person",
            "token": "William Gilbert",
            "span": 15,
            "offset": 0,
            "tokens": ["William", "Gilbert"],
            "start": 0,
            "end": 2
          },
          {
            "tag": "Location",
            "token": "Colchester, England",
            "span": 19,
            "offset": 28,
            "tokens": ["Colchester,", "England,"],
            "start": 5,
            "end": 7
          }
        ]
      },
      {
        "text": "Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, Isaac Newton (1643-1727), who was born in Lincolnshire, outlined the laws of mechanics that now underpin vast swaths of classical physics.",
        "xtext": "Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, <Person>Isaac Newton</Person> (<Date>1643-1727</Date>), who was born in <Location>Lincolnshire</Location>, outlined the laws of mechanics that now underpin vast swaths of classical physics.",
        "entities": [
          {
            "tag": "Person",
            "token": "Isaac Newton",
            "span": 12,
            "offset": 98,
            "tokens": ["Isaac", "Newton"],
            "start": 15,
            "end": 17
          },
          {
            "tag": "Date",
            "token": "1643-1727",
            "span": 9,
            "offset": 112,
            "tokens": ["(1643-1727),"],
            "start": 17,
            "end": 18
          },
          {
            "tag": "Location",
            "token": "Lincolnshire",
            "span": 12,
            "offset": 140,
            "tokens": ["Lincolnshire,"],
            "start": 22,
            "end": 23
          }
        ]
      },
      {
        "text": "Born in Copenhagen, Bohr (1885-1962) developed the modern idea of an atom, which has a nucleus at the centre with electrons revolving round it.",
        "xtext": "Born in <Location>Copenhagen</Location>, <Person>Bohr</Person> (<Date>1885-1962</Date>) developed the modern idea of an atom, which has a nucleus at the centre with electrons revolving round it.",
        "entities": [
          {
            "tag": "Location",
            "token": "Copenhagen",
            "span": 10,
            "offset": 8,
            "tokens": ["Copenhagen,"],
            "start": 2,
            "end": 3
          },
          {
            "tag": "Person",
            "token": "Bohr",
            "span": 4,
            "offset": 20,
            "tokens": ["Bohr"],
            "start": 3,
            "end": 4
          },
          {
            "tag": "Date",
            "token": "1885-1962",
            "span": 9,
            "offset": 26,
            "tokens": ["(1885-1962)"],
            "start": 4,
            "end": 5
          }
        ]
      }
    ]
  }
}
```

</p>
</details>

### Example of mutation query - saving progress

It saves annotated sentences to Maana Kind. Before saving it makes normalization.

```graphql
mutation SaveProgress {
  saveProgressToKind(
    model: { name: "myModel" }
    data: {
      name: "myData"
      labels: "{\"Person\": \"value1\", \"Location\": \"value2\"}"
      sources: [
        {
          text: "<Person>William Gilbert</Person> was born in <Location>Colchester, England</Location>, into a middle class family of some wealth."
        }
        {
          text: "Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, Isaac Newton (1643-1727), who was born in Lincolnshire, outlined the laws of mechanics that now underpin vast swaths of classical physics."
          entities: [
            { tag: "Person", token: "Isaac Newton" }
            { tag: "Date", token: "1643-1727" }
            { tag: "Location", token: "Lincolnshire" }
          ]
        }
        {
          text: "Born in Copenhagen, Bohr (1885-1962) developed the modern idea of an atom, which has a nucleus at the centre with electrons revolving round it."
          entities: [
            { tag: "Location", token: "Copenhagen", offset: 8, span: 10 }
            { tag: "Person", token: "Bohr", offset: 20, span: 4 }
            { tag: "Date", token: "1885-1962", offset: 26, span: 9 }
          ]
        }
      ]
    }
  ) {
    timeStamp
    dataKindName
    dataKindId
    dataRecordId
    modelKindName
    modelKindId
    modelRecordId
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "saveProgressToKind": {
      "timeStamp": "3/12/2019, 2:46:27 PM",
      "dataKindName": "NERLabeledData",
      "dataKindId": "703b39bf-a249-486a-80a4-9cd7b2760b9d",
      "dataRecordId": "05b0bc36-d24b-47dc-9218-dd0d6023a476",
      "modelKindName": "NERModelStat",
      "modelKindId": "29a9586f-80e1-4cd3-97b2-143b8187efd9",
      "modelRecordId": "ae36dded-0ad8-4890-a0b5-cacb5886aeda"
    }
  }
}
```

</p>
</details>

### Example of read progress

It reads saved sentences from Maana Kind

```graphql
query ReadProgress {
  readProgressFromKind(
    dataKindRecordId: "6fc730d5-a363-4393-ac58-600649b61ad4"
  ) {
    timeStamp
    name
    labels
    sources {
      text
      xtext
      entities {
        tag
        token
        span
        offset
        tokens
        start
        end
        color
      }
    }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "readProgressFromKind": {
      "timeStamp": "4/1/2019, 1:19:42 PM",
      "name": "myData",
      "labels": "{\"Person\":\"value1\",\"Location\":\"value2\"}",
      "sources": [
        {
          "text": "William Gilbert was born in Colchester, England, into a middle class family of some wealth.",
          "xtext": "<Person>William Gilbert</Person> was born in <Location>Colchester, England</Location>, into a middle class family of some wealth.",
          "entities": [
            {
              "tag": "Person",
              "token": "William Gilbert",
              "span": 15,
              "offset": 0,
              "tokens": ["William", "Gilbert"],
              "start": 0,
              "end": 2,
              "color": null
            },
            {
              "tag": "Location",
              "token": "Colchester, England",
              "span": 19,
              "offset": 28,
              "tokens": ["Colchester,", "England,"],
              "start": 5,
              "end": 7,
              "color": null
            }
          ]
        },
        {
          "text": "Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, Isaac Newton (1643-1727), who was born in Lincolnshire, outlined the laws of mechanics that now underpin vast swaths of classical physics.",
          "xtext": "Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, <Person>Isaac Newton</Person> (<Date>1643-1727</Date>), who was born in <Location>Lincolnshire</Location>, outlined the laws of mechanics that now underpin vast swaths of classical physics.",
          "entities": [
            {
              "tag": "Person",
              "token": "Isaac Newton",
              "span": 12,
              "offset": 98,
              "tokens": ["Isaac", "Newton"],
              "start": 15,
              "end": 17,
              "color": null
            },
            {
              "tag": "Date",
              "token": "1643-1727",
              "span": 9,
              "offset": 112,
              "tokens": ["(1643-1727),"],
              "start": 17,
              "end": 18,
              "color": null
            },
            {
              "tag": "Location",
              "token": "Lincolnshire",
              "span": 12,
              "offset": 140,
              "tokens": ["Lincolnshire,"],
              "start": 22,
              "end": 23,
              "color": null
            }
          ]
        },
        {
          "text": "Born in Copenhagen, Bohr (1885-1962) developed the modern idea of an atom, which has a nucleus at the centre with electrons revolving round it.",
          "xtext": "Born in <Location>Copenhagen</Location>, <Person>Bohr</Person> (<Date>1885-1962</Date>) developed the modern idea of an atom, which has a nucleus at the centre with electrons revolving round it.",
          "entities": [
            {
              "tag": "Location",
              "token": "Copenhagen",
              "span": 10,
              "offset": 8,
              "tokens": ["Copenhagen,"],
              "start": 2,
              "end": 3,
              "color": null
            },
            {
              "tag": "Person",
              "token": "Bohr",
              "span": 4,
              "offset": 20,
              "tokens": ["Bohr"],
              "start": 3,
              "end": 4,
              "color": null
            },
            {
              "tag": "Date",
              "token": "1885-1962",
              "span": 9,
              "offset": 26,
              "tokens": ["(1885-1962)"],
              "start": 4,
              "end": 5,
              "color": null
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

### Example of building new CRF model on training data from file:

There are several differences between mutation - 'trainingToKind' and query - 'training':

1. mutation adds binary .ser.gz-file as a Kind to Maana with CRF Model content
2. mutation makes a record into the 'NERModelStat' Kind in Maana (if Kind doesn't exist it wiill be created)
3. mutation makes a record into the 'NERLabeledData' Kind in Maana (if Kind doesn't exist it wiill be created)

- data.URL is a path or URL to data file of many formats: .json, .csv, .tsv, .txt (see explanation below)

```graphql
mutation TrainFromFileToKind {
  trainingToKind(
    data: {
      name: "BOEM_labeled"
      URL: "../library/src/test/resources/BOEM_labeled.json" # formats: .json, .csv, .tsv, .txt"
      # URL: "%PUBLIC_BACKEND_URI%/downloads/1250010d-5844-48aa-84ae-d96b28ab5d90/BOEM_labeled.json", # example of URL from Maana
      # kindId: "1250010d-5844-48aa-84ae-d96b28ab5d90" # use Kind ID if data was uploaded to Maana
    }
    model: {
      name: "myModel" # new model will be saved to Maana as a kind file with this name
      # URL: "path/or/URL/to/myModel.ser.gz" # if local path is specified then model will also be saved to this path as well
    }
    splitRate: 0.2
    seed: 5
    decimals: 3
  ) {
    timeStamp
    modelKind
    dataKind
    params
    timeToLearn
    trainStat {
      name
      phraseCount
      elapsedTime
      dataKind
      statOverAll {
        expectedCount
        observedCount
        truePositives
        falsePositives
        falseNegatives
        precision
        recall
        f1
      }
      statPerEntity {
        tag
        precision
        recall
        f1
      }
    }
    testStat {
      name
      phraseCount
      statOverAll {
        expectedCount
        observedCount
        truePositives
        falsePositives
        falseNegatives
        precision
        recall
        f1
      }
      statPerEntity {
        tag
        precision
        recall
        f1
      }
    }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "trainingToKind": {
      "timeStamp": "3/25/2019, 10:04:45 PM",
      "modelKind": "{\"id\":\"2fd4897a-5d4c-4cd3-a819-b33a673fa660\",\"url\":\"https://ci04.corp.maana.io:8443/downloads/2fd4897a-5d4c-4cd3-a819-b33a673fa660/myModel.ser.gz\",\"name\":\"myModel\"}",
      "dataKind": "{\"id\":\"\",\"url\":\"../library/src/test/resources/BOEM_labeled.json\",\"name\":\"BOEM_data\"}",
      "params": "{\"splitRate\":0.2,\"seed\":5}",
      "timeToLearn": "00:00:33.633",
      "trainStat": {
        "name": "Train",
        "phraseCount": 340,
        "elapsedTime": "00:00:01.901",
        "dataKind": "{\"id\":\"\",\"url\":\"../library/src/test/resources/BOEM_labeled.json\",\"name\":\"BOEM_data\"}",
        "statOverAll": {
          "expectedCount": 1690,
          "observedCount": 1420,
          "truePositives": 1420,
          "falsePositives": 11.8,
          "falseNegatives": 273,
          "precision": 0.992,
          "recall": 0.838,
          "f1": 0.909
        },
        "statPerEntity": [
          {
            "tag": "Email",
            "precision": 0,
            "recall": 0,
            "f1": 0
          },
          {
            "tag": "Organization",
            "precision": 0.991,
            "recall": 0.842,
            "f1": 0.91
          },
          {
            "tag": "DateKind",
            "precision": 1,
            "recall": 0.854,
            "f1": 0.921
          },
          {
            "tag": "TimeKind",
            "precision": 0.984,
            "recall": 0.598,
            "f1": 0.744
          },
          {
            "tag": "PhoneNumber",
            "precision": 0,
            "recall": 0,
            "f1": 0
          },
          {
            "tag": "Person",
            "precision": 0.997,
            "recall": 0.911,
            "f1": 0.952
          },
          {
            "tag": "Location",
            "precision": 0.983,
            "recall": 0.947,
            "f1": 0.965
          }
        ]
      },
      "testStat": {
        "name": "Test",
        "phraseCount": 1360,
        "statOverAll": {
          "expectedCount": 6670,
          "observedCount": 5380,
          "truePositives": 5260,
          "falsePositives": 150,
          "falseNegatives": 1410,
          "precision": 0.972,
          "recall": 0.788,
          "f1": 0.871
        },
        "statPerEntity": [
          {
            "tag": "Email",
            "precision": 0,
            "recall": 0,
            "f1": 0
          },
          {
            "tag": "DateKind",
            "precision": 0.998,
            "recall": 0.807,
            "f1": 0.892
          },
          {
            "tag": "Organization",
            "precision": 0.971,
            "recall": 0.79,
            "f1": 0.872
          },
          {
            "tag": "TimeKind",
            "precision": 0.981,
            "recall": 0.604,
            "f1": 0.747
          },
          {
            "tag": "PhoneNumber",
            "precision": 0,
            "recall": 0,
            "f1": 0
          },
          {
            "tag": "Person",
            "precision": 0.957,
            "recall": 0.883,
            "f1": 0.919
          },
          {
            "tag": "URL",
            "precision": 0,
            "recall": 0,
            "f1": 0
          },
          {
            "tag": "Location",
            "precision": 0.976,
            "recall": 0.921,
            "f1": 0.948
          }
        ]
      }
    }
  }
}
```

</p>
</details>

```graphql
query TrainFromFile {
  training(
    # the same arguments as for 'training' query
  ) {
    # the same uotput data format as for 'training' query
  }
}
```

### Example of building new CRF model on training data passed to query

- training data will be saved to "NERLabeledData" Kind in normalized format
- training data may be retrieved back from Maana later with the query - readProgress()

```graphql
mutation TrainFromTextToKind {
  trainingToKind(
    data: {
      name: "myData" # give any name to your dataset
      labels: "{\"Person\": \"value1\", \"Location\": \"value2\"}" # some additional info which is not used for training purpose
      sources: [
        {
          # formats may be different (see normalization above)
          text: "<Person>William Gilbert</Person> was born in <Location>Colchester, England</Location>, into a middle class family of some wealth. He entered <Organization>St. John's College</Organization>, <Location>Cambridge</Location>, in <Date>1558</Date> and obtained an B.A. in <Date>1561</Date>, an M.A. in <Date>1564</Date>, and finally an M.D. in <Date>1569</Date>. Upon receiving this last degree, he became a senior fellow of the <Organization>college</Organization>, where he held several offices. <Person>Gilbert</Person> set up a medical practice in <Location>London</Location> in the <Date>1570s</Date> and became a member of the <Organization>Royal College of Physicians</Organization> (the body that regulated the practice of medicine in <Location>London</Location> and <Location>Vicinity</Location>). He held a number of offices in the <Organization>college</Organization> and in <Date>1600</Date> was elected president. He never married."
        }
        {
          text: "Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, <Person>Isaac Newton</Person> (<Date>1643-1727</Date>), who was born in <Location>Lincolnshire</Location>, outlined the laws of mechanics that now underpin vast swaths of classical physics. Most important of all, <Person>Newton</Person> outlined the principle of gravity, which explained how the planets revolve round the sun. During his life, he was showered with honours, including the presidency of the <Organization>Royal Society</Organization>. He is renowned as a supreme rationalist, though he actually wrote more about alchemy and religion, including a 300,000-word treatise that attempted to prove the pope was really the Antichrist and an “apocalyptic whore”."
        }
        {
          text: "Born in <Location>Copenhagen</Location>, <Person>Bohr</Person> (<Date>1885-1962</Date>) developed the modern idea of an atom, which has a nucleus at the centre with electrons revolving round it. When electrons move from one energy level to another, they emit discrete quanta of energy. The work won <Person>Bohr</Person> a <Prize>Nobel prize</Prize> in <Date>1922</Date>. For his achievements, <Organization>Carlsberg brewery</Organization> gave <Person>Bohr</Person> a special gift: a house with a pipeline connected to its brewery next door, thus providing him with free beer for life. In <Date>1954</Date>, <Person>Bohr</Person> helped establish <Organization>Cern</Organization>, the <Location>European</Location> particle physics facility. In <Date>1975</Date>, his son, <Person>Aage</Person>, won a <Prize>Nobel</Prize> for research on atomic nuclei."
        }
      ]
    }
    model: {
      name: "myModel" # give any name to model which will be built and saved to Maana
      #URL: "/local/path/to/myModel.ser.gz" # if you want to save model locally
    }
    splitRate: 0.7 # 70% for training, 30% for testing
    seed: 5
    decimals: 3 # precision of output metrics
  ) {
    timeStamp
    modelKind
    dataKind
    params
    timeToLearn
    trainStat {
      name
      phraseCount
      statOverAll {
        precision
        recall
        f1
      }
    }
    testStat {
      name
      phraseCount
      statOverAll {
        precision
        recall
        f1
      }
    }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "trainingToKind": {
      "timeStamp": "3/26/2019, 10:49:00 AM",
      "modelKind": "{\"id\":\"bc8cb939-fe11-4afa-94cb-b35cac0a97f9\",\"url\":\"https://ci05.corp.maana.io:8443/downloads/bc8cb939-fe11-4afa-94cb-b35cac0a97f9/myModel.ser.gz\",\"name\":\"myModel\"}",
      "dataKind": "{\"kind\":\"NERLabeledData\",\"kindId\":\"98ccb480-43c3-4cd1-b953-2cba6bafa7bd\",\"recordId\":\"b036d81d-9691-4f60-a174-f9e718428e46\"}",
      "params": "{\"splitRate\":0.7,\"seed\":5}",
      "timeToLearn": "00:00:00.867",
      "trainStat": {
        "name": "Train",
        "phraseCount": 9,
        "statOverAll": {
          "precision": 1,
          "recall": 0.926,
          "f1": 0.962
        }
      },
      "testStat": {
        "name": "Test",
        "phraseCount": 4,
        "statOverAll": {
          "precision": 0.845,
          "recall": 0.545,
          "f1": 0.663
        }
      }
    }
  }
}
```

</p>
</details>

### Example of testing from file:

- data.URL is a path or URL to data file of many formats: .json, .csv, .tsv, .txt (see explanation below)

```graphql
mutation AccyracyTestFromFile {
  testingToKind(
    data: {
      name: "BOEM_labeled"
      URL: "../library/src/test/resources/BOEM_labeled.json" # formats: .json, .csv, .tsv, .txt"
      # URL: "%PUBLIC_BACKEND_URI%/downloads/1250010d-5844-48aa-84ae-d96b28ab5d90/BOEM_labeled.json", # example of URL from Maana
      # kindId: "1250010d-5844-48aa-84ae-d96b28ab5d90" # use Kind ID if data was uploaded to Maana
    }
    model: {
      name: "myModel" # new model will be saved to Maana as a kind file with this name
      # URL: "path/or/URL/to/myModel.ser.gz" # if local path is specified then model will also be saved to this path as well
    }
    decimals: 3 # precision of statistical metrics
  ) {
    name
    timeStamp
    elapsedTime
    phraseCount
    statOverAll {
      tag
      expectedCount
      observedCount
      truePositives
      falsePositives
      falseNegatives
      precision
      recall
      f1
    }
    statPerEntity {
      tag
      # expectedCount
      # observedCount
      # truePositives
      # falsePositives
      # falseNegatives
      precision
      recall
      f1
    }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "testingToKind": {
      "name": "Test: \"myModel\" on: \"BOEM_labeled\"",
      "timeStamp": "4/1/2019, 1:31:02 PM",
      "elapsedTime": "00:00:05.976",
      "phraseCount": 1700,
      "statOverAll": {
        "tag": "OverAll",
        "expectedCount": 8360,
        "observedCount": 6800,
        "truePositives": 6680,
        "falsePositives": 162,
        "falseNegatives": 1680,
        "precision": 0.976,
        "recall": 0.798,
        "f1": 0.878
      },
      "statPerEntity": [
        {
          "tag": "Email",
          "precision": 0,
          "recall": 0,
          "f1": 0
        },
        {
          "tag": "DateKind",
          "precision": 0.998,
          "recall": 0.818,
          "f1": 0.899
        },
        {
          "tag": "Organization",
          "precision": 0.975,
          "recall": 0.801,
          "f1": 0.88
        },
        {
          "tag": "TimeKind",
          "precision": 0.982,
          "recall": 0.602,
          "f1": 0.747
        },
        {
          "tag": "PhoneNumber",
          "precision": 0,
          "recall": 0,
          "f1": 0
        },
        {
          "tag": "Person",
          "precision": 0.965,
          "recall": 0.889,
          "f1": 0.926
        },
        {
          "tag": "URL",
          "precision": 0,
          "recall": 0,
          "f1": 0
        },
        {
          "tag": "Location",
          "precision": 0.977,
          "recall": 0.926,
          "f1": 0.951
        }
      ]
    }
  }
}
```

</p>
</details>

### Example of testing on the data passed to query

The only difference from 'testing' query is that mutation will make a record into the 'CRFModelStat' Kind in Maana

```graphql
mutation AccyracyTestFromTexts {
  testingToKind(
    model: {
      # kindId: "eac35cca-19bf-41b8-94a4-9a6ccec211bf"
      name: "myModel"
      # URL: "/path/or/URL/to/file/myModel.ser.gz"
    }
    data: {
      name: "myData"
      labels: "{\"Person\": \"value1\", \"Location\": \"value2\"}"
      sources: [
        {
          # Entities may be represented inside input text as xml-tags
          text: "<Person>William Gilbert</Person> was born in <Location>Colchester, England</Location>, into a middle class family of some wealth. He entered <Organization>St. John's College</Organization>, <Location>Cambridge</Location>, in <Date>1558</Date> and obtained an B.A. in <Date>1561</Date>, an M.A. in <Date>1564</Date>, and finally an M.D. in <Date>1569</Date>. Upon receiving this last degree, he became a senior fellow of the <Organization>college</Organization>, where he held several offices. <Person>Gilbert</Person> set up a medical practice in <Location>London</Location> in the <Date>1570s</Date> and became a member of the <Organization>Royal College of Physicians</Organization> (the body that regulated the practice of medicine in <Location>London</Location> and <Location>Vicinity</Location>). He held a number of offices in the <Organization>college</Organization> and in <Date>1600</Date> was elected president. He never married."
        }
        {
          # or with addition list of entities with short info (tag, token)
          text: "Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, Isaac Newton (1643-1727), who was born in Lincolnshire, outlined the laws of mechanics that now underpin vast swaths of classical physics. Most important of all, Newton outlined the principle of gravity, which explained how the planets revolve round the sun. During his life, he was showered with honours, including the presidency of the Royal Society. He is renowned as a supreme rationalist, though he actually wrote more about alchemy and religion, including a 300,000-word treatise that attempted to prove the pope was really the Antichrist and an “apocalyptic whore”."
          entities: [
            { tag: "Person", token: "Isaac Newton" }
            { tag: "Date", token: "1643-1727" }
            { tag: "Location", token: "Lincolnshire" }
            { tag: "Person", token: "Newton" }
            { tag: "Organization", token: "Royal Society" }
          ]
        }
        {
          # or with complete info with offset and span
          text: "Born in Copenhagen, Bohr (1885-1962) developed the modern idea of an atom, which has a nucleus at the centre with electrons revolving round it. When electrons move from one energy level to another, they emit discrete quanta of energy. The work won Bohr a Nobel prize in 1922. For his achievements, Carlsberg brewery gave Bohr a special gift: a house with a pipeline connected to its brewery next door, thus providing him with free beer for life. In 1954, Bohr helped establish Cern, the European particle physics facility. In 1975, his son, Aage, won a Nobel for research on atomic nuclei."
          entities: [
            { tag: "Location", token: "Copenhagen", offset: 8, span: 10 }
            { tag: "Person", token: "Bohr", offset: 20, span: 4 }
            { tag: "Date", token: "1885-1962", offset: 26, span: 9 }
            { tag: "Person", token: "Bohr", offset: 248, span: 4 }
            { tag: "Prize", token: "Nobel prize", offset: 255, span: 11 }
            { tag: "Date", token: "1922", offset: 270, span: 4 }
            {
              tag: "Organization"
              token: "Carlsberg brewery"
              offset: 298
              span: 17
            }
            { tag: "Person", token: "Bohr", offset: 321, span: 4 }
            { tag: "Date", token: "1954", offset: 449, span: 4 }
            { tag: "Person", token: "Bohr", offset: 455, span: 4 }
            { tag: "Organization", token: "Cern", offset: 477, span: 4 }
            { tag: "Location", token: "European", offset: 487, span: 8 }
            { tag: "Date", token: "1975", offset: 526, span: 4 }
            { tag: "Person", token: "Aage", offset: 541, span: 4 }
            { tag: "Prize", token: "Nobel", offset: 553, span: 5 }
          ]
        }
      ]
    }
    decimals: 3
  ) {
    timeStamp
    name
    phraseCount
    dataKind
    elapsedTime
    phraseCount
    statOverAll {
      precision
      recall
      f1
    }
  }
}
```

```graphql
query Test {
  testing(
    # the same arguments as for 'testingToKind' query
  ) {
    # the same uotput data format as for 'testingToKind' query
  }
}
```

### Example of "get Model" query.

Return Model in format - encoded Base64 String
Parameter 'length':

1.  if omitted or 0 or >= model size then return whole Model
2.  otherwise - return first portion of bytes, next query return next portion, etc. until return 0 which means end of model

```graphql
query GetModel {
  getModel(
    model: {
      # kindId: "eac35cca-19bf-41b8-94a4-9a6ccec211bf"
      # URL: "path/or/URL/to/crf_model.ser.gz"
      name: "myModel"
    }
    length: 1024 # if 0 then return whole model (base64 string)
  )
}
```

### Example of extending XML-tagged entities throughout the whole text.

If we labeled small part of text and want to extend labeling throughout the whole text, we can use extendXMLText() or extend() functions. Service will build new CRF Model on labeled sentences only and applies this model to whole text to detect other entities. After that we can make correction of detected entities and repeat process again.
So, service works as auto-annotation system to spead up of training datasets preparation process.

```graphql
query ExtendXMLLabeling {
  extendXMLText(
    model: {
      #URL: "/the/new/CRF/model/will/be/saved/by/this/path/as/myNewNERModel.ser.gz"
      name: "myNewNERModel"
    }
    text: "<Person>William Gilbert</Person> was born in <Location>Colchester, England</Location>, into a middle class family of some wealth. He entered <Organization>St. John's College</Organization>, <Location>Cambridge</Location>, in <Date>1558</Date> and obtained an B.A. in <Date>1561</Date>, an M.A. in <Date>1564</Date>, and finally an M.D. in <Date>1569</Date>. Upon receiving this last degree, he became a senior fellow of the <Organization>college</Organization>, where he held several offices. <Person>Gilbert</Person> set up a medical practice in <Location>London</Location> in the <Date>1570s</Date> and became a member of the <Organization>Royal College of Physicians</Organization> (the body that regulated the practice of medicine in <Location>London</Location> and <Location>Vicinity</Location>). He held a number of offices in the <Organization>college</Organization> and in <Date>1600</Date> was elected president. He never married. Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, Isaac Newton ( 1643 - 1727 ), who was born in Lincolnshire, outlined the laws of mechanics that now underpin vast swaths of classical physics. Most important of all, Newton outlined the principle of gravity, which explained how the planets revolve round the sun. During his life, he was showered with honours, including the presidency of the Royal Society. He is renowned as a supreme rationalist, though he actually wrote more about alchemy and religion, including a 300,000-word treatise that attempted to prove the pope was really the Antichrist and an “apocalyptic whore”."
  )
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "extendXMLText": "<Person>William Gilbert</Person> was born in <Location>Colchester, England</Location>, into a middle class family of some wealth.\nHe entered <Organization>St. John's College</Organization>, <Location>Cambridge</Location>, in <Date>1558</Date> and obtained an B.A. in <Date>1561</Date>, an M.A. in <Date>1564</Date>, and finally an M.D. in <Date>1569</Date>.\nUpon receiving this last degree, he became a senior fellow of the <Organization>college</Organization>, where he held several offices.\n<Person>Gilbert</Person> set up a medical practice in <Location>London</Location> in the <Date>1570s</Date> and became a member of the <Organization>Royal College of Physicians</Organization> (the body that regulated the practice of medicine in <Location>London</Location> and <Location>Vicinity</Location>).\nHe held a number of offices in the <Organization>college</Organization> and in <Date>1600</Date> was elected president.\nHe never married.\nCo-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, Isaac Newton ( 1643 - <Date>1727</Date> ), who was born in <Location>Lincolnshire</Location>, outlined the laws of mechanics that now underpin vast swaths of classical physics.\nMost important of all, Newton outlined the principle of gravity, which explained how the planets revolve round the sun.\n<Person>During</Person> his life, he was showered with honours, including the presidency of the <Organization>Royal Society</Organization>.\nHe is renowned as a supreme rationalist, though he actually wrote more about alchemy and religion, including a 300,000-word treatise that attempted to prove the pope was really the <Location>Antichrist</Location> and an “apocalyptic whore”."
  }
}
```

</p>
</details>

### Example of extending tagged entities throughout the whole text.

- This function not only extend labeling but return probabilities {prob} of entity detection. It allows us to pay more attention and correct entities with low probability first.
- Moreover it calculate probabilities of k best annotations related to whole text. If we see that difference between first and second k-best probabilities is big enough it good sign of model verification.

- calcProb : calculation of probability distribution vector for each detected entity
- k : if > 0, return probabilities of k best annotations (related to whole text)

```graphql
query ExtendLabeling {
  extend(
    model: {
      #URL: "/the/new/CRF/model/will/be/saved/by/this/path/as/myNewNERModel.ser.gz"
      name: "myNewNERModel"
    }
    source: {
      text: "William Gilbert was born in Colchester, England, into a middle class family of some wealth. He entered St. John's College, Cambridge, in 1558 and obtained an B.A. in 1561, an M.A. in 1564, and finally an M.D. in 1569. Upon receiving this last degree, he became a senior fellow of the college, where he held several offices. Gilbert set up a medical practice in London in the 1570s and became a member of the Royal College of Physicians (the body that regulated the practice of medicine in London and Vicinity). He held a number of offices in the college and in 1600 was elected president. He never married. Co-inventor of calculus, a major contributor to the science of optics and a gifted mathematician, Isaac Newton ( 1643 - 1727 ), who was born in Lincolnshire, outlined the laws of mechanics that now underpin vast swaths of classical physics. Most important of all, Newton outlined the principle of gravity, which explained how the planets revolve round the sun. During his life, he was showered with honours, including the presidency of the Royal Society. He is renowned as a supreme rationalist, though he actually wrote more about alchemy and religion, including a 300,000-word treatise that attempted to prove the pope was really the Antichrist and an “apocalyptic whore”."
      entities: [
        { tag: "Person", token: "William Gilbert" }
        { tag: "Location", token: "Colchester, England" }
        { tag: "Organization", token: "St. John's College" }
        { tag: "Location", token: "Cambridge" }
        { tag: "Date", token: "1558" }
        { tag: "Date", token: "1561" }
        { tag: "Date", token: "1564" }
        { tag: "Date", token: "1569" }
        { tag: "Organization", token: "college" }
        { tag: "Person", token: "Gilbert" }
        { tag: "Location", token: "London" }
        { tag: "Date", token: "1570s" }
        { tag: "Organization", token: "Royal College of Physicians" }
        { tag: "Location", token: "London" }
        { tag: "Location", token: "Vicinity" }
        { tag: "Organization", token: "college" }
        { tag: "Date", token: "1600" }
      ]
    }
    calcProb: true
    k: 3
    decimals: 3
  ) {
    xtext
    kBestProb
    entities {
      tag
      token
      span
      offset
      prob {
        tag
        prob
      }
      tokens
      start
      end
    }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "extend": {
      "xtext": "<Person>William Gilbert</Person> was born in ...",
      "kBestProb": [0.741, 0.0463, 0.029],
      "entities": [
        {
          "tag": "Person",
          "token": "William Gilbert",
          "span": 15,
          "offset": 0,
          "prob": [
            //...
          ],
          "tokens": ["William", "Gilbert"],
          "start": 0,
          "end": 2
        },
        //...,
        {
          "tag": "Organization",
          "token": "Royal Society",
          "span": 13,
          "offset": 1047,
          "prob": [
            //...
          ],
          "tokens": ["Royal", "Society."],
          "start": 13,
          "end": 15
        }
        //...
      ]
    }
  }
}
```

</p>
</details>

### Example of 'split to sentences' query

It's not just splitting text to sentences by dots, it's more complicated splitting based on Stanford model.
Try your own examples to understand how it works.

```graphql
query SplitToSentences {
  splitToSentences(
    text: "Saint Petersburg (Russian: Санкт-Петербу́рг) is Russia's second-largest city after Moscow, with 5 million inhabitants in 2012, part of the Saint Petersburg agglomeration with a population of 6.2 million (2015). An important Russian port on the Baltic Sea, it has a status of a federal subject (a federal city). Situated on the Neva River, at the head of the Gulf of Finland on the Baltic Sea, it was founded by Tsar Peter the Great on 27 May [O.S. 16 May] 1703. On 1 September 1914, the name was changed from Saint Petersburg to Petrograd (Russian: Петрогра́д), on 26 January 1924 to Leningrad (Russian: Ленингра́д), and on 1 October 1991 back to its original name. During the periods 1713–1728 and 1732–1918, Saint Petersburg was the capital of Imperial Russia. In 1918, the central government bodies moved to Moscow, which is about 625 km (388 miles) to the south-east. Saint Petersburg is one of the most modern cities of Russia, as well as its cultural capital. The Historic Centre of Saint Petersburg and Related Groups of Monuments constitute a UNESCO World Heritage Site. Saint Petersburg is home to the Hermitage, one of the largest art museums in the world. Many foreign consulates, international corporations, banks and businesses have offices in Saint Petersburg."
  )
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "splitToSentences": [
      "Saint Petersburg (Russian: Санкт-Петербу́рг) is Russia's second-largest city after Moscow, with 5 million inhabitants in 2012, part of the Saint Petersburg agglomeration with a population of 6.2 million (2015).",
      "An important Russian port on the Baltic Sea, it has a status of a federal subject (a federal city).",
      "Situated on the Neva River, at the head of the Gulf of Finland on the Baltic Sea, it was founded by Tsar Peter the Great on 27 May [O.S. 16 May] 1703.",
      "On 1 September 1914, the name was changed from Saint Petersburg to Petrograd (Russian: Петрогра́д), on 26 January 1924 to Leningrad (Russian: Ленингра́д), and on 1 October 1991 back to its original name.",
      "During the periods 1713–1728 and 1732–1918, Saint Petersburg was the capital of Imperial Russia.",
      "In 1918, the central government bodies moved to Moscow, which is about 625 km (388 miles) to the south-east.",
      "Saint Petersburg is one of the most modern cities of Russia, as well as its cultural capital.",
      "The Historic Centre of Saint Petersburg and Related Groups of Monuments constitute a UNESCO World Heritage Site.",
      "Saint Petersburg is home to the Hermitage, one of the largest art museums in the world.",
      "Many foreign consulates, international corporations, banks and businesses have offices in Saint Petersburg."
    ]
  }
}
```

</p>
</details>

### Example of extending tagged entities for each of input text.

```graphql
query ExtendBatchLabeling {
  extendBatch(
    model: {
      #URL: "/the/new/CRF/model/will/be/saved/by/this/path/as/myNewNERModel.ser.gz"
      name: "myNewNERModel"
    }
    sources: [
      {
        text: "William Gilbert was born in Colchester, England, into a middle class family of some wealth. He entered St. John's College, Cambridge, in 1558 and obtained an B.A. in 1561, an M.A. in 1564, and finally an M.D. in 1569. Upon receiving this last degree, he became a senior fellow of the college, where he held several offices. Gilbert set up a medical practice in London in the 1570s and became a member of the Royal College of Physicians (the body that regulated the practice of medicine in London and vicinity). He held a number of offices in the college and in 1600 was elected president. He never married."
        entities: [
          { tag: "Person", token: "William Gilbert" }
          { tag: "Location", token: "Colchester, England" }
          { tag: "Organization", token: "St. John's College" }
          { tag: "Location", token: "Cambridge" }
          { tag: "Date", token: "1558" }
          { tag: "Degree", token: "B.A." }
          { tag: "Date", token: "1561" }
          { tag: "Degree", token: "M.A." }
          { tag: "Date", token: "1564" }
          { tag: "Degree", token: "M.D." }
          { tag: "Date", token: "1569" }
          { tag: "Organization", token: "college" }
          { tag: "Person", token: "Gilbert" }
          { tag: "Location", token: "London" }
          { tag: "Date", token: "1570s" }
          { tag: "Organization", token: "Royal College of Physicians" }
          { tag: "Location", token: "London" }
          { tag: "Location", token: "Vicinity" }
          { tag: "Organization", token: "college" }
          { tag: "Date", token: "1600" }
        ]
      }
      {
        text: "Isaac Newton (1643-1727), who was born in Lincolnshire, outlined the laws of mechanics that now underpin vast swaths of classical physics. Most important of all, Newton outlined the principle of gravity, which explained how the planets revolve round the sun. During his life, he was showered with honours, including the presidency of the Royal Society. He is renowned as a supreme rationalist, though he actually wrote more about alchemy and religion, including a 300,000-word treatise that attempted to prove the pope was really the Antichrist and an “apocalyptic whore”."
      }
    ]
    calcProb: true
    k: 3
    decimals: 3
  ) {
    xtext
    kBestProb
    entities {
      tag
      token
      span
      offset
      prob {
        tag
        prob
      }
      tokens
      start
      end
    }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "extendBatch": [
      {
        "xtext": "<Person>William Gilbert</Person> was born in ...",
        "kBestProb": [0.763, 0.132, 0.0107],
        "entities": [
          {
            "tag": "Person",
            "token": "William Gilbert",
            "span": 15,
            "offset": 0,
            "prob": [
              //...
            ] //...
          },
          {
            "tag": "Location",
            "token": "Colchester, England",
            "span": 19,
            "offset": 28,
            "prob": [
              //...
            ] //...
          }
          //...
        ]
      },
      {
        "xtext": "<Person>Isaac</Person> Newton (1643-1727), who was born in ...",
        "kBestProb": [0.0141, 0.00747, 0.00512],
        "entities": [
          {
            "tag": "Person",
            "token": "Isaac",
            "span": 5,
            "offset": 0,
            "prob": [
              //...
            ] //...
          }
          //...
        ]
      }
    ]
  }
}
```

</p>
</details>

### Examples of extract query to run with default Stanford model:

```graphql
query Extract {
  extract(source: "Mikhael lives in Seattle and works for Google.") {
    text
    xtext
    entities {
      tag
      token
      span
      offset
      tokens
      start
      end
    }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "extract": {
      "text": "Mikhael lives in Seattle and works for Google.",
      "xtext": "<Person>Mikhael</Person> lives in <Location>Seattle</Location> and works for <Organization>Google</Organization>.",
      "entities": [
        {
          "tag": "Person",
          "token": "Mikhael",
          "span": 7,
          "offset": 0,
          "tokens": ["Mikhael"],
          "start": 0,
          "end": 1
        },
        {
          "tag": "Location",
          "token": "Seattle",
          "span": 7,
          "offset": 17,
          "tokens": ["Seattle"],
          "start": 3,
          "end": 4
        },
        {
          "tag": "Organization",
          "token": "Google",
          "span": 6,
          "offset": 39,
          "tokens": ["Google."],
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

### Example of batch extract query to run with default Stanford model:

```graphql
query Extract {
  extractBatch(
    sources: [
      "Los Angeles, is the second most populous city in the United States, after New York City, and the third most populous city in North America."
      "With an estimated 4,000,000 residents, Los Angeles is the cultural, financial, and commercial center of Southern California."
      "The Los Angeles metropolitan area also has a gross metropolitan product of $1.044 trillion"
      "Los Angeles hosted the 1932 and 1984 Summer Olympics and will host the event for a third time in 2028."
      "Historically home to the Chumash and Tongva, Los Angeles was claimed by Juan Rodríguez Cabrillo for Spain in 1542 along with the rest of what would become Alta California."
      "During the war, more aircraft were produced in one year than in all the pre-war years since the Wright brothers flew the first airplane in 1903, combined."
      "According to the 2010 Census, the racial makeup of Los Angeles included: 1,888,158 Whites (49.8%), 365,118 African Americans (9.6%), 28,215 Native Americans (0.7%), 426,959 Asians (11.3%)."
      "The average annual temperature of the sea is 63 °F (17 °C), from 58 °F (14 °C) in January to 68 °F (20 °C) in August."
    ]
  ) {
    # text
    xtext
    # entities { tag token span offset tokens start end }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "extractBatch": [
      {
        "xtext": "<Location>Los Angeles</Location>, is the <ORDINAL>second</ORDINAL> most populous city in the <Location>United States</Location>, after <Location>New York City</Location>, and the <ORDINAL>third</ORDINAL> most populous city in <Location>North America</Location>."
      },
      {
        "xtext": "With an estimated <Number>4,000,000</Number> residents, <Location>Los Angeles</Location> is the cultural, financial, and commercial center of <Location>Southern California</Location>."
      },
      {
        "xtext": "The <Location>Los Angeles</Location> metropolitan area also has a gross metropolitan product of <Currency>$1.044 trillion</Currency>"
      },
      {
        "xtext": "<Location>Los Angeles</Location> hosted the <DateKind>1932</DateKind> and <DateKind>1984 Summer</DateKind> <MISC>Olympics</MISC> and will host the event for a <ORDINAL>third</ORDINAL> time in <DateKind>2028</DateKind>."
      },
      {
        "xtext": "Historically home to the <MISC>Chumash</MISC> and <MISC>Tongva</MISC>, <Location>Los Angeles</Location> was claimed by <Person>Juan Rodríguez Cabrillo</Person> for <Location>Spain</Location> in <DateKind>1542</DateKind> along with the rest of what would become <Location>Alta California</Location>."
      },
      {
        "xtext": "During the war, more aircraft were produced in <DURATION>one year</DURATION> than in all <DURATION>the pre-war years</DURATION> since the <Person>Wright</Person> brothers flew the <ORDINAL>first</ORDINAL> airplane in <DateKind>1903</DateKind>, combined."
      },
      {
        "xtext": "According to the <DateKind>2010</DateKind> Census, the racial makeup of <Location>Los Angeles</Location> included: <Number>1,888,158</Number> Whites (<Percentage>49.8%</Percentage>), <Number>365,118</Number> <MISC>African Americans</MISC> (<Percentage>9.6%</Percentage>), <Number>28,215</Number> <MISC>Native Americans</MISC> (<Percentage>0.7%</Percentage>), <Number>426,959</Number> <MISC>Asians</MISC> (<Percentage>11.3%</Percentage>)."
      },
      {
        "xtext": "The average <SET>annual</SET> temperature of the sea is <Number>63</Number> °F (<Number>17</Number> °C), from <Number>58</Number> °F (<Number>14</Number> °C) in <DateKind>January</DateKind> to <Number>68</Number> °F (<Number>20</Number> °C) in <DateKind>August</DateKind>."
      }
    ]
  }
}
```

</p>
</details>

### Examples of extract query to run with customer model:

- calcProb : calculation of probability distribution vector for each detected entity
- k : if > 0, return probabilities of k best annotations (related to whole text)

```graphql
query ExtractWithModel {
  extract(
    source: "Daily update notification made to BSEE Houma District, Bobby Nelson."
    model: {
      URL: "../library/src/test/resources/BOEM_model.ser.gz" # Path to model file or URL if model was loaded to Maana as a Kind
      # kindId: "<use Kind ID if model file was uploaded to Maana as a Kind>"
      # name: "<use model name if it was trained and service was not restarted since that time (cached model)>"
    }
    calcProb: true # if true, you'll get probability distribution vector (it works with customer model only)
    k: 3 # calculation of k annotations with best probabilities
    decimals: 2 # using scientific notation of rounding: 0.0045712 => 4.6e-3 (if decimals: 2)
  ) {
    text
    xtext
    kBestProb
    entities {
      tag
      token
      span
      offset
      prob {
        tag
        prob
      }
      tokens
      start
      end
    }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

- text: original text
- xtext: xml marked text
- entities: array of entities with: tag, token (entity itself as it appear in the text), span, offset

```json
{
  "data": {
    "extract": {
      "text": "Daily update notification made to BSEE Houma District, Bobby Nelson.",
      "xtext": "Daily update notification made to <Organization>BSEE</Organization> <Location>Houma District</Location>, <Person>Bobby Nelson</Person>.",
      "kBestProb": [1, 0.00017, 0.000048],
      "entities": [
        {
          "tag": "Organization",
          "token": "BSEE",
          "span": 4,
          "offset": 34,
          "prob": [
            {
              "tag": "Email",
              "prob": 3.1e-14
            },
            {
              "tag": "DateKind",
              "prob": 6.5e-14
            },
            {
              "tag": "Organization",
              "prob": 1
            },
            {
              "tag": "TimeKind",
              "prob": 2e-13
            },
            {
              "tag": "PhoneNumber",
              "prob": 1.9e-14
            },
            {
              "tag": "Person",
              "prob": 1.8e-8
            },
            {
              "tag": "URL",
              "prob": 3.7e-14
            },
            {
              "tag": "Location",
              "prob": 2.1e-8
            },
            {
              "tag": "O",
              "prob": 0.0000046
            }
          ],
          "tokens": ["BSEE"],
          "start": 5,
          "end": 6
        },
        {
          "tag": "Location",
          "token": "Houma District",
          "span": 14,
          "offset": 39,
          "prob": [
            {
              "tag": "Email",
              "prob": 3.6e-10
            },
            {
              "tag": "DateKind",
              "prob": 3.7e-10
            },
            {
              "tag": "Organization",
              "prob": 7.4e-7
            },
            {
              "tag": "TimeKind",
              "prob": 3.5e-9
            },
            {
              "tag": "PhoneNumber",
              "prob": 1.1e-10
            },
            {
              "tag": "Person",
              "prob": 5.6e-10
            },
            {
              "tag": "URL",
              "prob": 1.7e-12
            },
            {
              "tag": "Location",
              "prob": 1
            },
            {
              "tag": "O",
              "prob": 0.0000037
            }
          ],
          "tokens": ["Houma", "District,"],
          "start": 6,
          "end": 8
        },
        {
          "tag": "Person",
          "token": "Bobby Nelson",
          "span": 12,
          "offset": 55,
          "prob": [
            {
              "tag": "Email",
              "prob": 6.1e-8
            },
            {
              "tag": "DateKind",
              "prob": 2.3e-9
            },
            {
              "tag": "Organization",
              "prob": 0.0000025
            },
            {
              "tag": "TimeKind",
              "prob": 2.9e-10
            },
            {
              "tag": "PhoneNumber",
              "prob": 3e-8
            },
            {
              "tag": "Person",
              "prob": 1
            },
            {
              "tag": "URL",
              "prob": 1.9e-10
            },
            {
              "tag": "Location",
              "prob": 4e-9
            },
            {
              "tag": "O",
              "prob": 0.0000012
            }
          ],
          "tokens": ["Bobby", "Nelson."],
          "start": 8,
          "end": 10
        }
      ]
    }
  }
}
```

</p>
</details>

### Example of batch extract query. It takes a list of texts as an input.

```graphql
query ExtractBatchWithModel {
  extractBatch(
    sources: [
      "Daily update notification made to BSEE Houma District, Bobby Nelson."
      "David Stanley lives in Lake Charles and works for MMS."
    ]
    model: {
      URL: "../library/src/test/resources/BOEM_model.ser.gz" # Path to model file or URL if model was loaded to Maana as a Kind
      # kindId: "<use Kind ID if model file was uploaded to Maana as a Kind>"
      # name: "<use model name if it was trained and service was not restarted since that time (cached model)>"
    }
    calcProb: true # if true, you'll get probability distribution vector (it works with customer model only)
    k: 3 # calculation of k annotations with best probabilities
    decimals: 2 # using scientific notation of rounding: 0.0045712 => 4.6e-3 (if decimals: 2)
  ) {
    xtext
    kBestProb
    entities {
      tag
      token
      span
      offset
      tokens
      start
      end
    }
  }
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "extractBatch": [
      {
        "xtext": "Daily update notification made to <Organization>BSEE</Organization> <Location>Houma District</Location>, <Person>Bobby Nelson</Person>.",
        "kBestProb": [1, 0.00017, 0.000048],
        "entities": [
          {
            "tag": "Organization",
            "token": "BSEE",
            "span": 4,
            "offset": 34,
            "tokens": ["BSEE"],
            "start": 5,
            "end": 6
          },
          {
            "tag": "Location",
            "token": "Houma District",
            "span": 14,
            "offset": 39,
            "tokens": ["Houma", "District,"],
            "start": 6,
            "end": 8
          },
          {
            "tag": "Person",
            "token": "Bobby Nelson",
            "span": 12,
            "offset": 55,
            "tokens": ["Bobby", "Nelson."],
            "start": 8,
            "end": 10
          }
        ]
      },
      {
        "xtext": "<Person>David Stanley</Person> lives in <Location>Lake Charles</Location> and works for <Organization>MMS</Organization>.",
        "kBestProb": [1, 0.00016, 0.00006],
        "entities": [
          {
            "tag": "Person",
            "token": "David Stanley",
            "span": 13,
            "offset": 0,
            "tokens": ["David", "Stanley"],
            "start": 0,
            "end": 2
          },
          {
            "tag": "Location",
            "token": "Lake Charles",
            "span": 12,
            "offset": 23,
            "tokens": ["Lake", "Charles"],
            "start": 4,
            "end": 6
          },
          {
            "tag": "Organization",
            "token": "MMS",
            "span": 3,
            "offset": 50,
            "tokens": ["MMS."],
            "start": 9,
            "end": 10
          }
        ]
      }
    ]
  }
}
```

</p>
</details>

### Example of "is surface form" query - returns true if a particular source is exactly a surface form of "entityName"

```graphql
query IsSurfaceForm {
  isSurfaceForm(source: "Seattle", tag: "Location")
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "isSurfaceForm": true
  }
}
```

</p>
</details>

```graphql
query IsSurfaceFormWithModel {
  isSurfaceForm(
    source: "BOEM"
    tag: "Organization"
    model: {
      URL: "../library/src/test/resources/BOEM_model.ser.gz" # Path to model file or URL if model was loaded to Maana as a Kind
      # kindId: "<use Kind ID if model file was uploaded to Maana as a Kind>"
      # name: "<use model name if it was trained and service was not restarted since that time (cached model)>"
    }
  )
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "isSurfaceForm": true
  }
}
```

</p>
</details>

### Example of parse query:

```graphql
query Parse {
  parse(source: "Forrest Gump")
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

- returns the parsed entity name if the source text is exactly as entity with no additional text to the left or right of the entity,
- otherwise return empty string.

```json
{
  "data": {
    "parse": "Forrest Gump"
  }
}
```

</p>
</details>

```graphql
query ParseWithModel {
  parse(
    source: "BOEM"
    model: {
      URL: "../library/src/test/resources/BOEM_model.ser.gz" # Path to model file or URL if model was loaded to Maana as a Kind
      # kindId: "<use Kind ID if model file was uploaded to Maana as a Kind>"
      # name: "<use model name if it was trained and service was not restarted since that time (cached model)>"
    }
  )
}
```

<details style="color:green">
<summary>click to expand output results</summary>
<p>

```json
{
  "data": {
    "parse": "BOEM"
  }
}
```

</p>
</details>
