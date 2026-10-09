"""Check local wiki links and require substantive recovery notes."""
import re
from pathlib import Path

root = Path('obsidian/TraceLab-Vault')
notes = list(root.rglob('*.md'))
known = {p.stem for p in notes}
errors = []
for path in notes:
    text = path.read_text()
    if len(text.strip()) < 180:
        errors.append(f'{path}: note is too short to be useful')
    for target in re.findall(r'\[\[([^]|#]+)(?:[^]]*)\]\]', text):
        if Path(target).name not in known:
            errors.append(f'{path}: missing wiki link {target}')
required = ['Current-State', 'Change-Ledger', '00-START-HERE', 'Recovery-Instructions']
errors += [f'missing {name}' for name in required if name not in known]
if errors:
    raise SystemExit('\n'.join(errors))
print(f'{len(notes)} substantive notes; all wiki links resolve.')
