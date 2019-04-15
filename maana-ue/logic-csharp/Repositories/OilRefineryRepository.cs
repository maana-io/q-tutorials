namespace netBox.Repositories
{
  using System;
  using System.Collections.Generic;
  using System.Text.RegularExpressions;
  using System.Linq;
  using System.Threading;
  using System.Threading.Tasks;
  using netBox.Models;

  public class OilRefineryRepository : IOilRefineryRepository
  {
    public Task<List<OilRefinery>> ParseOilRefineries(string input, CancellationToken cancellationToken)
    {
      string[] lines = input.Split('\n');
      List<OilRefinery> refineries = new List<OilRefinery>();
      Regex refineryRegex = new Regex("^(.+?),?\\s+(\\d[^\\s]+)", RegexOptions.Compiled);
      Regex commaDecimal = new Regex(",\\d{2}\\s", RegexOptions.Compiled);
      Regex hasText = new Regex("\\w", RegexOptions.Compiled);

      string country = "";
      string region = "";
      string continent = "";
      foreach (string line in lines)
      {
        if (line.StartsWith("="))
        {
          //location
          int start = line.IndexOf(" ") + 1;
          int end = line.IndexOf("=", start) - 1;
          if (start == 3)
          {
            continent = line.Substring(start, end - start);
            country = "";
            region = "";
          }
          else if (start == 4)
          {
            country = line.Substring(start, end - start);
            region = "";
          }
          else
          {
            region = line.Substring(start, end - start);
          }
        }
        else if (country != "")
        {
          OilRefinery refinery = new OilRefinery();
          if (refineryRegex.IsMatch(line))
          {
            Match m = refineryRegex.Match(line);
            foreach (Group g in m.Groups)
            {
              foreach (Capture c in g.Captures)
              {
                Console.WriteLine(c.Value);
              }
            }
            refinery.Id = m.Groups[1].Captures[0].Value;
            double capacity = 0;
            string capacityMatch = m.Groups[2].Captures[0].Value;
            if (commaDecimal.IsMatch(capacityMatch))
            {
              capacityMatch = capacityMatch.Replace(',', '.');
            }
            double.TryParse(capacityMatch.Replace(",", ""), out capacity);
            if (line.Contains("tonne/year") || line.Contains("MMTPA"))
            {
              capacity = capacity * 23150.68; // Convert from millions of tonne/year to bbl/d
            }
            refinery.Capacity = capacity;
          }
          else if (hasText.IsMatch(line))
          {
            // Assume a refinery without capacity
            refinery.Id = line;
            refinery.Capacity = 0; //Default to 0 for refineries without defined capacities
          }
          if (refinery.Id != null)
          {
            refinery.Location = string.Join(", ", new string[] { region, country, continent }.SkipWhile(x => x.Length == 0));
            refineries.Add(refinery);
          }

        }
      }

      return Task.FromResult(refineries);
    }
  }
}
