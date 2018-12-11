# Maana Metalearning Service

Maana metalearning service is an automated machine learning service that builds machine learning pipelines for classification tasks under user's guidance. Given a kind, the user can specify feature fields and a label field, a decision space containing candidate featurizers, preprocessors and models. Metalearning service explores the decision space, builds up and tests pipelines, performs statistical analysis on their performances, and deliever insights to the user on the overall performances of each machine learning components, and the an overall best pipeline. The goal of metalearning service is to facilitate datascientists to quickly profile on data set, test their hypothesis and rapidly build new solutions.

## MetaLearning Service inside Platform

To start with, upload a CSV file, in this case we use [small_census](small_census.csv).  Load the data into the platform.  Bring the Kind for the small_census.csv file into the workspace by clicking the link on the bottom of small_census.csv - the Kind will be called "SmallCensusCSV".  As soon as the CSV file is uploaded the field classifier is kicked off and classifications for each of the columns of the tabular data are produced.  
<p><p><img src="kind.png" alt="Kind", style="height: 100%; width: 100%; align: center"/>
</p>
<em>Figure 1: View after uploading CSV and Clicking on kind link</em>
</p>

This kind contains instances that describe invididual's age, workclass, education, martialstatus, etc and its salary range. We want to build a classifier that predicate an individual's salary based on some of these features.

To trigger metalearning service, open the GraphQL interface of metalearning by Click "Maana Meta-learning" in "Inventory" panel:

<p><p><img src="service.png" alt="Service", style="height: 100%; width: 100%; align: center"/>
</p>
<em>Figure 2: Open MetaLearning GraphQL interface from Inventory</em>
</p>

From the GraphiQL interface, use TrainClassifierKind mutation to train a classifier for SmallCensusCSV 

<p><p><img src="train.png" alt="Train", style="height: 100%; width: 100%; align: center"/>
</p>
<em>Figure 3: Train Classifier from kind SmallCensusCSV</em>
</p>

In the above mutation, the kindID field is filled in with the id of kind "SmallCensusCSV". The user gives a model name, and identify label field, feature fields, candidate models and candidate preprocessors. The user also specifies to perform 2-fold cross validation for model selection, and perform 4 episodes of hyper-parameter sampling and 2 episodes of hyper-parameter search.


To visualize the results, search for kind "Dataset", and drag it to the workspace, then click the link at finalModel. The kind MachineLearningModel will show on the canvus. 

<p><p><img src="machinelearning.png" alt="MachineLearningModels", style="height: 100%; width: 100%; align: center"/>
</p>
<em>Figure 4: Trained machine learning models</em>
</p>

From the dataview panel, it shows each pipeline that has been built and tested, including its model, features, preprocessors, time to learn, accuray, and the stage they are tested. Look for the pipeline where "saved" is "True": this is the final pipeline that is built as the best.


<p><p><img src="selectedmodel.png" alt="Selected", style="height: 100%; width: 100%; align: center"/>
</p>
<em>Figure 5: Built model</em>
</p>

Following the link of features, preprocessor and labels you can see the kind that stores the detailed information:

<p><p><img src="details.png" alt="Details", style="height: 100%; width: 100%; align: center"/>
</p>
<em>Figure 6: Detailed information in Kinds</em>
</p>


<p><p><img src="preprocessor.png" alt="Preprocessor", style="height: 100%; width: 100%; align: center"/>
</p>
<em>Figure 7: Preprocessor information in Kind</em>
</p>

<p><p><img src="featurizer.png" alt="Featurizer", style="height: 100%; width: 100%; align: center"/>
</p>
<em>Figure 8: Featurizer information in Kind</em>
</p>

