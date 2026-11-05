# Berean Standard Bible text for Ask Flourish

`bsb.txt` is the Berean Standard Bible, one verse per line (`Book C:V<TAB>text`),
from https://bereanbible.com/bsb.txt. The BSB has been dedicated to the public domain.

The Flourish API (the `flourish` Supabase Edge Function) downloads this file the
first time someone uses Ask Flourish, checks its SHA-256 against the value pinned
in `supabase/functions/flourish/ask.ts`, and refuses it if they differ. Do not
edit it: change the pin and the file together, in that order.

SHA-256: 2ac3af1de52d4e68261cba91d85c320b7eadc6560e830d99e591767b8ff5ca96
