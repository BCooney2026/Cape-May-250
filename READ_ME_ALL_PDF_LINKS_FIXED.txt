All PDF Internal Links Fixed

Fix:
- Converted local/relative PDF links inside daily-plan PDFs to full HTTPS URLs.
- This fixes Safari's invalid-address error from PDF viewer links.

Verification:
{
  "source_zip": "Cooney_Cape_May_250_Escape_PDF_INTERNAL_LINK_FIX.zip",
  "base_url": "https://vacation.cooneysparadise.com/",
  "patch_counts": {
    "pdfs/daily_plans/05_Saturday_America_250_Main_Event_LINKFIX_v8.pdf": 1,
    "pdfs/daily_plans/07_Monday_CAPE_MAY_CARTS_PICKUP_FREEDOM_v8.pdf": 1
  },
  "verify_problem_files": {
    "pdfs/daily_plans/04_Friday_Arrival_250_Warmup_LINKFIX_v8.pdf": {
      "exists": true,
      "links_after_patch": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf",
          "file": "",
          "near_text": "Target: Mad Batter for vacation-friendly late breakfast/lunch. Backup: Blue Pig Tavern for classic Congress Hall energy. Open Bars & Restaurants Playbook for th"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf",
          "file": "",
          "near_text": "Primary: Blue Pig Tavern for polished Cape May classic. More harbor-vibe option: Lobster House Dockside if you want marina early. Open Bars & Restaurants Playbo"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf",
          "file": "",
          "near_text": "Wander Congress Hall / Beach Ave to understand Saturday's fireworks zone. Optional: Congress Hall bar or Rusty Nail. Open Bars & Restaurants Playbook for the se"
        }
      ],
      "bad_remaining": []
    },
    "pdfs/daily_plans/05_Saturday_America_250_Main_Event_LINKFIX_v8.pdf": {
      "exists": true,
      "links_after_patch": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf",
          "file": "",
          "near_text": "Primary: Mad Batter - late breakfast/lunch window fits your vacation rhythm. Backup: Blue Pig Tavern - polished and classic. Open Bars & Restaurants Playbook fo"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf",
          "file": "",
          "near_text": "Confirmed reservation: 3 people. Eat slow. Ask early about rooftop/sundeck/fireworks access. Open Bars & Restaurants Playbook for the seat move 6:45-8:30 PM - W"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/09_July_4_Backup_Fireworks_Playbook.pdf",
          "file": "",
          "near_text": "Plan B: Harry's rooftop / Montreal sundeck transition. Plan C: Beach Ave/promenade backup. Open July 4 Fireworks Backup Playbook 8:45 PM - Move before the crowd"
        },
        {
          "page": 2,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf",
          "file": "",
          "near_text": "10:00 PM-late - Debrief drink High energy: Rusty Nail or Boiler Room. Perfectly done: Wilbraham and call it legendary. Open Bars & Restaurants Playbook for the "
        }
      ],
      "bad_remaining": []
    },
    "pdfs/daily_plans/07_Monday_CAPE_MAY_CARTS_PICKUP_FREEDOM_v8.pdf": {
      "exists": true,
      "links_after_patch": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf",
          "file": "",
          "near_text": "Primary: Mad Batter if you still have not done it right. Backup: Blue Pig patio/edge table. Open Bars & Restaurants Playbook for the seat move 1:15-3:15 PM - On"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/10_Hidden_Gems.pdf",
          "file": "",
          "near_text": "Option B: Cape May Lighthouse / Cape May Point. Option C: winery/farm reset if everyone wants space. Open Hidden Gems Card 3:30-5:45 PM - Favorite repeat Pick t"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf",
          "file": "",
          "near_text": "3:30-5:45 PM - Favorite repeat Pick the weekend winner: Marina, Harry's, Rusty Nail, Congress Hall, or Wilbraham porch reset. Open Bars & Restaurants Playbook f"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf",
          "file": "",
          "near_text": "9:00 PM-late - Final toast Congress Hall bar for classy final-drink energy. Rusty Nail if you want music. Wilbraham if quiet is perfect. Open Bars & Restaurants"
        }
      ],
      "bad_remaining": []
    }
  },
  "emoji_duration_defensive_patch": []
}