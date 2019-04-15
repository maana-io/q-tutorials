from dateutil.parser import parse
import datetime
from six import string_types
from graphql.language.ast import BooleanValue, FloatValue, IntValue, StringValue

scalars = {
    'Date': {
        'description': "Datetime. Supports being passed in as a string and will try to figure out the proper formatting.",
        'parse_literal': lambda x: coerce_date_literal(x),
        'parse_value': lambda x: coerce_date(x),
        'serialize': lambda x: serialize_date(x)
    }
}


def coerce_date(value):
    # type: (str) -> Optional[datetime]
    if isinstance(value, string_types):
        return parse(value)

    if isinstance(value, datetime.datetime):
        return value

    # if isinstance(value, int):
        # return datetime.datetime.fromtimestamp(value)

    return None


def serialize_date(value):
    # type: (str) -> Optional[datetime]
    if isinstance(value, string_types):
        return value

    if isinstance(value, datetime.datetime):
        return str(value)

    # if isinstance(value, int):
        # return datetime.datetime.fromtimestamp(value)

    return None


def coerce_date_literal(ast):
    # type: (Union[StringValue]) -> Optional[datetime]
    if isinstance(ast, StringValue):
        return parse(ast.value)

    return None
