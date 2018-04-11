model=`cat $2 | tr '\n' ' '`
variables="{\"input\":{\"name\":\"$1\",\"schema\":\"$model\"}}"
echo $variables
graphql query ckg.gql -o addServiceSource --variables "$variables"