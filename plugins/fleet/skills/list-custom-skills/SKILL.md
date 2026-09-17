---
name: list-custom-skills
description: Print a clean one-line summary of every custom skill in the fleet plugin. Use when the user types /list-custom-skills or asks "what custom skills do I have", "show my skills", "list my skills".
allowed-tools:
  - Bash
---

# List Custom Skills

Run exactly this command and print its output verbatim — no preamble, no commentary, no trailing text:

```bash
for d in $(find ~/.claude/plugins ~/code/hypertheory/fleet -name SKILL.md -path '*fleet*' 2>/dev/null | xargs -n1 dirname | awk -F/ '!seen[$NF]++' | sort -t/ -k1,1); do
  name=$(basename "$d")
  desc=$(grep -m1 "^description:" "$d/SKILL.md" 2>/dev/null | sed 's/^description: *//' | sed 's/\. .*$/./')
  printf "| /%s | %s |\n" "$name" "$desc"
done
```

The `sed 's/\. .*$/./'` keeps only the first sentence of each skill's description (everything up to the first period followed by a space). That's the one-liner.

Wrap the rows in a markdown table header so the output is:

```
| Skill | What it does |
|---|---|
| /name | one-liner |
| ...   | ...       |
```

That's the entire response. No "Here are your skills:" intro. Just the table.
