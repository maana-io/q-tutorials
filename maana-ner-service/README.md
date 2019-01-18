# Maana Named Entity Recognition (NER) service

The Maana-NER-service is for identifying entities in text and identifying their location within that text.
It using two approaches:

- Stochastic method - Stanford CRF Classifier (Conditional Random Field: https://en.wikipedia.org/wiki/Conditional_random_field) and
- Deterministic method - Tokens Regex: https://stanfordnlp.github.io/CoreNLP/tokensregex.html

## What is the service for

In particular, the service uses a stochastic approach so it can identify entities that are not explicitly present in the training set. For example, it could identify "Zack" as a name, even if "Zack" is not mentioned in the training data. The approach being used takes into account the context of words in a sentence to determine if they belong to a particular class of entity.

## Detected Entities:

| n   | Entity               | CRF | Regex |
| :-- | :------------------- | :-- | :---- |
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

## When might you want to use it

This service is important as part of a pipeline where

1.  Simply identify what text contains a particular entity.
2.  Detect multiple entities in text - this could be used in co occurrence computations where the user wants to identify a person along with a well type.
3.  The entities can be used as part of a pipeline in a larger pattern matching scheme - for example to identify phrases that have a person followed by a date (and then extract additional information using pattern based methods).
4.  As a first step in an information extraction pipeline to help fill in tables.

## Environment

The library of this service is built in java and uses the maven build tool. We currently use the following versions:

```bash
Apache Maven 3.5.2 (138edd61fd100ec658bfa2d307c43b76940a5d7d; 2017-10-18T00:58:13-07:00)
Java version: 1.8.0_121, vendor: Oracle Corporation
```

The service might have problem with Java 9, so please try to use the same version as specified for development.
Unlike java, we do not anticipate any problems with using a different maven version. But, using 3.5 is recommended.

## Building the project

you need maven, if you don't have it install it following steps in https://maven.apache.org/install.html.
If you are in OSX land then you can try installing via Hombrew (http://brewformulas.org/Maven) as follows:

```bash
brew install maven
```

you can check if maven is installed correctly on your system as follows:

```bash
mvn -version
```

After installing Maven Run this command builds the java and installs the node modules:

```bash
./install.sh
```

## Running

cd into the service directory and run this command to start the application

```bash
npm run disableAuth
```

This runs the endpoint in Eclipse Jetty webserver on port 9999.

## With Docker

Run the end to end tests with the command

```bash
docker-compose up --build --exit-code-from e2e
```

Bring up just the ner service

```bash
docker-compose up --build app
```

Run the artillery tests to determing throughput

```bash
docker-compose up --build performance
```

## Schema

```javascript
type Info {
  id: ID!
  name: String!
  description: String
}

type EntityMention {
  fromSpan: String!
  fromOffset: String!
  entityName: String!
  surfaceForm: String!
}

type Query {
  # information about the service
  info: Info!
  # extract entities from the provided source
  extract(source: String!, modelURL: String): [EntityMention]
  # extract entities from the many sources
  extractBatch(sources: [String]!, modelURL: String):[[EntityMention]]
  # detect if source text is surface form of entity
  isSurfaceForm(source: String!, entityName: String!, modelURL: String): Boolean!
  # returns the parsed entity name if the source text is exactly as entity with no additional text to the left or right of the entity
  parse(source: String!, modelURL: String): String!
}
```

## How to use it?

To extract entities from text go to [http://localhost:9999](http://localhost:9999), which brings up the graphiql interface.

## Example of queries

### Extract

An example of "extract" query to run with default Model. It returns an array of entities.

```javascript
 query Extract {
   extract(sources: ["Reaming down from 6000ft to 8000ft to clear stuck pipe. John, please get that article on www.linkedin.com or https://google.com or 192.67.23.222 from file bla123bla.doc and itisme.jpg to me by 5:00PM on Jul 4th 2018 or 4:00 am on 01/09/12 would be ideal, actually. If you have any questions about \"Maana\" or 'Google' office at \"New York\" you can reach my associate at (012)-345-6789 or (230) 241 2422 or +1(345)876-7554 or associative@mail.com or &lt;abracadabra123@maana.io>. Send me $5,987.56 or £4,123.14 or € 100 by PayPal. My SSN is 456-23-0965 My coordinates are: 47.617640, -122.191905 or 47°37'03.5\"N 122°11'30.9\"W"]) {
    entityName
    surfaceForm
    fromSpan
    fromOffset
   }
 }
```

and produces the output

<details>
<summary>

# CLICK ME

</summary>
<p>

```javascript
{
  "data": {
    "extract": [
      {
        "entityName": "Number",
        "surfaceForm": "6000ft to 8000ft",
        "fromOffset": "18",
        "fromSpan": "16"
      },
      {
        "entityName": "Person",
        "surfaceForm": "John",
        "fromOffset": "56",
        "fromSpan": "4"
      },
      {
        "entityName": "URL",
        "surfaceForm": "www.linkedin.com",
        "fromOffset": "89",
        "fromSpan": "16"
      },
      {
        "entityName": "URL",
        "surfaceForm": "https://google.com",
        "fromOffset": "109",
        "fromSpan": "18"
      },
      {
        "entityName": "IpAddress",
        "surfaceForm": "192.67.23.222",
        "fromOffset": "131",
        "fromSpan": "13"
      },
      {
        "entityName": "URL",
        "surfaceForm": "bla123bla.doc",
        "fromOffset": "155",
        "fromSpan": "13"
      },
      {
        "entityName": "URL",
        "surfaceForm": "itisme.jpg",
        "fromOffset": "173",
        "fromSpan": "10"
      },
      {
        "entityName": "TimeKind",
        "surfaceForm": "5:00PM on",
        "fromOffset": "193",
        "fromSpan": "9"
      },
      {
        "entityName": "DateKind",
        "surfaceForm": "Jul 4th 2018",
        "fromOffset": "203",
        "fromSpan": "12"
      },
      {
        "entityName": "TimeKind",
        "surfaceForm": "4:00 am on 01/09/12",
        "fromOffset": "219",
        "fromSpan": "19"
      },
      {
        "entityName": "Organization",
        "surfaceForm": "Google",
        "fromOffset": "309",
        "fromSpan": "6"
      },
      {
        "entityName": "Location",
        "surfaceForm": "New York",
        "fromOffset": "328",
        "fromSpan": "8"
      },
      {
        "entityName": "PhoneNumber",
        "surfaceForm": "-LRB-012-RRB--345-6789",
        "fromOffset": "368",
        "fromSpan": "14"
      },
      {
        "entityName": "PhoneNumber",
        "surfaceForm": "-LRB-230-RRB- 241 2422",
        "fromOffset": "386",
        "fromSpan": "14"
      },
      {
        "entityName": "PhoneNumber",
        "surfaceForm": "+1-LRB-345-RRB-876-7554",
        "fromOffset": "404",
        "fromSpan": "15"
      },
      {
        "entityName": "Email",
        "surfaceForm": "associative@mail.com",
        "fromOffset": "423",
        "fromSpan": "20"
      },
      {
        "entityName": "Currency",
        "surfaceForm": "$5,987.56",
        "fromOffset": "485",
        "fromSpan": "9"
      },
      {
        "entityName": "Currency",
        "surfaceForm": "#4,123.14",
        "fromOffset": "498",
        "fromSpan": "9"
      },
      {
        "entityName": "Currency",
        "surfaceForm": "$ 100",
        "fromOffset": "511",
        "fromSpan": "5"
      },
      {
        "entityName": "Organization",
        "surfaceForm": "PayPal",
        "fromOffset": "520",
        "fromSpan": "6"
      },
      {
        "entityName": "SocialSecurityNumber",
        "surfaceForm": "456-23-0965",
        "fromOffset": "538",
        "fromSpan": "11"
      },
      {
        "entityName": "GeoCoordinate",
        "surfaceForm": "47.617640, -122.191905",
        "fromOffset": "570",
        "fromSpan": "22"
      },
      {
        "entityName": "GeoCoordinate",
        "surfaceForm": "47°37'03.5``N 122°11'30.9``W",
        "fromOffset": "596",
        "fromSpan": "26"
      }
    ]
  }
}
```

### Extract with customer Model or Token-Regex rules

Example of extract query to run with customer model. It returns an array of entities.

```javascript
query ExtractWithModelOrRegex {
  extract(
    source: "Daily update notification made to BSEE Houma District, Bobby Nelson.",
    modelURL: "path/or/URL/to/.../crf_model.ser.gz"
  ) {
    fromSpan
    fromOffset
    entityName
    surfaceForm
  }
}
```

There is also a capability to use customer’s Token-Regex rules if specify path to Regex.rules in modelURL parameter.

### Batch Extract

Example of "batch extract" query - it takes a list of source text and returns an array of array of entities, one array for each source.

```javascript
query BatchExtract {
  extractBatch(
    sources: [
      "Daily update notification made to BSEE Houma District, Bobby Nelson.",
      "David Stanley lives in Lake Charles and works for MMS."
    ],
    modelURL: "here/may/be/a/path/or/URL/to/some/awesome/.../crf_model.ser.gz"
  ) {
    fromSpan
    fromOffset
    entityName
    surfaceForm
  }
}
```

### Is Surface Form

Example of "is surface form" query - returns true if a particular source is exactly a surface form of "entityName"

```javascript
query IsSurfaceForm {
  isSurfaceForm (source: "Seattle", entityName: "Location")
}
```

### Is Surface Form with customer Model

```javascript
query IsSurfaceFormWithModel {
  isSurfaceForm (
    source: "BOEM",
    entityName: "Organization",
    modelURL: "path/or/URL/to/.../company_crf_model.ser.gz"
  )
}
```

### Parse

Example of parse query:

- returns the parsed entity name if the source text is exactly as entity with no additional text to the left or right of the entity,
- otherwise return empty string.

```javascript
query Parce {
  parse (
    source: "Forrest Gump",
    modelURL: "path/or/URL/to/crf_model.ser.gz"
  )
}
```

## Accuracy Measurement

To measure an accuracy of Maana-NER-service with default Stanford CRF model we used sentences from oil & gas log dataset of "Bureau of Ocean Energy Management" (BOEM): https://www.boem.gov/.

### Statistics:

- Number of Expected Entities
- Number of Observed Entities
- TruePositive = Sum of detected parts (entity may be detected partially) of Expected Entities
- FalseNegative = Sum of missed parts of Expected Entities
- FalsePositive = Sum of detected parts of Unexpected Entities
- Precision = TruePositive / (TruePositive + FalsePositive)
- Recall = TruePositive / (TruePositive + FalseNegative)
- Accuracy = F1 = 2 \* Precision \* Recall / (Precision + Recall)

### Test Results:

Results of Accuracy Test on BOEM dataset with 1700 sentences:

| Entity       | expect # | observ # | True+ | False+ | False- | Pre   | Rec   | F1    |
| ------------ | -------- | -------- | ----- | ------ | ------ | ----- | ----- | ----- |
| Email        | 267      | 267      | 267   | 0      | 0      | 1.000 | 1.000 | 1.000 |
| URL          | 7        | 7        | 7     | 0      | 0      | 1.000 | 1.000 | 1.000 |
| PhoneNumber  | 105      | 104      | 104   | 0      | 1      | 1.000 | 0.990 | 0.995 |
| TimeKind     | 766      | 780      | 754   | 70     | 12     | 0.915 | 0.984 | 0.948 |
| DateKind     | 1044     | 1115     | 1024  | 95     | 20     | 0.915 | 0.981 | 0.947 |
| Person       | 2165     | 2068     | 1963  | 93     | 202    | 0.955 | 0.907 | 0.930 |
| Location     | 1817     | 1296     | 1102  | 221    | 715    | 0.833 | 0.607 | 0.702 |
| Organization | 2191     | 937      | 620   | 534    | 1571   | 0.537 | 0.283 | 0.371 |
| Over All     | 8362     | 9533     | 5842  | 1013   | 2520   | 0.852 | 0.699 | 0.768 |

### Example:

#### Text:

Thanks, Lynard Carter Workover/Completion Engineer U.S. Department of The Interior Bureau of Ocean Energy Management Reg., & Enforcement New Orleans District (504) 734-6746 phone (504) 734-6741 fax Lynard.carter@boemre.gov

#### Expected:

- Person: **Lynard Carter**
- Organization: **U.S. Department of The Interior Bureau of Ocean Energy Management Reg., & Enforcement**
- Location: **New Orleans District**
- PhoneNumber: **(504) 734-6746**
- PhoneNumber: **(504) 734-6741**
- Email: **Lynard.carter@boemre.gov**

#### Observed:

- Person: **Lynard Carter**
- Location: **U.S.**
- Organization: **Interior Bureau of Ocean Energy Management Reg.**
- Location: **New Orleans**
- PhoneNumber: **(504) 734-6746**
- PhoneNumber: **(504) 734-6741**
- Email: **Lynard.carter@boemre.gov**

| Entity       | TP    | FN    | FP    | Pre   | Rec   | F1    |
| ------------ | ----- | ----- | ----- | ----- | ----- | ----- |
| Person       | 1.000 | 0.000 | 0.000 | 1.000 | 1.000 | 1.000 |
| Email        | 1.000 | 0.000 | 0.000 | 1.000 | 1.000 | 1.000 |
| PhoneNumber  | 2.000 | 0.000 | 0.000 | 1.000 | 1.000 | 1.000 |
| Organization | 0.553 | 0.447 | 0.000 | 1.000 | 0.553 | 0.356 |
| Location     | 0.550 | 0.450 | 1.000 | 0.350 | 0.550 | 0.214 |

#### Explanation:

#### Organization:

- Expected: **U.S. Department of The Interior Bureau of Ocean Energy Management Reg. , & Enforcement**, offset: 51; span: 85
- Observed: **Interior Bureau of Ocean Energy Management Reg.**, offset: 74; span: 47

TP = 47/85 = 0.553, FN = 1 - TP = 0.447

#### Location:

- Expected: **New Orleans District**, offset: 137; span: 20
- Observed: **New Orleans**, offset: 137; span: 11

TP = 11/20 = 0.55, FN = 1 - TP = 0.45

#### Location:

- Observed but not expected: **U.S.**, offset: 51; span: 4

TP = 0, FN = 0, FP = 1
