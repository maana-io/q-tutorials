# Queries for Q training
**NOTE: The current implementation uses a BaseQuery class that contains a reference to a specific Q Workspace**
**Obviously that won't work for anyone else, but in the interest of getting the code up...**
## GetNearbyWellsForLocation
Runs off a main method (for now) that takes a drillinglocation and a number of wells. Values are defaulted. At this point (4/17, 11:53 am) consider this code completely untested (it isn't) and undocumented (it is).
Returns a JSON-formatted string like this:
```JSON
{
  "data": {
    "nearbyWells": [
      {
        "id":177000015801, 
        "dist":6404.670198800002
      },
      {
        "id":177002004401, 
        "dist":6413.677011642099
      }
    ]
  }
}
```
This may or may not be correct...
