True Matched Days v10

Fix:
- Removed the green pickup callout box completely.
- Sunday/Monday cart pickup is now a normal first itinerary section like Friday/Saturday.
- Same page size and render size across all four daily PDFs.
- Confirmation codes remain visible in the first section.
- Andrea stays only in Monday dinner slot as: Book if available: Andrea Trattoria Italiana.

{
  "source_zip": "Cooney_Cape_May_250_Escape_MATCHED_FORMAT_v9.zip",
  "new_daily_pdf_files": [
    "04_Friday_Arrival_250_Warmup_LINKFIX_v10.pdf",
    "05_Saturday_America_250_Main_Event_LINKFIX_v10.pdf",
    "06_Sunday_DEPOT_CART_PICKUP_VICTORY_LAP_v10.pdf",
    "07_Monday_CAPE_MAY_CARTS_PICKUP_FREEDOM_v10.pdf"
  ],
  "all_page_sizes_match": true,
  "all_render_sizes_match": true,
  "no_green_callout_text": true,
  "pdf_verify": {
    "04_Friday_Arrival_250_Warmup_LINKFIX_v10.pdf": {
      "page_rect": [
        0.0,
        0.0,
        342.0,
        594.0
      ],
      "render_size_px": [
        479,
        832
      ],
      "contains_pickup": false,
      "contains_green_callout_words": false,
      "contains_depot": false,
      "contains_cape_may_carts": false,
      "contains_andrea_soft": false,
      "link_count": 3,
      "bad_links": [],
      "png": "/mnt/data/true_matched_days_v10_previews/04_Friday_Arrival_250_Warmup_LINKFIX_v10.png"
    },
    "05_Saturday_America_250_Main_Event_LINKFIX_v10.pdf": {
      "page_rect": [
        0.0,
        0.0,
        342.0,
        594.0
      ],
      "render_size_px": [
        479,
        832
      ],
      "contains_pickup": false,
      "contains_green_callout_words": false,
      "contains_depot": false,
      "contains_cape_may_carts": false,
      "contains_andrea_soft": false,
      "link_count": 4,
      "bad_links": [],
      "png": "/mnt/data/true_matched_days_v10_previews/05_Saturday_America_250_Main_Event_LINKFIX_v10.png"
    },
    "06_Sunday_DEPOT_CART_PICKUP_VICTORY_LAP_v10.pdf": {
      "page_rect": [
        0.0,
        0.0,
        342.0,
        594.0
      ],
      "render_size_px": [
        479,
        832
      ],
      "contains_pickup": true,
      "contains_green_callout_words": false,
      "contains_depot": true,
      "contains_cape_may_carts": false,
      "contains_andrea_soft": false,
      "link_count": 4,
      "bad_links": [],
      "png": "/mnt/data/true_matched_days_v10_previews/06_Sunday_DEPOT_CART_PICKUP_VICTORY_LAP_v10.png"
    },
    "07_Monday_CAPE_MAY_CARTS_PICKUP_FREEDOM_v10.pdf": {
      "page_rect": [
        0.0,
        0.0,
        342.0,
        594.0
      ],
      "render_size_px": [
        479,
        832
      ],
      "contains_pickup": true,
      "contains_green_callout_words": false,
      "contains_depot": false,
      "contains_cape_may_carts": true,
      "contains_andrea_soft": true,
      "link_count": 3,
      "bad_links": [],
      "png": "/mnt/data/true_matched_days_v10_previews/07_Monday_CAPE_MAY_CARTS_PICKUP_FREEDOM_v10.png"
    }
  },
  "html_verify": {
    "index.html": {
      "fri_link": true,
      "sat_link": true,
      "sun_link": true,
      "mon_link": true
    },
    "daily_plans.html": {
      "fri_link": true,
      "sat_link": true,
      "sun_link": true,
      "mon_link": true
    }
  }
}