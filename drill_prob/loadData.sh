set -e
gql mload data/DrillingProblem.csv -p db
gql mload data/Location.csv -p db
gql mload data/DrillingReport.csv -p db
gql mload data/Well.csv -p db
