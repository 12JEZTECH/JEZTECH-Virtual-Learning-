from pathlib import Path
from zipfile import ZipFile
import hashlib
root = Path(__file__).resolve().parents[1]
archive = root / "JEZTECH_Learning_v19_MultiSchool_Foundation.zip"
target = root / "restored-v19"
if target.exists():
    raise SystemExit("Destination already exists; refusing overwrite")
with ZipFile(archive) as z:
    entries = z.infolist()
    assert len(entries) == 228, "Unexpected archive entry count"
    assert z.testzip() is None, "CRC validation failed"
    for entry in entries:
        path = (target / entry.filename).resolve()
        if not path.is_relative_to(target.resolve()) or (entry.external_attr >> 16) & 0o170000 == 0o120000:
            raise ValueError("Unsafe archive entry")
    z.extractall(target)
print(f"Extracted {len(entries)} entries to {target}")
print("Archive SHA256:", hashlib.sha256(archive.read_bytes()).hexdigest())
