# Key West live music updater

**What it does:** every 4 hours, all year, GitHub Actions runs `update.mjs`. It pulls the
current Key West lineups and writes `data/kw-music.json`. The "Who's Playing in Key West"
section at the top of `key_west.html` reads that file and shows:

- **The Move:** a suggested 3-stop crawl for the selected day (best sets first, different
  venues, at least 90 minutes apart, from noon on).
- **Favorites Radar:** the next posted date for each favorite and "one to chase" name.
- **Full Lineup:** every venue for the day, best venues first.

## Sources
| Source | What it covers |
|---|---|
| keywesttourist.com/live-music | About 30 bars, roughly 9 days ahead (Green Parrot, Smokin' Tuna, Rick's, Sloppy Joe's, Hank's, Irish Kevin's, Blue Heaven...) |
| joetheshow.com calendar feed | Every posted Joe the Show gig |
| irishkevins.com calendar feed | Irish Kevin's stage, further ahead |
| scottkirby.com calendar feed | Scott Kirby's Key West dates only |

Schooner Wharf's own site blocks automated checks, so Schooner (and Raven) only show up
when the aggregator lists them.

If a source fails, its previous events are kept so the page never goes blank. The page shows
which sources are down and warns if the data is more than 10 hours old.

## Changing things
All settings are at the top of `update.mjs`:
- `FAVORITES` and `CHASE`: names to boost (favorites get a star).
- `VENUES`: venue weights and the one-line reason shown on the card.
- `SOURCES`: add another WordPress "The Events Calendar" site by copying a `tribe` line.

## Running it by hand
GitHub > Actions > "Key West live music (every 4 hours)" > Run workflow.

## Costs
None. GitHub Actions is free for public repositories. Each run takes under a minute.
