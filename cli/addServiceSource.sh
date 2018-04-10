model=`cat $1 | tr '\n' ' '`
variables="{\"input\":{\"name\":\"CLISample\",\"schema\":\"$model\"}}"
graphql query ckg.gql -o addServiceSource --variables "$variables"