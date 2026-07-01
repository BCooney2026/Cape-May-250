Visible Plan Updates v6

Prior build did not rewrite the visible itinerary text. This build recreates Sunday and Monday PDFs with the new text directly in the schedule.

{
  "source_zip": "Cooney_Cape_May_250_Escape_GOLF_CART_ANDREA_UPDATE.zip",
  "new_daily_pdf_files": [
    "04_Friday_Arrival_250_Warmup_LINKFIX_v6.pdf",
    "05_Saturday_America_250_Main_Event_LINKFIX_v6.pdf",
    "06_Sunday_Victory_Lap_GOLF_CART_VISIBLE_v6.pdf",
    "07_Monday_Last_Full_Day_GOLF_CART_ANDREA_VISIBLE_v6.pdf"
  ],
  "visible_pdf_verify": {
    "06_Sunday_Victory_Lap_GOLF_CART_VISIBLE_v6.pdf": {
      "exists": true,
      "contains_golf_cart": true,
      "contains_andrea": false,
      "contains_book_if_available": false,
      "link_count": 3,
      "bad_links": [],
      "links": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        }
      ]
    },
    "07_Monday_Last_Full_Day_GOLF_CART_ANDREA_VISIBLE_v6.pdf": {
      "exists": true,
      "contains_golf_cart": true,
      "contains_andrea": true,
      "contains_book_if_available": true,
      "link_count": 5,
      "bad_links": [],
      "links": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/10_Hidden_Gems.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        }
      ]
    },
    "04_Friday_Arrival_250_Warmup_LINKFIX_v6.pdf": {
      "exists": true,
      "contains_golf_cart": false,
      "contains_andrea": false,
      "contains_book_if_available": false,
      "link_count": 3,
      "bad_links": [],
      "links": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        }
      ]
    },
    "05_Saturday_America_250_Main_Event_LINKFIX_v6.pdf": {
      "exists": true,
      "contains_golf_cart": false,
      "contains_andrea": false,
      "contains_book_if_available": false,
      "link_count": 4,
      "bad_links": [],
      "links": [
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 1,
          "uri": "https://vacation.cooneysparadise.com/pdfs/09_July_4_Backup_Fireworks_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        },
        {
          "page": 2,
          "uri": "https://vacation.cooneysparadise.com/pdfs/03_Bars_Restaurants_Playbook.pdf?v=plans-visible-v6",
          "file": ""
        }
      ]
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