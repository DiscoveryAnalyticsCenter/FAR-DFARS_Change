# Section Text Extractor for DFARS and NDAA

These Python files expect an input file in the format that Stevens sends for NDAA matches. 

### DFARS

`dfars/2025` is the zip file download from the [DFARS archive](https://www.acquisition.gov/archives/dfars-change-1012025)

```
python lookup_dfars.py dfars/2025 stevens_matches_2025.json matches2025_dfars.json
```

### NDAA

Senate seems to use a different XML format than House. This script will try to pick the right XSLT file for transform. These XML files come from congress.gov as in the XML link [on this page](https://www.congress.gov/bill/118th-congress/house-bill/2670/text).

```
python lookup_ndaa_bs4.py ndaa/PLAW-118publ159_uslm2025.xml matches2025_dfars.json -o matches2025_dfars_ndaa.json
```