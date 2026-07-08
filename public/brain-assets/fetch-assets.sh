#!/bin/bash
cd "$(dirname "$0")" 2>/dev/null
fetch() { # name url
  curl -sL --max-time 25 -o "$1" "$2" 2>/dev/null
  size=$(stat -f%z "$1" 2>/dev/null || echo 0)
  if [ "$size" -lt 2000 ]; then rm -f "$1"; echo "FAIL $1"; else echo "OK $1 ($size)"; fi
}
# --- book covers (Open Library ISBN API) ---
fetch book-elephant-brain.jpg    "https://covers.openlibrary.org/b/isbn/9780190495992-L.jpg?default=false"
fetch book-mans-search.jpg       "https://covers.openlibrary.org/b/isbn/9780807014271-L.jpg?default=false"
fetch book-thinking-fast.jpg     "https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg?default=false"
fetch book-100m-leads.jpg        "https://covers.openlibrary.org/b/isbn/9781737475774-L.jpg?default=false"
fetch book-100m-offers.jpg       "https://covers.openlibrary.org/b/isbn/9781737475736-L.jpg?default=false"
fetch book-dotcom-secrets.jpg    "https://covers.openlibrary.org/b/isbn/9781401960468-L.jpg?default=false"
fetch book-expert-secrets.jpg    "https://covers.openlibrary.org/b/isbn/9781401960476-L.jpg?default=false"
fetch book-traffic-secrets.jpg   "https://covers.openlibrary.org/b/isbn/9781401957902-L.jpg?default=false"
fetch book-ogilvy.jpg            "https://covers.openlibrary.org/b/isbn/9780394729039-L.jpg?default=false"
fetch book-purple-cow.jpg        "https://covers.openlibrary.org/b/isbn/9781591843177-L.jpg?default=false"
fetch book-zero-to-one.jpg       "https://covers.openlibrary.org/b/isbn/9780804139298-L.jpg?default=false"
fetch book-lean-startup.jpg      "https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg?default=false"
echo "---- done ----"
