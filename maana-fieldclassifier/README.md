# Maana Field Classifier and Field Classifier Assistant

The Field Classifier Service and Field Classifier Assistant are tools for strongly typing tabular data inside Maana.  A column of data might contain names of people, but has the column name "contact".  The field classifier can identify recommended classifications for this type of data and then the user can select a type to enforce it's classification.  The strongly typed column is then ready to be used in services that only operate on specific types and/or be part of a larger logic and reasoning process.

This Knowledge Service provides the concept of strongly typed data which can be used during interaction with other services.

## Field Classifier (Assistant) Inside the Platform

To start with, upload a CSV file, in this case we use [operator](operator.csv).  Load the data into the platform.  Bring the Kind for the operator.csv file into the workspace by clicking the link on the bottom of operator.csv - the Kind will be called "OperatorCSV".  As soon as the CSV file is uploaded the field classifier is kicked off and classifications for each of the columns of the tabular data are produced.  Critically, the data has two interesting classifications, "Person" and "Organization" for the fields "contact" and "business". ![](upload.png)

Make sure the "OperatorCSV" is selected then in the assistants panel, select "Maana Field Classifier", this brings up the user interface for the field classifier.  In the upper left hand corner it should say "OperatorCSV"
![](fca.png)

Scroll down to the fieldId "contact".  To the right there should be a "proposedType" of "Person" along with 2 buttons, "Add All" and "Add Matching".  When you click on one of these buttons it creates a new column of the "OperatorCSV" kind with the name "contactPerson" which is the concatenation of the original field name "contact" and the strong type "Person".

The "Add All" button adds all the data in the "contact" column to the new column "contactPerson".  The "Add Matching" button adds only the data that is classified as type "Person" to the "contactPerson" column - all other non matching records are empty.

There are also additional fields, the "Type" field is the original graphql type which has limited expressivity - STRING, FLOAT, BOOLEAN etc...  The ProposedType can contain any of the types available as classifications from the field classifier.  The Percent column gives an estimate of the percentage of records that matched a given classification, this is an estimate as only 1000 columns of the original data are used to produce the estimate.

When the "Add Matching" or "Add All" buttons are clicked the data from "contact" say, is added to the "Person" kind inside Maana.  The Ids for those instances are stored in the new "contactPerson" column.  In this way, multiple different kinds can refer to the same "Person", we then have a common location for "Person" data and associations between different data sources.
![](newColumn.png)
![](people.png)

## Using Strongly Typed Fields as Inputs to Functions
...  More on this later.



