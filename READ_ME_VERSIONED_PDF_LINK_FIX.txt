Versioned PDF Link Fix

Why this build exists:
- Overwriting same PDF filenames can still show old broken Safari-cached PDF annotations.
- This build renames daily itinerary PDFs and updates the site to use the new filenames.
- All PDF-to-PDF links inside those PDFs now use full HTTPS URLs with cache busting.

{
  "source_zip": "Cooney_Cape_May_250_Escape_ALL_PDF_LINKS_FIXED.zip",
  "renamed_daily_pdfs": {
    "pdfs/daily_plans/04_Friday_TRANSPORT_GUIDE_v12.pdf": "pdfs/daily_plans/04_Friday_TRANSPORT_GUIDE_v12.pdf",
    "pdfs/daily_plans/05_Saturday_TRANSPORT_GUIDE_v12.pdf": "pdfs/daily_plans/05_Saturday_TRANSPORT_GUIDE_v12.pdf",
    "pdfs/daily_plans/06_Sunday_DEPOT_CART_CHARGE_BREAK_v12.pdf": "pdfs/daily_plans/06_Sunday_DEPOT_CART_CHARGE_BREAK_v12.pdf",
    "pdfs/daily_plans/07_Monday_CAPE_MAY_CARTS_CHARGE_BREAK_v12.pdf": "pdfs/daily_plans/07_Monday_CAPE_MAY_CARTS_CHARGE_BREAK_v12.pdf"
  },
  "version": "v=pdf-links-v4",
  "patch_counts": {
    "pdfs/daily_plans/04_Friday_TRANSPORT_GUIDE_v12.pdf": 3,
    "pdfs/daily_plans/05_Saturday_TRANSPORT_GUIDE_v12.pdf": 4,
    "pdfs/daily_plans/06_Sunday_DEPOT_CART_CHARGE_BREAK_v12.pdf": 3,
    "pdfs/daily_plans/07_Monday_CAPE_MAY_CARTS_CHARGE_BREAK_v12.pdf": 4
  },
  "daily_pdf_verification": {
    "pdfs/daily_plans/04_Friday_TRANSPORT_GUIDE_v12.pdf": {
      "exists": true,
      "link_count": 3,
      "links": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "works Target: Mad Batter for vacation-friendly late breakfast/lunch. Backup: Blue Pig Tavern for classic Congress Hall energy. Open Bars & Restaurants Playbook for the seat move 3:"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "May night Primary: Blue Pig Tavern for polished Cape May classic. More harbor-vibe option: Lobster House Dockside if you want marina early. Open Bars & Restaurants Playbook for the"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "nightcap Wander Congress Hall / Beach Ave to understand Saturday's fireworks zone. Optional: Congress Hall bar or Rusty Nail. Open Bars & Restaurants Playbook for the seat move Fri"
        }
      ],
      "bad_remaining": []
    },
    "pdfs/daily_plans/05_Saturday_TRANSPORT_GUIDE_v12.pdf": {
      "exists": true,
      "link_count": 4,
      "links": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "11:30 AM-1:00 PM - Late brunch/lunch Primary: Mad Batter - late breakfast/lunch window fits your vacation rhythm. Backup: Blue Pig Tavern - polished and classic. Open Bars & Restau"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "and Grille Confirmed reservation: 3 people. Eat slow. Ask early about rooftop/sundeck/fireworks access. Open Bars & Restaurants Playbook for the seat move 6:45-8:30 PM - Work the c"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/09_July_4_Backup_Fireworks_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "Plan A: Congress Hall waitlist opens. Plan B: Harry's rooftop / Montreal sundeck transition. Plan C: Beach Ave/promenade backup. Open July 4 Fireworks Backup Playbook 8:45 PM - Mov"
        },
        {
          "page": 2,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "10:00 PM-late - Debrief drink High energy: Rusty Nail or Boiler Room. Perfectly done: Wilbraham and call it legendary. Open Bars & Restaurants Playbook for the seat move Saturday w"
        }
      ],
      "bad_remaining": []
    },
    "pdfs/daily_plans/06_Sunday_DEPOT_CART_CHARGE_BREAK_v12.pdf": {
      "exists": true,
      "link_count": 3,
      "links": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "brunch/lunch Primary: Blue Pig Tavern for classic recovery food. Backup: Mad Batter if you want late brunch again. Open Bars & Restaurants Playbook for the seat move 1:15-3:00 PM -"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "3:30-6:15 PM - Marina magic round two Primary move: Lobster House Dockside / Marina at golden hour. This is where it starts becoming your place. Open Bars & Restaurants Playbook fo"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "9:00 PM-late - Music or clean landing Music mood: Rusty Nail, side of band. Late-night mood: Boiler Room edge/bar. Cooked: Wilbraham. Open Bars & Restaurants Playbook for the seat "
        }
      ],
      "bad_remaining": []
    },
    "pdfs/daily_plans/07_Monday_CAPE_MAY_CARTS_CHARGE_BREAK_v12.pdf": {
      "exists": true,
      "link_count": 4,
      "links": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "11:30 AM-1:00 PM - Brunch/lunch Primary: Mad Batter if you still have not done it right. Backup: Blue Pig patio/edge table. Open Bars & Restaurants Playbook for the seat move 1:15-"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/10_Hidden_Gems.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "Option A: Emlen Physick Estate for Victorian Cape May. Option B: Cape May Lighthouse / Cape May Point. Option C: winery/farm reset if everyone wants space. Open Hidden Gems Card 3:"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "3:30-5:45 PM - Favorite repeat Pick the weekend winner: Marina, Harry's, Rusty Nail, Congress Hall, or Wilbraham porch reset. Open Bars & Restaurants Playbook for the seat move 6:3"
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=pdf-links-v4",
          "file": "",
          "near_text": "9:00 PM-late - Final toast Congress Hall bar for classy final-drink energy. Rusty Nail if you want music. Wilbraham if quiet is perfect. Open Bars & Restaurants Playbook for the se"
        }
      ],
      "bad_remaining": []
    }
  },
  "html_daily_pdf_links": {
    "daily_plans.html": [
      "pdfs/daily_plans/04_Friday_TRANSPORT_GUIDE_v12.pdf",
      "pdfs/daily_plans/05_Saturday_TRANSPORT_GUIDE_v12.pdf",
      "pdfs/daily_plans/06_Sunday_DEPOT_CART_CHARGE_BREAK_v12.pdf",
      "pdfs/daily_plans/07_Monday_CAPE_MAY_CARTS_CHARGE_BREAK_v12.pdf"
    ],
    "index.html": [
      "pdfs/daily_plans/04_Friday_TRANSPORT_GUIDE_v12.pdf",
      "pdfs/daily_plans/05_Saturday_TRANSPORT_GUIDE_v12.pdf",
      "pdfs/daily_plans/06_Sunday_DEPOT_CART_CHARGE_BREAK_v12.pdf",
      "pdfs/daily_plans/07_Monday_CAPE_MAY_CARTS_CHARGE_BREAK_v12.pdf"
    ]
  }
}