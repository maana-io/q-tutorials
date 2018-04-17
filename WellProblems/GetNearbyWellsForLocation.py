from BaseQuery import BaseQueryClass
from jsonpath_rw import parse
from geopy.distance import geodesic
import json


class GetNearbyWellsForLocation(BaseQueryClass):

    def __init__(self, drilling_location, num):
        super().__init__()
        self.query = """
                    {
                        allWells{
                            id
                            lat
                            long
                        }
                    }
                    """
        self.well_expr = parse('data.allWells[*]')
        self.id_expr = parse('id')
        self.lat_expr = parse('lat')
        self.lon_expr = parse('long')
        self.drilling_location = drilling_location
        self.number_of_wells = num

    def get_nearby_wells(self):
        result = super().run_query(self.query)
        well_dict = self.process_results(result)

        ref_loc = self.parse_drilling_location()
        nearby_wells = self.filter_results(well_dict, ref_loc, self.number_of_wells)

        result_json = self.format_results_as_json(nearby_wells)
        return result_json

    def process_results(self, result):
        loc_dict = dict()
        for match in self.well_expr.find(result):
            inst_id = self.id_expr.find(match.value)
            lat = self.lat_expr.find(match.value)
            lon = self.lon_expr.find(match.value)
            temp_dict = {'lat': lat[0].value, 'lon': lon[0].value}
            loc_dict[inst_id[0].value] = temp_dict

        return loc_dict

    def parse_drilling_location(self):
        ref_lat = self.lat_expr.find(self.drilling_location)
        ref_lon = self.lon_expr.find(self.drilling_location)
        return [ref_lat, ref_lon]

    def filter_results(self, loc_dict, ref_loc, number):
        dist_locs = dict()

        for inst_id, ll in loc_dict.items():
            lat = ll['lat']
            lon = ll['lon']
            loc = (lat, lon)
            dist = geodesic(loc, ref_loc).miles
            dist_locs[inst_id] = dist

        distances = sorted(dist_locs.values())

        if len(dist_locs) > 0 and number < len(dist_locs):
            cutoff_distance = distances[number]
            del_list = []

            for k, v in dist_locs.items():
                if v >= cutoff_distance:
                    del loc_dict[k]
                    del_list.append(k)

            for k in del_list:
                del dist_locs[k]

#        print('In filter_results, loc_dict is')
#        print(loc_dict)
        return dist_locs

    def format_results_as_json(self, well_dict):
        json_result = '{"data": {"nearbyWells": ['
        count = 0
        item_count = len(well_dict)

        for k,v in well_dict.items():
            count = count + 1
            result_line = '{"id":' + k + ', "dist":' + str(v) + '}'
            json_result = json_result + result_line
            if count < item_count:
                json_result = json_result + ','

        json_result = json_result + "]}}"

        return json_result


def main():
    lq = GetNearbyWellsForLocation(drilling_location="{lat: 29.511, lon: -93.275}", num=2)
#    print('In main, result to return is\n')
#    print(lq.get_nearby_wells())
    return lq.get_nearby_wells()


if __name__ == "__main__":
    main()