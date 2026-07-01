Matched Format v9

Fix:
- Sunday and Monday rebuilt on the exact same page size as Friday/Saturday: 342 x 594 pt.
- Same header scale, frame, theme box, typography proportions, footer, and section flow.
- Golf cart pickup remains the first move of both days.
- Monday keeps Andrea only as: Book if available: Andrea Trattoria Italiana.

Verification:
{
  "source_zip": "Cooney_Cape_May_250_Escape_CART_PICKUP_v8.zip",
  "new_daily_pdf_files": [
    "04_Friday_Arrival_250_Warmup_LINKFIX_v9.pdf",
    "05_Saturday_America_250_Main_Event_LINKFIX_v9.pdf",
    "06_Sunday_DEPOT_CART_PICKUP_VICTORY_LAP_v9.pdf",
    "07_Monday_CAPE_MAY_CARTS_PICKUP_FREEDOM_v9.pdf"
  ],
  "all_page_sizes_match": true,
  "all_render_sizes_match": true,
  "pdf_verify": {
    "04_Friday_Arrival_250_Warmup_LINKFIX_v9.pdf": {
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
      "contains_depot": false,
      "contains_cape_may_carts": false,
      "contains_andrea_soft": false,
      "link_count": 3,
      "bad_links": [],
      "png": "/mnt/data/matched_format_v9_previews/04_Friday_Arrival_250_Warmup_LINKFIX_v9.png"
    },
    "05_Saturday_America_250_Main_Event_LINKFIX_v9.pdf": {
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
      "contains_depot": false,
      "contains_cape_may_carts": false,
      "contains_andrea_soft": false,
      "link_count": 4,
      "bad_links": [],
      "png": "/mnt/data/matched_format_v9_previews/05_Saturday_America_250_Main_Event_LINKFIX_v9.png"
    },
    "06_Sunday_DEPOT_CART_PICKUP_VICTORY_LAP_v9.pdf": {
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
      "contains_depot": true,
      "contains_cape_may_carts": false,
      "contains_andrea_soft": false,
      "link_count": 4,
      "bad_links": [],
      "png": "/mnt/data/matched_format_v9_previews/06_Sunday_DEPOT_CART_PICKUP_VICTORY_LAP_v9.png"
    },
    "07_Monday_CAPE_MAY_CARTS_PICKUP_FREEDOM_v9.pdf": {
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
      "contains_depot": false,
      "contains_cape_may_carts": true,
      "contains_andrea_soft": true,
      "link_count": 3,
      "bad_links": [],
      "png": "/mnt/data/matched_format_v9_previews/07_Monday_CAPE_MAY_CARTS_PICKUP_FREEDOM_v9.png"
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