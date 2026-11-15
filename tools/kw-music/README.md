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
| keywesttourist.com/live-music | About 30 bars, roughly 9 days ahead (Green Parrot, Smokin' Tuna, Rick's, Sloppy Joe's, Hank's, Irish Kevin's, Blue Heaven, Sunset Pier...) |
| Green Parrot calendar widget | Every Green Parrot booking, usually 3+ months ahead |
| zachlovering.com schedule file | Zach Lovering's week-by-week gigs (solo and Tequila Time Machine) |
| davemininberg.com/upcoming | Dave Mininberg's posted shows (Key West only) |
| joetheshow.com calendar feed | Every posted Joe the Show gig |
| irishkevins.com calendar feed | Irish Kevin's stage, further ahead |
| scottkirby.com calendar feed | Scott Kirby's Key West dates only |

**Checked but blocked or not usable:** Schooner Wharf, Smokin' Tuna, Hog's Breath, Sloppy Joe's,
General Horseplay and Luffkid's site all block automated checks. Bandsintown needs an approved
API key. Raven, Nick Brownell, Adam Lufkin and John Bartus post their dates on Facebook or
Instagram, which can't be read automatically. They still show up whenever a listing above has them.

## Favorites Radar
- **Your Favorites** (starred, top score): Raven, Joe the Show, Nick Brownell, Zach Lovering,
  Adam Lufkin (Luffkid), Dave Mininberg, John Bartus.
- **Hot Right Now** (fire icon): calculated every run. The 3 performers booked at the most
  different venues over the next 2 weeks, across every source combined.
- **Worth Chasing**: Scott Kirby, Caffeine Carl, Drew Bear.

## Changing things
All settings are at the top of `update.mjs`:
- `FAVORITES` and `CHASE`: names to boost (favorites get a star).
- `HOT_COUNT` / `HOT_WINDOW_DAYS`: how many "Hot right now" names, and how far ahead to count.
- `VENUE_ALIASES`: when two sources spell a bar differently, map both to one name.
- `VENUES`: venue weights and the one-line reason shown on the card.
- `SOURCES`: add another WordPress "The Events Calendar" site by copying a `tribe` line.

## Running it by hand
GitHub > Actions > "Key West live music (every 4 hours)" > Run workflow.

## Costs
None. GitHub Actions is free for public repositories. Each run takes under a minute.
