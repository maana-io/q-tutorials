from BaseQuery import BaseQueryClass
from GetNearbyWellsForLocation import GetNearbyWellsForLocation
from jsonpath_rw import parse
import json


class GetDrillingReportsForWells(BaseQueryClass):

    def __init__(self, well_json):
        super().__init__()
        self.query = """
                    {
                        allDrillingReports {
                            id
                            well {
                                id
                            }
                            drillingProblem{
                              id
                            }
                        }
                    }
                    """
        self.report_expr = parse('data.allDrillingReports[*]')
        self.report_id_expr = parse('id')
        self.well_id_expr = parse('well.id')
        self.problem_expr = parse('drillingProblem')

        self.well_json = well_json

    def get_drilling_reports(self):

        """
        Gets the drilling reports, extracts relevant info, narrows to nearby wells.

        The set of nearby wells is part of the initialization of the class.
        This set is processed to a data structure for later use.
        The CKG is queried for all drilling reports, and that information is merged with the
        nearby well data to restrict to that set of wells.

        :return: Dictionaries {well_id, distance} and {well_id, {problems}}
        """

        well_dist_dict, well_probs_dict = self.process_nearby_wells()

        result = super().run_query(self.query)

        self.process_report_information(result, well_dist_dict, well_probs_dict)

        return well_dist_dict, well_probs_dict

    def process_nearby_wells(self):

        """
        Parses the nearby wells JSON to a data structure and populates the dictionaries

        :return: Dictionaries {well_id, distance} and {well_id, {problems}} (second one is empty)
        """
        well_dist_dict = dict()
        well_probs_dict = dict()
        well_expr = parse("data.nearbyWells[*]")
        wid_expr = parse("id")
        did_expr = parse("dist")

        for match in well_expr.find(self.well_json):
            wid = wid_expr.find(match.value)
            dist = did_expr.find(match.value)
            well_dist_dict[str(wid[0].value)] = dist[0].value
            well_probs_dict[str(wid[0].value)] = dict()

        return well_dist_dict, well_probs_dict

    def process_report_information(self, result, wdd, wpd):

        """
        Process the reports and populates the well dictionaries.

        Using only those reports associated with a nearby well, extracts problems
        Populates the well_probs_dict with these problems and counts of occurrences

        :param result: The reports returned by the query allDrillingReports
        :param wdd: Dictionary {well_id, distance}
        :param wpd: Empty dictionary {well_id, {}}
        :return: None - dictionaries are passed by reference
        """
        for match in self.report_expr.find(result):  #For each report
            wid = self.well_id_expr.find(match.value)   #Get the well id
            well_id = str(wid[0].value)

            if well_id in wdd.keys():   #If this is a nearby well
                drilling_problem = self.problem_expr.find(match.value)

                #print('drilling_problem')
                prob_key = str(drilling_problem[0].value['id'])
                #print(prob_key)
                wp = wpd[well_id]

                if prob_key in wp.keys():
                    old_value = wp[prob_key]
                    #print(old_value)
                    wp[prob_key] = old_value + 1
                    #print(wp[prob_key])
                else:
                    #print('not there')
                    wp[prob_key] = 1
                wpd[well_id] = wp

                #print(wpd)


class GetExpectedProblemsForLocation:

    def __init__(self, wdd, wpd, max_dist):
        self.well_dist_dict = wdd
        self.well_problem_dict = wpd
        self.max_problem_distance = max_dist

    def get_expected_problems(self):

        """
        Aggregates the sets of problems for the nearby wells and calculates probabilities for the location.

        For each nearby well, the problems are rolled up by type and discounted by distance.
        For each problem type, the weighted counts are average to give a probability of occurrence at the
        designated drilling location.

        :return: JSON representation of the ExpectedDrillingProblems
        """

        exp_problem_dict = dict()   #problem, prob
        nearby_well_count = 0

        for well_id, well_info in self.well_dist_dict.items():
            well_distance = well_info
            well_probs = self.well_problem_dict[well_id]

            if float(well_distance) < float(self.max_problem_distance) and len(well_probs.keys()) > 0:
                nearby_well_count = nearby_well_count + 1
                problem_count = dict()

                for problem, count in well_probs.items():
                    if problem in problem_count.keys():
                        problem_count[problem] = problem_count[problem] + count
                    else:
                        problem_count[problem] = count

                for problem, count in problem_count.items():
                    probability = (1 - float(well_distance)/float(self.max_problem_distance))**(1/float(count))
                    if problem in exp_problem_dict.keys():
                        exp_problem_dict[problem] = exp_problem_dict[problem] + probability
                    else:
                        exp_problem_dict[problem] = probability

        for problem, count in exp_problem_dict.items():
            exp_problem_dict[problem] = exp_problem_dict[problem] / nearby_well_count

        json_result = self.format_results_as_json(exp_problem_dict)
        return json_result

    def format_results_as_json(self, epd):

        """
        Provide a JSON representation of the expected drilling problems

        :param epd: expected problems in {problem_id, probability} form
        :return: JSON string of that information for use in graphql
        """

        json_result = '{"data": {"expectedDrillingProblems": ['
        count = 0
        item_count = len(epd)

        for k, v in epd.items():
            count = count + 1
            result_line = '{"drillingProblem":' + k + ', "probability":' + str(v) + '}'
            json_result = json_result + result_line
            if count < item_count:
                json_result = json_result + ','

        json_result = json_result + ']}}'

        return json_result


def main():
    lq = GetNearbyWellsForLocation(drilling_location=(29.511,-93.275), num=5)
    nearbyWells = lq.get_nearby_wells()
    print('Completed get_nearby_wells')
    print(nearbyWells)

    reportq = GetDrillingReportsForWells(well_json=json.loads(nearbyWells))

    wdd, wpd = reportq.get_drilling_reports()
    print('\nCompleted get_drilling_reports')
    print(wdd)
    print(wpd)

    exp_problem = GetExpectedProblemsForLocation(wdd, wpd, max_dist=.1)
    result_json = exp_problem.get_expected_problems()
    print(result_json)
    return result_json


if __name__ == "__main__":
    main()