Links Deep Fix + Emoji +1

Fixes:
- Emoji rain lasts another 1.0 second.
- Playbook links are normalized to the actual path in this package:
  pdfs/03_Bars_Restaurants_Playbook.pdf
- Playbook links are intercepted before navigation and open an on-page modal.
- Flag video remains forced to fixed background position.

Important:
- If you click a playbook link inside a PDF opened by Safari's PDF viewer, HTML cannot intercept that click. This fix handles links on the site pages/cards. PDF-internal links are a separate PDF annotation issue.

Verification:
{
  "index.html": {
    "modal_present": true,
    "openPlaybook_present": true,
    "playbook_anchors": [
      {
        "href": "pdfs/03_Bars_Restaurants_Playbook.pdf",
        "text": "Seats matter Bars and Restaurants Playbook Specific spots, best times, best seat"
      },
      {
        "href": "pdfs/09_July_4_Backup_Fireworks_Playbook.pdf",
        "text": "Backup 4th Fireworks Fallback Ladder Best to worst options, plus what to avoid."
      },
      {
        "href": "pdfs/03_Bars_Restaurants_Playbook.pdf",
        "text": "Open full PDF"
      },
      {
        "href": "pdfs/03_Bars_Restaurants_Playbook.pdf",
        "text": "tap here to open the playbook."
      }
    ],
    "flag_fixed_css": true,
    "emoji_plus1_present": true
  },
  "daily_plans.html": {
    "modal_present": true,
    "openPlaybook_present": true,
    "playbook_anchors": [
      {
        "href": "pdfs/09_July_4_Backup_Fireworks_Playbook.pdf",
        "text": "Backup 4th Fireworks Fallback Ladder Best to worst, plus what to avoid."
      },
      {
        "href": "pdfs/03_Bars_Restaurants_Playbook.pdf",
        "text": "Open full PDF"
      },
      {
        "href": "pdfs/03_Bars_Restaurants_Playbook.pdf",
        "text": "tap here to open the playbook."
      }
    ],
    "flag_fixed_css": true,
    "emoji_plus1_present": true
  }
}