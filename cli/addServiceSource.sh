
# We take two parameters:
if [ "$#" -ne 2 ]; then
  echo "Missing argument(s):"
  echo "  \$1 = name of the service"
  echo "  \$2 = GraphQL type definition of the service"
  echo ""
  echo "e.g., addServiceSource.sh Basic basic/model.gql"
  exit 1
fi

# Get the GraphQL type definition and convert it to a single line
echo "Loading model: $2..."
model=`cat $2 | tr '\n' ' '`
#echo $model

# Create a JSON string instance of a AddServiceSourceInput type
variables="{\"input\":{\"name\":\"$1\",\"schema\":\"$model\"}}"
#echo $variables

# Perform the GraphQL query "addServiceSource" on the CKG service with
# the input we constructed above
echo "Creating service: $1..."
graphql query ckg.gql -o addServiceSource --variables "$variables"