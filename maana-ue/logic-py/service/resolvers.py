import re
import logging

logger = logging.getLogger(__name__)

resolvers = {
    'Query': {
        'info': lambda value, info, **args: "Maana python template. Used as a basis for creating microservices.",
        'extractRefineryDetailsFromText': lambda value, info, **args: parse_refineries(args['text'])
    },
    'Mutation': {
        'info': lambda value, info, **args: "Maana python template. Used as a basis for creating microservices."
    },
    'Refinery': {},
}


def parse_refineries(refinery_text):
    # with open(fname, 'r') as f:
        # refinery_text = f.read()
    # logger.debug(refinery_text)
    refinery_text_split = refinery_text.split('\\n')
    if len(refinery_text_split) == 1:
        refinery_text_split = refinery_text.split('\n')
    # logger.debug(len(refinery_text_split))
    capacity_regex = r'(.*) (\d+\,\d+(,\d+)*)(.*) bbl/d(.*)'
    location_regex = r'=+ (.*) =+'
    number_exists = r'(.*)\d+(.*)'

    refineries = []
    missed = []
    location = None

    for refinery_line in refinery_text_split:
        location_matches = re.match(location_regex, refinery_line)
        capacity_matches = re.match(capacity_regex, refinery_line)
        number_matches = re.match(number_exists, refinery_line)
        ID = None
        capacity = None
        if location_matches:
            logger.debug(f'location: {location_matches.group(1)}')
            location = location_matches.group(1)
        if capacity_matches and location:
            ID = capacity_matches.group(1).strip(",")
            capacity = capacity_matches.group(2).replace(",", "")
            logger.debug(
                f"""{ID} | {capacity} | {capacity_matches.group(3)} \n line: {refinery_line} \n""")
            if ID and capacity and location:
                d = {"id": ID, "location": location,
                     "capacity": int(capacity.replace(",", ""))}
                refineries.append(d)
        if not capacity_matches and not location_matches and len(refinery_line) and number_matches:
            logger.debug(f'none of the above: {refinery_line}')
            missed.append(refinery_line)
    logger.debug(f'missed: {len(missed)}')
    return refineries
