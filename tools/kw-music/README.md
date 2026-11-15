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
| livemusiceveryday.com calendar feed | Island-wide calendar (40 to 70 shows a day), about 45 days ahead; Key West and Stock Island only. Also covers Hog's Breath, whose own site blocks bots |
| schoonerwharf.com/entertainment.htm | Schooner Wharf's monthly calendar (Joe the Show Mondays, Nick Brownell, Tony Baltimore) |
| keywesttourist.com/live-music | About 30 bars, roughly 9 days ahead (Green Parrot, Smokin' Tuna, Rick's, Sloppy Joe's, Hank's, Irish Kevin's, Durty Harry's, Blue Heaven, Sunset Pier...) |
| Green Parrot calendar widget | Every Green Parrot booking, usually 3+ months ahead |
| cliffcody.com/tour | Cliff Cody's posted gigs (Key West only) |
| zachlovering.com schedule file | Zach Lovering's week-by-week gigs (solo and Tequila Time Machine) |
| davemininberg.com/upcoming | Dave Mininberg's posted shows (Key West only) |
| joetheshow.com calendar feed | Every posted Joe the Show gig |
| irishkevins.com calendar feed | Irish Kevin's stage, further ahead |
| scottkirby.com calendar feed | Scott Kirby's Key West dates only |

**The Durtbags' website calendar is set to private** (it won't display for anyone), so they come from the bar listings. If they make it public, add it under CALENDAR_FEEDS.

**Not used, on purpose:** Schooner Wharf, Smokin' Tuna, Hog's Breath, Sloppy Joe's, General
Horseplay and Luffkid's site block automated visitors, and this updater respects that rather than
disguising itself. Facebook and Instagram can't be read automatically either. Their gigs still
appear whenever one of the sources above lists them.

## Adding a calendar someone shares with you
If a performer or bar sends a Google Calendar link, add one line to `CALENDAR_FEEDS` in
`update.mjs`. For a Google Calendar, the feed address is:
`https://calendar.google.com/calendar/ical/<calendar id>/public/basic.ics`

## Screenshot lineups
For acts that only post on Facebook or Instagram (Raven/Schooner Wharf, Hog's Breath, Nick Brownell,
Caffeine Carl, the Durtbags), Brian uploads a screenshot and the lineup is typed into
`data/kw-music-manual.json`. The updater merges it every run; past dates drop off on their own.

## Favorites Radar
- **Your Favorites** (star): Raven, Joe the Show, Nick Brownell, Zach Lovering, Adam Lufkin
  (Luffkid), Dave Mininberg, John Bartus, Tony Baltimore.
- **Island's Most Popular** (trophy): Caffeine Carl, The Durtbags, Cliff Cody. Picked from the
  Bubbas (Key West People's Choice Awards), the Key West Music Awards (Iggys) and the TripAdvisor
  Key West forum, Nov 2026. Revisit each summer after the Bubbas.
- **Worth Chasing**: Scott Kirby, Nick Norman, Joal Rush, Drew Bear.

## Changing things
All settings are at the top of `update.mjs`:
- `FAVORITES` and `CHASE`: names to boost (favorites get a star).
- `ISLAND_TOP`: the island's most popular acts (edit after each year's awards).
- `CALENDAR_FEEDS`: shared calendar links to pull.
- `VENUE_ALIASES`: when two sources spell a bar differently, map both to one name.
- `VENUES`: venue weights and the one-line reason shown on the card.
- `SOURCES`: add another WordPress "The Events Calendar" site by copying a `tribe` line.

## Running it by hand
GitHub > Actions > "Key West live music (every 4 hours)" > Run workflow.

## Costs
None. GitHub Actions is free for public repositories. Each run takes under a minute.
