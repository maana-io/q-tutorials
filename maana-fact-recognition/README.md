# Maana Fact Recognition

This service is used for extracting relations from text.  This service could extract information from the phrase "Alex bought a bicycle for 50$."  And store a series of triples "Alex", "bought", "bicycle" and "Alex", "bought a bicycle for", "50$".

## When might you want to use it
You may want to use these services if have unstructured text and want to extract person names, locations, or organizations.  In addition one can extract how people, locations, organizations ... are related to each other using the information extraction.

## How do you run/invoke it?
The various queries can be used as part of function composition, so the output of one query can be used as the input of another.  The examples below show basic use inside the function graph. 

extractTriples extracts relations from the given string.  For example "Alex bought a bike" has subject "Alex", object "bike" and action "bought".  The query below extracts the relation "Alex","bought","bike"
<p><p><img src="ExtractTriplesFunction.png" alt="Kind", style="height: 80%; width: 80%; align: center"/>
</p>
<em>Figure 4: extractTriples query run in the function graph.</em>
</p>
extractByPattern applies a filter on top of extractTriples.  In the example below the patterns list is used to only return triples (subject, action, object) that match the given pattern class.  In the query below  the pattern to match is {predicateLemmas : ["purchase"], subjectEntityPatterns : ["ANY"], objectEntityPatterns : ["ANY"]} which is a filter that will match an action similar to "purchase", in this case "bought" and then match any subject and object. 
<p><p><img src="ExtractByPattern.png" alt="Kind", style="height: 80%; width: 80%; align: center"/>
</p>
<em>Figure 4: extractByPattern query run in the function graph.</em>
</p>
extractByExample uses an example sentence - computes the various triples within that sentence and then uses that as a pattern.  The pattern is applied to the given "text" and returns matches if they are found.  In the example below, the query will match "John" to "Larry", "went" to "goes", "safeway" to "gerks", "pizza" to "bike" and "Lynwood" to "Issaquah".
<p><p><img src="ExtractByExample.png" alt="Kind", style="height: 80%; width: 80%; align: center"/>
</p>
<em>Figure 4: extractByExample query run in the function graph.</em>
</p>
