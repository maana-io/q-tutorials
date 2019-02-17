# Q Tutorials
A collection of tutorials for learning how to use the Maana Knowledge Platform and several of the data and Data Science services that come with it.  As a learning plan, we encourage you to proceeed through the tutorials in the order below.  More advanced tutorials will be added in the future.

## Classifying the Types of Fields
This tutorial demonstrates how the Maana Field Classifier service recognizes new data added to the platform and attempts to identify the types of fields.  The tutorial covers concepts of uploading data, platform events, links, and functions.

## Using an Assistant to Add New Fields with a Different Type
This tutorial demonstrates how you can use the information produced by the Maana Field Classifier service in a custom Maana Field Classifier Assistant to create new fields with classified types.  The tutorial covers concepts of uploading data, links, the assistant panel, and adding new fields.

## Recognizing the Names of Entities in Text Data
This tutorial demonstrates how the Maana NER service, leveraging the industry state-of-the-art Stanford CoreNLP library along with Maana's custom NER regular expression patterns, recognizes the names of entities in text data.  The tutorial covers concepts of uploading data, functions, exploring function results in the JSON data Assistant.

## Using a Bot to Create Links and Instances of Recognized Entities in Text Data
This tutorial demonstrates how the Maana Entity-Extraction service leverages two other Maana services, NER and Physical Quantity, to recognize the names, or surface forms, of entities in text and create links and instances of those names.  The tutorial covers uploading data, links, and instances of surface forms.

## Recognizing Statements (subject, predict, object) in Text Data
This tutorial demonstrates how the Maana Fact Recognition service, leveraging the industry state-of-the-art Stanford CoreNLP library along with Maana's custom innovations in "by pattern filtering" and "by example reasoning" using slot filling in the Structure Mapping Engine, can recognize facts, or triples, in text.  The tutorial covers functions, the JSON data Assistant, and adding services to the Service Inventory.

## Using a Bot to Create Links and Instances of Recognized Statements in Text Data
This tutorial demonstrates how the Maana Fact Recognition service is used to recognize facts and create links between the surface form of those facts to instances of those in a new kind.  The tutorial covers functions, creating new kinds, and links.

## Recognizing and Reasoning about Physical Quantities
This tutorial demonstrates how the Maana Physical Quantity service is used to recognize the surface forms of physical quantities in text as well as to create instantiations of those quantities and reason over them: including normalization, unit conversions and algebraic equations.  The tutorial covers advanced function composition, the JSON data Assistant, and adding services to the Service Inventory.

## Automatically Building Machine Learning Models to Classify and Predict
This tutorial demonstrates how the Maana Metalearning service is used to automatically find machine learning pipelines and models that perform classification using supervised learning, using an innovative algorithm combining reinforcement learning and symbolic planning that finds models with competitive accuracy faster.  The tutorial covers uploading data, the GraphiQL Assistant, adding services to the Service Inventory, and creating new fields using machine learning classifiers. 

